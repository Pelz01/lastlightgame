> Historical planning record. Implementation-status statements below describe the pre-build phase. Use [the current README](../README.md) and [NEAR integration guide](near-integration.md) for the released build.

# Last Light sprint handoff

## Locked tested baseline

The October 29 pre-build sprint leaves one deliberately narrow baseline:

- 20 deterministic decision rounds with two human seats and one rule-based NPC.
- Finite oxygen, medicine, and fuel; bounded cargo, tank, treasury, and oxygen-equivalent procurement quota.
- Rotating shipment priority that changes first seat on every release round.
- Atomic plant conversion with a match-wide cap, partial district fills with minimum-total protection, isolated rejection, idempotent settlement, and match/round/cutoff-bound order envelopes.
- No player resale. It remains an experiment, not part of the tested baseline.

The executable 20-round witness completes, and the same-initial-state dependable/adaptive replay completes both paths. The quota-18 baseline is retained: raising the quota to 20 while holding treasury and policies constant did not change spend, profit, or completion in the tested scenarios.

## Reproducible evidence

Run:

```bash
python3 scripts/verify_release.py
```

A releasable result must report `passed: true`, `mode: clean-git-archive`, and `working_tree_clean: true`. The gate runs the engine, priority, strategy, edge, witness, FAQ drift, replay drift, and judge-replay checks from committed `HEAD`; it also identifies the Git source tree, Python runtime, and hashes of judge-facing evidence.

For the 60–90-second presentation, follow [judge-demo.md](judge-demo.md) and open [the generated replay](../site/replay.html). The controlled replay holds initial state, supply schedule, NPC policy, and settlement order constant, then shows the first player-choice divergence and both complete outcomes.

## Evidence boundaries

What is real now: local deterministic state transitions, complete scripted matches, adversarial AI-policy comparisons, generated evidence, and regression tests.

What is not yet real: a playable client, a NEAR contract, wallet authorization, live network inclusion, player-to-player resale, human playtests, or evidence of strategic balance and enjoyment. The AI-policy runs must not be described as human playtests.

## Next build decisions

1. Implement the locked baseline as one authoritative NEAR testnet contract and keep the Python model as an oracle for matching traces.
2. Build only the judge-visible loop: observe state, choose one action, authorize, settle, verify transaction evidence, and recover from a rejected or delayed action.
3. Run complete tabletop matches with actual players before claiming balance or polishing the map.
4. Trial resale only as a controlled variant with locked goods, exact offer version/price/quantity binding, atomic transfer, NPC parity, cargo/fuel accounting, and an action-level rescue plus competing-order witness. Cut it if it does not improve play.
5. Recheck live hackathon rules before making the repository public, deploying, posting, or submitting.
