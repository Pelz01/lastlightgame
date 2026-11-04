#!/usr/bin/env python3
"""Round-priority regression: shipment cadence must not favor one seat."""
import unittest
from round_priority import priority_order


class PriorityTests(unittest.TestCase):
    def test_shipments_cycle_first_seat(self):
        self.assertEqual([priority_order(r)[0] for r in (1, 4, 7, 10, 13, 16)],
                         ["A", "B", "NPC", "A", "B", "NPC"])

    def test_each_round_contains_all_seats_once(self):
        for r in range(1, 21):
            with self.subTest(round=r):
                self.assertEqual(set(priority_order(r)), {"A", "B", "NPC"})


if __name__ == "__main__":
    unittest.main(verbosity=2)
