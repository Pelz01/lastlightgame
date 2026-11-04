#!/usr/bin/env python3
import copy
import unittest
from check_witness import run_witness
from npc_policy import choose_npc_order
from rules_engine import Match, Order, OrderEnvelope

class EngineTests(unittest.TestCase):
    @staticmethod
    def settle_through(game, final_round):
        while game.round < final_round:
            game.settle_round(game.round + 1)

    def test_complete_feasibility_witness_uses_shared_engine(self):
        game, trace = run_witness()
        self.assertEqual(len(trace), 20)
        self.assertFalse(game.settled[20]["collapse"])
        self.assertEqual(game.colony["oxygen"], 2)

    def test_round_settlement_is_idempotent(self):
        game = Match()
        orders = {"A": Order("load", "oxygen", 3, refill=2)}
        first = game.settle_round(1, orders)
        snapshot = copy.deepcopy((game.depot, game.colony, game.merchants, game.depot_revenue))
        self.assertIs(first, game.settle_round(1, orders))
        self.assertEqual(snapshot, (game.depot, game.colony, game.merchants, game.depot_revenue))

    def test_competing_load_rejects_only_later_action(self):
        game = Match()
        result = game.settle_round(1, {s: Order("load", "oxygen", 3, refill=2) for s in ("A", "B")})
        self.assertTrue(result["receipts"]["A"].accepted)
        self.assertFalse(result["receipts"]["B"].accepted)
        self.assertEqual(game.round, 1)
        self.assertEqual(game.colony["oxygen"], 3)  # demand still executes

    def test_partial_fill_uses_actual_fill_minimum_total(self):
        game = Match(); p = game.merchants["A"]
        p.location = "habitat"; p.cargo["oxygen"] = 3
        game.colony["oxygen"] = 6
        rejected = game._execute("A", Order("sell", "oxygen", 3, minimum_total=5))
        self.assertFalse(rejected.accepted)
        self.assertEqual((p.cargo["oxygen"], game.colony["oxygen"]), (3, 6))
        accepted = game._execute("A", Order("sell", "oxygen", 3, minimum_total=4))
        self.assertEqual((accepted.filled, accepted.payout), (1, 4))
        self.assertEqual((p.cargo["oxygen"], game.colony["oxygen"]), (2, 7))

    def test_later_sale_rejects_stale_minimum_without_losing_goods(self):
        game = Match()
        for seat in ("A", "B"):
            game.merchants[seat].location = "habitat"
            game.merchants[seat].cargo["oxygen"] = 3
        game.colony["oxygen"] = 1
        result = game.settle_round(1, {
            "A": Order("sell", "oxygen", 3, minimum_total=18),
            "B": Order("sell", "oxygen", 3, minimum_total=18),
        })
        self.assertEqual((result["receipts"]["A"].accepted,
                          result["receipts"]["A"].payout), (True, 18))
        self.assertFalse(result["receipts"]["B"].accepted)
        self.assertEqual(game.merchants["B"].cargo["oxygen"], 3)
        self.assertEqual(game.colony["oxygen"], 3)  # first sale, then demand

    def test_late_and_cross_round_envelopes_reject_without_rollover(self):
        game = Match("bound-match")
        order = Order("load", "oxygen", 3, refill=2)
        late = OrderEnvelope(order, "bound-match", 1, included_at=15.01, cutoff=15.0)
        wrong_match = OrderEnvelope(order, "other-match", 1, included_at=14.0, cutoff=15.0)
        first = game.settle_round(1, {"A": late, "B": wrong_match})
        self.assertEqual(first["receipts"]["A"].reason,
                         "stale/cross-match/late inclusion")
        self.assertEqual(first["receipts"]["B"].reason,
                         "stale/cross-match/late inclusion")
        self.assertEqual(game.merchants["A"].cargo["oxygen"], 0)
        self.assertEqual(game.merchants["B"].cargo["oxygen"], 0)
        second = game.settle_round(2, {"A": late})
        self.assertEqual(second["receipts"]["A"].reason,
                         "stale/cross-match/late inclusion")
        self.assertEqual(game.merchants["A"].cargo["oxygen"], 0)

    def test_valid_bound_envelope_executes(self):
        game = Match("bound-match")
        envelope = OrderEnvelope(Order("load", "oxygen", 3, refill=2),
                                 "bound-match", 1, included_at=15.0, cutoff=15.0)
        receipt = game.settle_round(1, {"A": envelope})["receipts"]["A"]
        self.assertTrue(receipt.accepted)
        self.assertEqual(game.merchants["A"].cargo["oxygen"], 3)

    def test_plant_conversion_is_atomic_and_lifetime_capped(self):
        game = Match(); p = game.merchants["A"]
        p.location = "habitat"; p.cargo["fuel"] = 4; game.colony["oxygen"] = 0
        self.assertFalse(game._execute("A", Order("sell", "fuel", 4, minimum_total=12)).accepted)
        self.assertEqual(p.cargo["fuel"], 4)
        sold = game._execute("A", Order("sell", "fuel", 3, minimum_total=12))
        self.assertEqual((sold.filled, sold.payout), (3, 12))
        self.assertEqual((game.colony["oxygen"], game.colony["quota"], game.colony["plant_fuel_used"]), (6, 12, 3))
        self.assertFalse(game._execute("A", Order("sell", "fuel", 1)).accepted)

    def test_credit_and_oxygen_conservation_for_buy_sell_demand(self):
        game = Match(); initial_credits = 180 + sum(p.cash for p in game.merchants.values())
        game.settle_round(1, {"A": Order("load", "oxygen", 3, refill=2)})
        game.settle_round(2, {"A": Order("travel", destination="habitat")})
        game.settle_round(3, {"A": Order("sell", "oxygen", 3)})
        credits = game.colony["treasury"] + game.depot_revenue + sum(p.cash for p in game.merchants.values())
        self.assertEqual(credits, initial_credits)
        oxygen = game.depot["oxygen"] + sum(p.cargo["oxygen"] for p in game.merchants.values()) + game.colony["oxygen"] + game.oxygen_consumed
        self.assertEqual(oxygen, 7)  # four initial + first three-unit release

    def test_medicine_sale_prevents_scheduled_health_loss(self):
        game = Match(); p = game.merchants["A"]
        p.location = "clinic"; p.cargo["medicine"] = 2
        game.colony.update(medicine=0, oxygen=20)
        sold = game._execute("A", Order("sell", "medicine", 2, minimum_total=13))
        self.assertEqual((sold.filled, sold.payout), (2, 13))
        self.settle_through(game, 12)
        self.assertEqual((game.colony["health"], game.medicine_consumed), (2, 2))
        self.assertFalse(game.ended)

    def test_missing_medicine_collapses_at_second_health_check(self):
        game = Match()
        game.colony["medicine"] = 0
        # Keep oxygen available so this isolates the medicine failure path.
        game.colony["oxygen"] = 20
        self.settle_through(game, 12)
        self.assertTrue(game.ended)
        self.assertTrue(game.settled[12]["collapse"])
        self.assertEqual(game.colony["health"], 0)
        with self.assertRaisesRegex(ValueError, "terminal"):
            game.settle_round(13)

    def test_round_twenty_is_terminal_without_false_collapse(self):
        game = Match()
        # Direct fixture isolates terminal behavior; leave a final medicine reserve.
        game.colony.update(oxygen=25, medicine=4)
        self.settle_through(game, 20)
        self.assertTrue(game.ended)
        self.assertFalse(game.settled[20]["collapse"])
        with self.assertRaisesRegex(ValueError, "terminal"):
            game.settle_round(21)

    def test_npc_policy_is_a_deterministic_public_state_function(self):
        game = Match()
        self.assertEqual(choose_npc_order(game, 1), Order())
        game.colony["oxygen"] = 3
        self.assertEqual(choose_npc_order(game, 4), Order("load", "oxygen", 3, refill=2))
        game.merchants["NPC"].location = "habitat"
        game.merchants["NPC"].cargo["oxygen"] = 2
        self.assertEqual(choose_npc_order(game, 2), Order("sell", "oxygen", 2))

    def test_npc_policy_completes_full_match_with_same_human_schedule(self):
        from check_witness import PLANS
        game = Match("npc-policy-complete-match")
        npc_orders = []
        for round_id in range(1, 21):
            orders = {seat: PLANS[seat][round_id] for seat in ("A", "B")
                      if round_id in PLANS[seat]}
            npc_order = choose_npc_order(game, round_id, pending_orders=orders)
            orders["NPC"] = npc_order
            result = game.settle_round(round_id, orders)
            self.assertTrue(result["receipts"]["NPC"].accepted, round_id)
            self.assertFalse(result["collapse"], round_id)
            npc_orders.append(npc_order)
        self.assertEqual(game.round, 20)
        self.assertTrue(game.ended)
        self.assertGreater(sum(order.kind != "wait" for order in npc_orders), 0)

if __name__ == "__main__":
    unittest.main(verbosity=2)
