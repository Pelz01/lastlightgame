#!/usr/bin/env python3
"""Deterministic rescue NPC policy for the local v0.2 prototype."""
from rules_engine import Order, VOLUME

RELEASE_ROUNDS = {1, 4, 7, 10, 13, 16}


def choose_npc_order(game, round_id, seat="NPC", pending_orders=None):
    """Return one order from public state and already-included player orders."""
    merchant = game.merchants[seat]

    if merchant.location != "depot":
        target_good = "medicine" if merchant.location == "clinic" else None
        if merchant.location == "habitat":
            target_good = "oxygen" if merchant.cargo["oxygen"] else "fuel"
        if target_good and merchant.cargo[target_good] > 0:
            return Order("sell", target_good, merchant.cargo[target_good])
        return Order("travel", destination="depot")

    for good in ("oxygen", "medicine", "fuel"):
        if merchant.cargo[good] > 0:
            destination = "clinic" if good == "medicine" else "habitat"
            return Order("travel", destination=destination)

    # A release is applied immediately before orders settle, so it is public stock.
    pending_orders = pending_orders or {}
    reserved_oxygen = sum(order.amount for other, order in pending_orders.items()
                          if other != seat and order.kind == "load" and order.good == "oxygen")
    oxygen_available = max(0, game.depot["oxygen"] +
                           (3 if round_id in RELEASE_ROUNDS else 0) - reserved_oxygen)
    # Round one is deliberately left to players; afterwards four units is the
    # delivery lead-time trigger for a three-action load/travel/sell cycle.
    if round_id > 1 and game.colony["oxygen"] <= 4 and oxygen_available:
        amount = min(3, oxygen_available, 6 // VOLUME["oxygen"])
        return Order("load", "oxygen", amount, refill=2)
    if game.colony["medicine"] == 0 and game.colony["medicine_bought"] < 3:
        return Order("load", "medicine", 1, refill=2)
    return Order()
