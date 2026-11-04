#!/usr/bin/env python3
"""Reproducible NPC-on/off complete-match comparisons; not balance evidence."""
import argparse
from dataclasses import asdict
import json

from check_witness import PLANS, load, sell, travel
from npc_policy import choose_npc_order
from rules_engine import Match, Order

PROFILES = {
    "dependable": {"A": PLANS["A"], "B": PLANS["B"]},
    "single_supplier": {"A": PLANS["A"], "B": {}},
    "withholding": {"A": {}, "B": {}},
    # A waits until the last pre-collapse action to sell its opening oxygen.
    "emergency_hoarder": {
        "A": {1: load("oxygen", 3), 2: travel("habitat"),
              5: sell("oxygen", 3), 6: travel("depot")},
        "B": PLANS["B"],
    },
    # A converts fuel atomically at the plant while B follows its supply plan.
    "fuel_specialist": {
        "A": {1: load("fuel", 3), 2: travel("habitat"),
              3: sell("fuel", 3), 4: travel("depot")},
        "B": PLANS["B"],
    },
    # A mixes plant conversion, medicine, and direct oxygen deliveries.
    "mixed_production": {
        "A": {1: load("fuel", 3), 2: travel("habitat"),
              3: sell("fuel", 3), 4: travel("depot"),
              5: load("medicine", 1), 6: travel("clinic"),
              7: sell("medicine", 1), 8: travel("depot"),
              10: load("oxygen", 3), 11: travel("habitat"),
              12: sell("oxygen", 3), 13: travel("depot"),
              14: load("medicine", 1), 15: travel("clinic"),
              16: sell("medicine", 1), 17: travel("depot")},
        "B": PLANS["B"],
    },
    # B delays two oxygen sales to seek scarcity pricing instead of reliability.
    "opportunist": {
        "A": PLANS["A"],
        "B": {4: load("oxygen", 3), 5: travel("habitat"),
              9: sell("oxygen", 3), 10: travel("depot"),
              13: load("oxygen", 3), 14: travel("habitat"),
              18: sell("oxygen", 3), 19: travel("depot")},
    },
    # B adapts to public colony/depot state instead of following fixed rounds.
    "adaptive_opportunist": {"A": PLANS["A"], "B": None},
}


def choose_adaptive_order(game, round_id, seat="B", pending_orders=None):
    """Choose a deterministic, deadline-safe order from public state only."""
    pending_orders = pending_orders or {}
    merchant = game.merchants[seat]
    for good in ("medicine", "oxygen", "fuel"):
        if merchant.cargo[good]:
            target = "clinic" if good == "medicine" else "habitat"
            if merchant.location == target:
                return Order("sell", good, merchant.cargo[good])
            if merchant.location == "depot":
                return Order("travel", destination=target)
            return Order("travel", destination="depot")
    if merchant.location != "depot":
        return Order("travel", destination="depot")

    # Included same-round loads are public and must not be double-counted.
    reserved_oxygen = sum(
        order.amount for other, order in pending_orders.items()
        if other != seat and order.kind == "load" and order.good == "oxygen"
    )
    available_oxygen = game.depot["oxygen"] + (3 if round_id in (1, 4, 7, 10, 13, 16) else 0)
    available_oxygen -= reserved_oxygen
    rounds_to_health_check = min((r - round_id for r in (6, 12, 18) if r >= round_id), default=99)
    if (game.colony["medicine"] == 0 and rounds_to_health_check >= 2 and
            rounds_to_health_check <= 5 and game.depot["medicine"] > 0 and
            game.colony["medicine_bought"] < 3):
        return load("medicine", 1)
    if game.colony["oxygen"] <= 4 and available_oxygen >= 3 and game.colony["quota"] >= 3:
        return load("oxygen", 3)
    return Order()


