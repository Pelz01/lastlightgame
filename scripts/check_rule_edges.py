#!/usr/bin/env python3
"""Pure-Python edge checks for design v0.2; NOT a contract or balance simulator."""
from dataclasses import dataclass, field
import unittest


@dataclass
class State:
    oxygen: int = 1
    quota: int = 18
    treasury: int = 180
    depot_oxygen: int = 3
    plant_fuel_used: int = 0

    def sell_plant_fuel(self, amount: int, minimum: int = 0) -> bool:
        payout = amount * 4
        if amount <= 0 or self.plant_fuel_used + amount > 3 or self.oxygen + amount * 2 > 7 or self.quota < amount * 2 or self.treasury < payout or payout < minimum:
            return False
        # No deferred production: all linked state moves in this action.
        self.oxygen += amount * 2
        self.quota -= amount * 2
        self.treasury -= payout
        self.plant_fuel_used += amount
        return True

    def sell_oxygen(self, amount: int, minimum: int = 0) -> int | None:
        if amount <= 0 or self.oxygen + amount > 7 or self.quota < amount:
            return None
        payout = sum(max(4, 8 - (self.oxygen + i)) for i in range(amount))
        if payout < minimum or self.treasury < payout:
            return None
        self.oxygen += amount
        self.quota -= amount
        self.treasury -= payout
        return payout

    def buy_depot(self, amount: int) -> bool:
        if amount <= 0 or amount > self.depot_oxygen:
            return False
        self.depot_oxygen -= amount
        return True


def included_order(match_id: str, round_id: int, current_match: str, current_round: int,
                   included_at: float, cutoff: float) -> bool:
    # The cutoff is checked on inclusion, not client submission; no rollover.
    return match_id == current_match and round_id == current_round and included_at <= cutoff


@dataclass
class Merchant:
    cash: int = 25
    oxygen: int = 0
    tank: int = 0
    at_depot: bool = True
    offer: tuple[int, int, int] | None = None  # amount, per-unit price, creation round


def list_offer(seller: Merchant, amount: int, unit_price: int, round_id: int) -> bool:
    if not seller.at_depot or seller.offer is not None or amount <= 0 or amount > seller.oxygen or unit_price <= 0:
        return False
    seller.offer = amount, unit_price, round_id
    return True


def accept_offer(seller: Merchant, buyer: Merchant, current_round: int,
                 refill: int = 0) -> bool:
    offer = seller.offer
    if not offer or not seller.at_depot or not buyer.at_depot or seller is buyer:
        return False
    amount, unit_price, creation_round = offer
    # Only a previously visible listing can be accepted; no same-round discovery.
    if creation_round >= current_round or amount > seller.oxygen or buyer.oxygen + amount > 3 or buyer.oxygen * 2 + amount * 2 > 6:
        return False
    if refill < 0 or buyer.tank + refill > 2:
        return False
    price = amount * unit_price + refill  # depot fuel costs 1 each
    if buyer.cash < price:
        return False
    buyer.cash -= price
    seller.cash += amount * unit_price
    seller.oxygen -= amount
    buyer.oxygen += amount
    buyer.tank += refill
    seller.offer = None
    return True


def travel_out(seller: Merchant) -> None:
    if seller.offer is not None:
        seller.offer = None  # auto-cancel atomically with leaving depot
    seller.at_depot = False


class DesignEdgeChecks(unittest.TestCase):
    def test_plant_changes_later_quote_immediately(self):
        state = State()
        self.assertTrue(state.sell_plant_fuel(1))
        self.assertEqual((state.oxygen, state.quota, state.treasury), (3, 16, 176))
        self.assertEqual(state.sell_oxygen(3), 13)
        self.assertEqual((state.oxygen, state.quota, state.treasury), (6, 13, 163))

    def test_plant_lifetime_cap_cannot_be_bypassed_by_multiple_sales(self):
        state = State(oxygen=0)
        for _ in range(3):
            self.assertTrue(state.sell_plant_fuel(1))
            state.oxygen -= 2  # demand frees storage between sales
        before = (state.oxygen, state.quota, state.treasury)
        self.assertFalse(state.sell_plant_fuel(1))
        self.assertEqual((state.oxygen, state.quota, state.treasury), before)

    def test_plant_overfill_rejects_without_state_change(self):
        state = State(oxygen=6)
        before = (state.oxygen, state.quota, state.treasury)
        self.assertFalse(state.sell_plant_fuel(1))
        self.assertEqual((state.oxygen, state.quota, state.treasury), before)

    def test_second_sale_rejects_stale_minimum_without_losing_goods(self):
        state = State()
        self.assertEqual(state.sell_oxygen(3, minimum=18), 18)
        before = (state.oxygen, state.quota, state.treasury)
        self.assertIsNone(state.sell_oxygen(3, minimum=18))
        self.assertEqual((state.oxygen, state.quota, state.treasury), before)

    def test_competing_depot_purchase(self):
        state = State()
        self.assertTrue(state.buy_depot(3))
        self.assertFalse(state.buy_depot(3))
        self.assertEqual(state.depot_oxygen, 0)

    def test_stale_and_cross_match_orders_never_roll_over(self):
        self.assertTrue(included_order('game-1', 4, 'game-1', 4, 14.99, 15.0))
        self.assertFalse(included_order('game-1', 4, 'game-1', 4, 15.01, 15.0))
        self.assertFalse(included_order('game-1', 4, 'game-1', 5, 15.01, 30.0))
        self.assertFalse(included_order('game-1', 4, 'game-2', 4, 14.0, 15.0))

    def test_offer_requires_next_round_and_transfers_owned_goods(self):
        seller = Merchant(cash=19, oxygen=3)
        buyer = Merchant()
        self.assertTrue(list_offer(seller, 3, 4, 4))
        self.assertFalse(accept_offer(seller, buyer, current_round=4, refill=2))
        self.assertTrue(accept_offer(seller, buyer, current_round=5, refill=2))
        self.assertEqual((seller.cash, seller.oxygen, seller.offer), (31, 0, None))
        self.assertEqual((buyer.cash, buyer.oxygen, buyer.tank), (11, 3, 2))

    def test_leaving_depot_cancels_offer(self):
        seller = Merchant(oxygen=3)
        buyer = Merchant()
        self.assertTrue(list_offer(seller, 3, 4, 4))
        travel_out(seller)
        self.assertFalse(accept_offer(seller, buyer, current_round=5))
        self.assertEqual((seller.oxygen, buyer.oxygen), (3, 0))


if __name__ == '__main__':
    unittest.main(verbosity=2)
