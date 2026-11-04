window.lastLightReplay = {
  "choices": {
    "adaptive_opportunist": {
      "A": {
        "amount": 0,
        "destination": "depot",
        "good": null,
        "kind": "travel",
        "minimum_total": 0,
        "refill": 0
      },
      "B": {
        "amount": 0,
        "destination": null,
        "good": null,
        "kind": "wait",
        "minimum_total": 0,
        "refill": 0
      },
      "NPC": {
        "amount": 0,
        "destination": "habitat",
        "good": null,
        "kind": "travel",
        "minimum_total": 0,
        "refill": 0
      }
    },
    "dependable": {
      "A": {
        "amount": 0,
        "destination": "depot",
        "good": null,
        "kind": "travel",
        "minimum_total": 0,
        "refill": 0
      },
      "B": {
        "amount": 1,
        "destination": null,
        "good": "medicine",
        "kind": "load",
        "minimum_total": 0,
        "refill": 2
      },
      "NPC": {
        "amount": 0,
        "destination": "habitat",
        "good": null,
        "kind": "travel",
        "minimum_total": 0,
        "refill": 0
      }
    }
  },
  "comparison": [
    "dependable",
    "adaptive_opportunist"
  ],
  "evidence": "Deterministic AI-policy simulation; not a human playtest or balance proof.",
  "first_divergence_round": 8,
  "identical_state_before_choice": true,
  "npc_enabled": true,
  "outcomes": {
    "adaptive_opportunist": {
      "completed": true,
      "final_colony": {
        "critical": false,
        "health": 2,
        "medicine": 1,
        "medicine_bought": 3,
        "oxygen": 2,
        "plant_fuel_used": 0,
        "quota": 0,
        "treasury": 66
      },
      "merchant_profit": {
        "A": 19,
        "B": 21,
        "NPC": 14
      },
      "survival_round": 20
    },
    "dependable": {
      "completed": true,
      "final_colony": {
        "critical": false,
        "health": 2,
        "medicine": 1,
        "medicine_bought": 3,
        "oxygen": 2,
        "plant_fuel_used": 0,
        "quota": 0,
        "treasury": 72
      },
      "merchant_profit": {
        "A": 19,
        "B": 15,
        "NPC": 14
      },
      "survival_round": 20
    }
  },
  "state_after": {
    "adaptive_opportunist": {
      "colony": {
        "critical": false,
        "health": 2,
        "medicine": 1,
        "medicine_bought": 1,
        "oxygen": 2,
        "plant_fuel_used": 0,
        "quota": 12,
        "treasury": 142
      },
      "depot": {
        "fuel": 16,
        "medicine": 3,
        "oxygen": 0
      },
      "merchants": {
        "A": {
          "cargo": {
            "fuel": 0,
            "medicine": 0,
            "oxygen": 0
          },
          "cash": 36,
          "location": "depot",
          "profit": 11,
          "tank": 0
        },
        "B": {
          "cargo": {
            "fuel": 0,
            "medicine": 0,
            "oxygen": 0
          },
          "cash": 32,
          "location": "depot",
          "profit": 7,
          "tank": 0
        },
        "NPC": {
          "cargo": {
            "fuel": 0,
            "medicine": 0,
            "oxygen": 3
          },
          "cash": 17,
          "location": "habitat",
          "profit": -8,
          "tank": 1
        }
      },
      "next_oxygen_quote": 6
    },
    "dependable": {
      "colony": {
        "critical": false,
        "health": 2,
        "medicine": 1,
        "medicine_bought": 1,
        "oxygen": 2,
        "plant_fuel_used": 0,
        "quota": 12,
        "treasury": 142
      },
      "depot": {
        "fuel": 14,
        "medicine": 2,
        "oxygen": 0
      },
      "merchants": {
        "A": {
          "cargo": {
            "fuel": 0,
            "medicine": 0,
            "oxygen": 0
          },
          "cash": 36,
          "location": "depot",
          "profit": 11,
          "tank": 0
        },
        "B": {
          "cargo": {
            "fuel": 0,
            "medicine": 1,
            "oxygen": 0
          },
          "cash": 28,
          "location": "depot",
          "profit": 3,
          "tank": 2
        },
        "NPC": {
          "cargo": {
            "fuel": 0,
            "medicine": 0,
            "oxygen": 3
          },
          "cash": 17,
          "location": "habitat",
          "profit": -8,
          "tank": 1
        }
      },
      "next_oxygen_quote": 6
    }
  },
  "state_before": {
    "colony": {
      "critical": false,
      "health": 2,
      "medicine": 1,
      "medicine_bought": 1,
      "oxygen": 3,
      "plant_fuel_used": 0,
      "quota": 12,
      "treasury": 142
    },
    "depot": {
      "fuel": 16,
      "medicine": 3,
      "oxygen": 0
    },
    "merchants": {
      "A": {
        "cargo": {
          "fuel": 0,
          "medicine": 0,
          "oxygen": 0
        },
        "cash": 36,
        "location": "clinic",
        "profit": 11,
        "tank": 1
      },
      "B": {
        "cargo": {
          "fuel": 0,
          "medicine": 0,
          "oxygen": 0
        },
        "cash": 32,
        "location": "depot",
        "profit": 7,
        "tank": 0
      },
      "NPC": {
        "cargo": {
          "fuel": 0,
          "medicine": 0,
          "oxygen": 3
        },
        "cash": 17,
        "location": "depot",
        "profit": -8,
        "tank": 2
      }
    },
    "next_oxygen_quote": 5
  }
};