def snapshot(game):
    """Capture judge-visible economic state without mutating the match."""
    oxygen = game.colony["oxygen"]
    return {
        "colony": dict(game.colony),
        "depot": dict(game.depot),
        "next_oxygen_quote": max(4, 8 - oxygen),
        "merchants": {
            seat: {
                "cash": merchant.cash,
                "profit": merchant.cash - 25,
                "location": merchant.location,
                "tank": merchant.tank,
                "cargo": dict(merchant.cargo),
            }
            for seat, merchant in game.merchants.items()
        },
    }


def run_scenario(profile, npc_enabled, *, quota=18, treasury=180):
    game = Match(f"{profile}-npc-{'on' if npc_enabled else 'off'}")
    game.colony["quota"] = quota
    game.colony["treasury"] = treasury
    trace, rejected, stranded = [], 0, 0
    rejected_by_seat = {seat: 0 for seat in ("A", "B", "NPC")}
    rejected_reasons = {}
    contribution = {seat: {"oxygen_equivalent": 0, "medicine": 0, "payout": 0}
                    for seat in ("A", "B", "NPC")}
    plans = PROFILES[profile]
    for round_id in range(1, 21):
        orders = {seat: plans[seat][round_id] for seat in ("A", "B")
                  if plans[seat] is not None and round_id in plans[seat]}
        if plans["B"] is None:
            orders["B"] = choose_adaptive_order(game, round_id, pending_orders=orders)
        if npc_enabled:
            orders["NPC"] = choose_npc_order(game, round_id, pending_orders=orders)
        before = snapshot(game)
        for merchant in game.merchants.values():
            if (merchant.location != "depot" and merchant.tank == 0 and
                    not any(merchant.cargo.values())):
                stranded += 1
        result = game.settle_round(round_id, orders)
        for seat, receipt in result["receipts"].items():
            if not receipt.accepted:
                rejected += 1
                rejected_by_seat[seat] += 1
                key = f"{seat}:{receipt.reason}"
                rejected_reasons[key] = rejected_reasons.get(key, 0) + 1
        for seat, receipt in result["receipts"].items():
            order = orders.get(seat, Order())
            if receipt.accepted and order.kind == "sell":
                contribution[seat]["payout"] += receipt.payout
                if order.good == "oxygen":
                    contribution[seat]["oxygen_equivalent"] += receipt.filled
                elif order.good == "fuel":
                    contribution[seat]["oxygen_equivalent"] += receipt.filled * 2
                elif order.good == "medicine":
                    contribution[seat]["medicine"] += receipt.filled
        trace.append({
            "round": round_id,
            "orders": {seat: asdict(orders.get(seat, Order()))
                       for seat in ("A", "B", "NPC")},
            "before": before,
            "after": snapshot(game),
            "oxygen": game.colony["oxygen"],
            "medicine": game.colony["medicine"],
            "health": game.colony["health"],
            "treasury": game.colony["treasury"],
            "collapse": result["collapse"],
        })
        if game.ended:
            break
    completed = game.round == 20 and not game.settled[game.round]["collapse"]
    cash = {seat: merchant.cash for seat, merchant in game.merchants.items()}
    winners = []
    if completed:
        wealth = {seat: merchant.cash + merchant.cargo["oxygen"] +
                  merchant.cargo["medicine"] + merchant.cargo["fuel"] // 2
                  for seat, merchant in game.merchants.items()}
        best = max(wealth.values())
        winners = sorted(seat for seat, value in wealth.items() if value == best)
    freerider_profit = {
        seat: cash[seat] - 25 for seat in ("A", "B")
        if contribution[seat]["oxygen_equivalent"] == 0 and
           contribution[seat]["medicine"] == 0
    }
    contributor_profits = [cash[seat] - 25 for seat in game.merchants
                           if contribution[seat]["oxygen_equivalent"] > 0 or
                              contribution[seat]["medicine"] > 0]
    return {
        "profile": profile,
        "npc_enabled": npc_enabled,
        "initial_quota": quota,
        "initial_treasury": treasury,
        "completed": completed,
        "survival_round": game.round,
        "conditional_win_rate": {seat: (1.0 if seat in winners else 0.0)
                                 for seat in game.merchants},
        "merchant_profit": {seat: value - 25 for seat, value in cash.items()},
        "survival_contribution": contribution,
        "freerider_profit": freerider_profit,
        "freerider_outperformed_contributor": bool(
            completed and freerider_profit and contributor_profits and
            max(freerider_profit.values()) > max(contributor_profits)),
        "rejected_actions": rejected,
        "rejected_actions_by_seat": rejected_by_seat,
        "rejected_reasons": rejected_reasons,
        "stranded_merchant_rounds": stranded,
        "final_colony": dict(game.colony),
        "trace": trace,
    }


