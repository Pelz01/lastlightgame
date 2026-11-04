#!/usr/bin/env python3
"""One feasible 20-round shared-engine schedule; not a balance proof."""
from rules_engine import Match, Order


def load(good, amount, refill=2):
    return Order("load", good, amount, refill=refill)


def travel(destination):
    return Order("travel", destination=destination)


def sell(good, amount):
    return Order("sell", good, amount)


PLANS = {
    "A": {
        1: load("oxygen", 3), 2: travel("habitat"), 3: sell("oxygen", 3),
        4: travel("depot"), 5: load("medicine", 1), 6: travel("clinic"),
        7: sell("medicine", 1), 8: travel("depot"),
        10: load("oxygen", 3), 11: travel("habitat"), 12: sell("oxygen", 3),
        13: travel("depot"), 14: load("medicine", 1), 15: travel("clinic"),
        16: sell("medicine", 1), 17: travel("depot"),
    },
    "B": {
        4: load("oxygen", 3), 5: travel("habitat"), 6: sell("oxygen", 3),
        7: travel("depot"), 8: load("medicine", 1), 9: travel("clinic"),
        10: sell("medicine", 1), 11: travel("depot"),
        13: load("oxygen", 3), 14: travel("habitat"), 15: sell("oxygen", 3),
        16: travel("depot"),
    },
    "NPC": {
        7: load("oxygen", 3), 8: travel("habitat"), 9: sell("oxygen", 3),
        10: travel("depot"), 16: load("oxygen", 3),
        17: travel("habitat"), 18: sell("oxygen", 3), 19: travel("depot"),
    },
}


def run_witness():
    game = Match("feasibility-witness")
    trace = []
    for round_id in range(1, 21):
        orders = {seat: plan[round_id] for seat, plan in PLANS.items() if round_id in plan}
        result = game.settle_round(round_id, orders)
        rejected = {seat: receipt.reason for seat, receipt in result["receipts"].items()
                    if not receipt.accepted}
        assert not rejected, f"round {round_id} rejected actions: {rejected}"
        assert not result["collapse"], f"collapse on round {round_id}"
        trace.append({
            "round": round_id,
            "oxygen": game.colony["oxygen"],
            "medicine": game.colony["medicine"],
            "treasury": game.colony["treasury"],
        })

    assert game.ended and game.round == 20
    assert (game.colony["oxygen"], game.colony["medicine"], game.colony["health"]) == (2, 1, 2)
    assert (game.colony["treasury"], game.colony["quota"], game.colony["medicine_bought"]) == (72, 0, 3)
    assert game.oxygen_consumed == 20 and game.medicine_consumed == 3
    assert min(row["oxygen"] for row in trace) == 2
    return game, trace


if __name__ == "__main__":
    game, trace = run_witness()
    print("PASS: shared engine completed one scripted 20-round buy/travel/sell/return schedule")
    print("Final colony:", game.colony)
    print("Minimum oxygen:", min(row["oxygen"] for row in trace))
    print("Merchant cash:", {seat: merchant.cash for seat, merchant in game.merchants.items()})
    print("Unspent depot inventory:", game.depot)
    print("NOTE: no strategy competition, human playtests, or NEAR settlement tested")
