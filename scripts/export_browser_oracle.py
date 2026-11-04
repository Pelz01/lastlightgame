"""Export independent Python witness traces for JS parity regression checks."""
import json
from dataclasses import asdict
from pathlib import Path
from check_witness import PLANS
from rules_engine import Match, Order
from npc_policy import choose_npc_order

def trace(reactive):
    game = Match("parity")
    rows = []
    for round_id in range(1, 21):
        orders = {seat: PLANS[seat].get(round_id, Order()) for seat in ("A", "B")}
        orders["NPC"] = (choose_npc_order(game, round_id, pending_orders=orders)
                         if reactive else PLANS["NPC"].get(round_id, Order()))
        result = game.settle_round(round_id, orders)
        depot = dict(game.depot)
        # JS exposes the next round's shipment at round-open, before action input.
        if not game.ended and round_id + 1 in (1, 4, 7, 10, 13, 16):
            depot["oxygen"] += 3
        rows.append({"round": round_id, "colony": dict(game.colony), "depot": depot,
                     "merchants": {seat: asdict(p) for seat, p in game.merchants.items()},
                     "collapse": result["collapse"]})
    return rows

if __name__ == "__main__":
    target = Path(__file__).resolve().parents[1] / "tests/fixtures/python-oracle.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps({"witness": trace(False), "reactive_npc": trace(True)}, indent=2) + "\n")
    print(f"Exported two independent 20-round Python traces to {target.name}")
