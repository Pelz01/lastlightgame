#!/usr/bin/env python3
import unittest

from compare_strategies import (choose_adaptive_order, compare_profiles, compare_quota,
                                format_rejection_reasons, run_matrix, run_scenario)
from rules_engine import Match, Order


class StrategyComparisonTests(unittest.TestCase):
    def test_matrix_is_reproducible_and_has_complete_traces(self):
        first = run_matrix()
        self.assertEqual(first, run_matrix())
        self.assertEqual(len(first), 16)
        for row in first:
            self.assertEqual(len(row["trace"]), row["survival_round"])
            self.assertLessEqual(row["survival_round"], 20)
            self.assertEqual(set(row["conditional_win_rate"]), {"A", "B", "NPC"})
            self.assertEqual(set(row["survival_contribution"]), {"A", "B", "NPC"})
            self.assertEqual(sum(row["rejected_actions_by_seat"].values()),
                             row["rejected_actions"])
            self.assertEqual(sum(row["rejected_reasons"].values()),
                             row["rejected_actions"])

    def test_dependable_profile_isolated_npc_effect(self):
        without = run_scenario("dependable", False)
        with_npc = run_scenario("dependable", True)
        self.assertFalse(without["completed"])
        self.assertTrue(with_npc["completed"])
        self.assertEqual(without["rejected_actions"], 0)
        self.assertEqual(with_npc["rejected_actions"], 0)

    def test_withholding_is_not_silently_rescued(self):
        without = run_scenario("withholding", False)
        with_npc = run_scenario("withholding", True)
        self.assertFalse(without["completed"])
        self.assertFalse(with_npc["completed"])
        self.assertGreater(with_npc["survival_round"], without["survival_round"])

    def test_competing_strategies_report_contribution_and_freeriders(self):
        hoarder = run_scenario("emergency_hoarder", True)
        specialist = run_scenario("fuel_specialist", True)
        self.assertGreater(hoarder["survival_contribution"]["A"]["oxygen_equivalent"], 0)
        # Its round-three three-fuel sale overfills habitat: no partial plant fills.
        self.assertEqual(specialist["survival_contribution"]["A"]["oxygen_equivalent"], 0)
        self.assertEqual(specialist["rejected_reasons"], {"A:plant requires full fill": 1})
        withholding = run_scenario("withholding", True)
        self.assertEqual(withholding["freerider_profit"], {"A": 0, "B": 0})

    def test_mixed_and_opportunistic_profiles_are_distinct_and_attributed(self):
        mixed = run_scenario("mixed_production", True)
        opportunist = run_scenario("opportunist", True)
        self.assertNotEqual(mixed["trace"], opportunist["trace"])
        specialist = run_scenario("fuel_specialist", True)
        self.assertEqual(specialist["rejected_actions_by_seat"]["A"], 1)
        self.assertEqual(specialist["rejected_actions_by_seat"]["B"], 0)
        self.assertTrue(all(key.startswith("A:") for key in specialist["rejected_reasons"]))

    def test_single_supplier_is_not_a_win_without_final_reserves(self):
        row = run_scenario("single_supplier", True)
        self.assertFalse(row["completed"])
        self.assertEqual(row["survival_round"], 20)
        self.assertEqual(row["conditional_win_rate"], {"A": 0.0, "B": 0.0, "NPC": 0.0})
        self.assertEqual(row["freerider_profit"], {"B": 0})
        self.assertFalse(row["freerider_outperformed_contributor"])

    def test_human_report_exposes_exact_rejection_reasons(self):
        row = run_scenario("fuel_specialist", True)
        rendered = format_rejection_reasons(row["rejected_reasons"])
        self.assertNotEqual(rendered, "none")
        for reason, count in row["rejected_reasons"].items():
            self.assertIn(f"{reason} x{count}", rendered)
        self.assertEqual(format_rejection_reasons({}), "none")

    def test_adaptive_opportunist_reacts_without_missing_rescue_deadline(self):
        game = Match("adaptive-policy-probe")
        # Round-one oxygen is already reserved by A, so B does not over-order it.
        order = choose_adaptive_order(
            game, 1, pending_orders={"A": Order("load", "oxygen", 3, refill=2)})
        self.assertEqual(order.kind, "wait")
        row = run_scenario("adaptive_opportunist", True)
        self.assertTrue(row["completed"])
        self.assertEqual(row["rejected_actions"], 0)
        self.assertGreater(row["survival_contribution"]["B"]["oxygen_equivalent"] +
                           row["survival_contribution"]["B"]["medicine"], 0)

    def test_replay_isolates_first_choice_caused_divergence(self):
        replay = compare_profiles()
        self.assertEqual(replay["first_divergence_round"], 8)
        self.assertTrue(replay["identical_state_before_choice"])
        dependable = replay["choices"]["dependable"]["B"]
        adaptive = replay["choices"]["adaptive_opportunist"]["B"]
        self.assertEqual((dependable["kind"], dependable["good"], dependable["amount"]),
                         ("load", "medicine", 1))
        self.assertEqual(adaptive["kind"], "wait")
        after = replay["state_after"]
        self.assertEqual(after["dependable"]["merchants"]["B"]["cargo"]["medicine"], 1)
        self.assertEqual(after["adaptive_opportunist"]["merchants"]["B"]["cargo"]["medicine"], 0)
        self.assertTrue(all(outcome["completed"]
                            for outcome in replay["outcomes"].values()))

    def test_quota_sensitivity_holds_treasury_and_scenarios_constant(self):
        rows = compare_quota()
        self.assertEqual(len(rows), 4)
        self.assertEqual({row["initial_quota"] for row in rows}, {18, 20})
        self.assertEqual({row["initial_treasury"] for row in rows}, {180})
        by_key = {(row["profile"], row["initial_quota"]): row for row in rows}
        for profile in ("dependable", "adaptive_opportunist"):
            low, high = by_key[(profile, 18)], by_key[(profile, 20)]
            self.assertTrue(low["completed"] and high["completed"])
            self.assertEqual(low["trace"][0]["before"]["colony"]["treasury"], 180)
            self.assertEqual(high["trace"][0]["before"]["colony"]["treasury"], 180)
            self.assertGreaterEqual(high["final_colony"]["quota"], low["final_colony"]["quota"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