def compare_profiles(left="dependable", right="adaptive_opportunist", npc_enabled=True):
    """Return the first choice-caused divergence under identical match rules."""
    runs = {name: run_scenario(name, npc_enabled) for name in (left, right)}
    for left_row, right_row in zip(runs[left]["trace"], runs[right]["trace"]):
        if left_row["orders"] != right_row["orders"]:
            return {
                "comparison": [left, right],
                "npc_enabled": npc_enabled,
                "first_divergence_round": left_row["round"],
                "identical_state_before_choice": left_row["before"] == right_row["before"],
                "state_before": left_row["before"],
                "choices": {left: left_row["orders"], right: right_row["orders"]},
                "state_after": {left: left_row["after"], right: right_row["after"]},
                "outcomes": {
                    name: {
                        "completed": run["completed"],
                        "survival_round": run["survival_round"],
                        "merchant_profit": run["merchant_profit"],
                        "final_colony": run["final_colony"],
                    }
                    for name, run in runs.items()
                },
            }
    raise ValueError("profiles do not diverge within their shared trace")


def run_matrix():
    return [run_scenario(profile, npc) for profile in PROFILES for npc in (False, True)]


def compare_quota(quotas=(18, 20), treasury=180):
    """Isolate quota effects while holding funding, policies, and rules fixed."""
    rows = []
    for quota in quotas:
        for profile in ("dependable", "adaptive_opportunist"):
            rows.append(run_scenario(profile, True, quota=quota, treasury=treasury))
    return rows


def format_rejection_reasons(reasons):
    """Render deterministic, count-preserving rejection evidence for reports."""
    if not reasons:
        return "none"
    return ", ".join(f"{key} x{reasons[key]}" for key in sorted(reasons))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--replay", action="store_true",
                        help="show dependable vs adaptive first-choice divergence")
    parser.add_argument("--quota-sensitivity", action="store_true",
                        help="compare quotas 18/20 with treasury fixed at 180")
    args = parser.parse_args()
    if args.replay:
        print(json.dumps(compare_profiles(), indent=2, sort_keys=True))
        raise SystemExit
    if args.quota_sensitivity:
        for row in compare_quota():
            print(f"{row['profile']:20} quota={row['initial_quota']} "
                  f"treasury={row['initial_treasury']} completed={row['completed']} "
                  f"profit={row['merchant_profit']} final_quota={row['final_colony']['quota']} "
                  f"final_treasury={row['final_colony']['treasury']} "
                  f"rejected={row['rejected_actions']}")
        print("NOTE: treasury, initial state, policies, releases, and priority are held constant")
        raise SystemExit
    results = run_matrix()
    if args.json:
        print(json.dumps(results, indent=2, sort_keys=True))
    else:
        for row in results:
            print(f"{row['profile']:15} npc={str(row['npc_enabled']).lower():5} "
                  f"completed={str(row['completed']).lower():5} "
                  f"survival={row['survival_round']:2} profit={row['merchant_profit']} "
                  f"rejected={row['rejected_actions_by_seat']} "
                  f"reasons=[{format_rejection_reasons(row['rejected_reasons'])}] "
                  f"stranded={row['stranded_merchant_rounds']}")
        print("NOTE: deterministic AI-policy simulations, not human playtests or balance proof")
