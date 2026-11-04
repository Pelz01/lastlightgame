#!/usr/bin/env python3
"""Deterministic v0.2 rules engine; local prototype, not onchain code."""
from dataclasses import dataclass, field
from round_priority import priority_order

GOODS = ("oxygen", "medicine", "fuel")
VOLUME = {"oxygen": 2, "medicine": 1, "fuel": 1}
DEPOT_PRICE = {"oxygen": 2, "medicine": 2, "fuel": 1}
CAPACITY = {"oxygen": 7, "medicine": 2}

@dataclass
class Merchant:
    cash: int = 25
    tank: int = 0
    location: str = "depot"
    cargo: dict = field(default_factory=lambda: {g: 0 for g in GOODS})

@dataclass(frozen=True)
class Order:
    kind: str = "wait"
    good: str | None = None
    amount: int = 0
    destination: str | None = None
    refill: int = 0
    minimum_total: int = 0

@dataclass(frozen=True)
class OrderEnvelope:
    """Network inclusion metadata checked before an order enters a round."""
    order: Order
    match_id: str
    round_id: int
    included_at: float
    cutoff: float

@dataclass
class Receipt:
    accepted: bool
    reason: str
    filled: int = 0
    payout: int = 0

class Match:
    def __init__(self, match_id="game-1"):
        self.match_id = match_id
        self.round = 0
        self.merchants = {seat: Merchant() for seat in priority_order(1)}
        self.depot = {"oxygen": 0, "medicine": 4, "fuel": 24}
        self.colony = {"oxygen": 4, "medicine": 1, "health": 2,
                       "treasury": 180, "quota": 18, "medicine_bought": 0,
                       "plant_fuel_used": 0, "critical": False}
        self.depot_revenue = 0
        self.fuel_burned = 0
        self.oxygen_consumed = 0
        self.medicine_consumed = 0
        self.settled = {}
        self.ended = False

    def _cargo_volume(self, p):
        return sum(p.cargo[g] * VOLUME[g] for g in GOODS)

    def _release(self, round_id):
        if round_id in (1, 4, 7, 10, 13, 16):
            self.depot["oxygen"] += 3

    def _reject(self, reason):
        return Receipt(False, reason)

    def _execute(self, seat, order):
        p = self.merchants[seat]
        if order.kind == "wait":
            return Receipt(True, "wait")
        if order.kind == "load":
            if p.location != "depot" or order.good not in GOODS or order.amount < 0 or order.refill < 0:
                return self._reject("invalid load")
            if p.tank + order.refill > 2 or self._cargo_volume(p) + order.amount * VOLUME[order.good] > 6:
                return self._reject("capacity")
            fuel_needed = order.refill + (order.amount if order.good == "fuel" else 0)
            if self.depot[order.good] < order.amount or self.depot["fuel"] < fuel_needed:
                return self._reject("stock")
            cost = order.amount * DEPOT_PRICE[order.good] + order.refill
            if p.cash < cost:
                return self._reject("cash")
            p.cash -= cost; self.depot_revenue += cost
            self.depot[order.good] -= order.amount; self.depot["fuel"] -= order.refill
            p.cargo[order.good] += order.amount; p.tank += order.refill
            return Receipt(True, "loaded", order.amount)
        if order.kind == "travel":
            valid = ((p.location == "depot" and order.destination in ("habitat", "clinic")) or
                     (p.location in ("habitat", "clinic") and order.destination == "depot"))
            if not valid or p.tank < 1 or (p.location == "depot" and p.tank < 2):
                return self._reject("travel")
            p.tank -= 1; self.fuel_burned += 1; p.location = order.destination
            return Receipt(True, "travelled")
        if order.kind == "sell" and order.good in ("oxygen", "medicine", "fuel"):
            target = "habitat" if order.good in ("oxygen", "fuel") else "clinic"
            if p.location != target or order.amount <= 0 or p.cargo[order.good] <= 0:
                return self._reject("invalid sale")
            if order.good == "fuel":
                fill = min(order.amount, p.cargo["fuel"], 3 - self.colony["plant_fuel_used"],
                           self.colony["quota"] // 2, (7 - self.colony["oxygen"]) // 2)
                payout = fill * 4
                if fill != order.amount:
                    return self._reject("plant requires full fill")
            else:
                room = CAPACITY[order.good] - self.colony[order.good]
                cap = self.colony["quota"] if order.good == "oxygen" else 3 - self.colony["medicine_bought"]
                fill = min(order.amount, p.cargo[order.good], room, cap)
                if order.good == "oxygen":
                    payout = sum(max(4, 8 - (self.colony["oxygen"] + i)) for i in range(fill))
                else:
                    payout = sum(8 if self.colony["medicine"] + i == 0 else 5 for i in range(fill))
            if fill <= 0 or payout < order.minimum_total or payout > self.colony["treasury"]:
                return self._reject("fill/minimum/treasury")
            p.cargo[order.good] -= fill; p.cash += payout
            self.colony["treasury"] -= payout
            if order.good == "fuel":
                self.colony["oxygen"] += fill * 2
                self.colony["quota"] -= fill * 2
                self.colony["plant_fuel_used"] += fill
            else:
                self.colony[order.good] += fill
                if order.good == "oxygen":
                    self.colony["quota"] -= fill
                else:
                    self.colony["medicine_bought"] += fill
            return Receipt(True, "sold", fill, payout)
        return self._reject("unknown action")

    def settle_round(self, round_id, orders=None):
        if round_id in self.settled:
            return self.settled[round_id]
        if self.ended or round_id != self.round + 1 or not 1 <= round_id <= 20:
            raise ValueError("round is terminal, stale, or non-sequential")
        self._release(round_id)
        orders = orders or {}
        receipts = {}
        for seat in priority_order(round_id):
            submitted = orders.get(seat, Order())
            if isinstance(submitted, OrderEnvelope):
                eligible = (submitted.match_id == self.match_id and
                            submitted.round_id == round_id and
                            submitted.included_at <= submitted.cutoff)
                receipts[seat] = (self._execute(seat, submitted.order) if eligible else
                                  self._reject("stale/cross-match/late inclusion"))
            else:
                receipts[seat] = self._execute(seat, submitted)
        was_critical = self.colony["critical"]
        had_oxygen = self.colony["oxygen"] > 0
        if had_oxygen:
            self.colony["oxygen"] -= 1; self.oxygen_consumed += 1
        if round_id in (6, 12, 18):
            if self.colony["medicine"]:
                self.colony["medicine"] -= 1; self.medicine_consumed += 1
            else:
                self.colony["health"] -= 1
        collapse = (was_critical and not had_oxygen) or self.colony["health"] <= 0
        if round_id == 20:
            collapse = collapse or self.colony["oxygen"] < 2 or self.colony["medicine"] < 1
        self.colony["critical"] = self.colony["oxygen"] == 0
        self.round = round_id
        self.ended = collapse or round_id == 20
        result = {"receipts": receipts, "collapse": collapse}
        self.settled[round_id] = result
        return result
