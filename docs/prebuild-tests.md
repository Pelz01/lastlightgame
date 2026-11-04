> Historical planning record. Implementation-status statements below describe the pre-build phase. Use [the current README](../README.md) and [NEAR integration guide](near-integration.md) for the released build.

# Last Light — pre-build test protocol

**Objective:** aim for first place in NEAR HACKATHON's Games With Real Economies track by proving an enjoyable, verifiable game loop. A prize outcome cannot be guaranteed. The game must be worth a rematch without a token incentive. This is a planning and testing document, not a claim that these tests have run.

## October 28 — lock the baseline

- Lock: one action per 15-second round; buy/refuel, move, sell or wait; sale requires a separate action after arrival. Depot purchase may combine goods and tank refuel.
- Lock: settlement priority rotates within three-round blocks and the starting seat shifts between blocks; oxygen-shipment first seats are A, B, NPC, A, B, NPC. Each accepted plant-fuel delivery **immediately** produces oxygen during its action, so later merchants see the updated price and storage. Then oxygen/medicine demand, CRITICAL/survival check, and next-round state. No separate production phase.
- Lock: every order names `match_id` and `round_id`. Included orders are public, not secret; only valid orders included by cutoff enter that round. Late orders reject without rollover. Rotating priority does not remove inclusion-latency or public-reaction advantages.
- Lock: pre-funded baseline treasury (maximum legal payout 168 < 180), cumulative three-fuel plant limit, oxygen-equivalent quota and storage caps, clinic storage/deadlines/health, one final oxygen rescue window. See [economy-v0.2.md](economy-v0.2.md) for precise values. The depot-only player offer is a **test variant**, not part of this locked baseline.
- Required result: an executable action-level witness passes using the documented depot arrivals, tank/cargo limits, treasury, medical deadlines and oxygen checks. Run `python scripts/check_witness.py` from the repository root. This tests **one schedule**, not strategy balance.
- Open implementation decisions to settle before coding: round clock/cutoff on NEAR, action authorization, token representation, transactional atomicity and reconnect semantics. If these cannot be expressed clearly, do not claim the specification is locked for implementation.

## October 29 — compare strategies under shared scenarios

Use a deterministic round-by-round simulator built from one shared rules engine rather than independent witness helpers. Every strategy gets **the same seeds, starting balances, depot releases, NPC policy and priority order** within a comparison. Also rerun each seed with the NPC absent or replaced by a passive wait policy. Preserve reproducible seed, parameters and replay log.

Strategies to compare:

1. Frequent oxygen deliveries: seek positive-margin oxygen runs whenever available.
2. Emergency-price hoarding: delay a load to seek a CRITICAL premium, accepting pre-emption/collapse risk.
3. Medicine specialist: use the clinic's post-deadline storage windows and trade oxygen only when needed.
4. Mixed fuel/oxygen: deliver plant fuel if it opens a better survival and profit path than an oxygen load.
5. Opportunist: choose the best expected full-trip margin after rival moves, subject to a survival threshold.
6. Withholder/disconnector: deliberately retain essential goods, or stop submitting actions after a chosen round.

Scenario families: starting habitat stock 2/4/6; depot shipment ± one round; clinic health 1/2; human opponent fixed/mixed; with and without NPC; one action rejected or delayed; rotating priority offset. Compare procurement quota **18** versus **20**: conservative payout ceilings are 168 and 184, so the quota-20 treasury needs at least 184; also run both quotas at the same larger treasury to isolate the quota effect. Separately A/B test the **optional depot offer market** versus no offers, holding baseline parameters and opponents fixed. Measure whether humans/NPC actually list or accept, whether buyers still earn positive margin, the time cost of listing/acceptance, rescue pre-emption and unsold inventory. These are proposed scenarios, not claims of outcomes. Report each strategy's survival rate, win rate *conditional on survival*, mean/median profit, critical rescues, clinic misses, treasury remainder, margin from rescue versus hoarding, and frequency of no viable action. Show failure traces, not just averages.

**Decision gate:** if oxygen-only dominates across conditions, fuel and medicine are not real strategies. If hoarding is both more profitable and rarely loses, adjust trip timing/supply before raising rescue subsidies. If no-player/NPC-only frequently survives, the central dilemma is weak; if NPC blocks human income or makes rescue routine, tune its *fixed, inspectable* policy. Do not conceal an unfavorable result.

## October 30 — tabletop with actual people

Run complete 20-round matches with two humans; use a printed board or a small spreadsheet plus an operator applying the published priority sequence. First specify a deterministic state-to-action NPC policy and run it in complete matches; the scripted witness does not test the candidate heuristic. Keep it fixed during a session. Invite multiple pairs if available; do not infer general balance from one pair.

Before every committed action, show the player: current location and cargo volume, tank and return-fuel need, arrival round, earliest sale round, colony oxygen runway, next medicine deadline, accepted quantity, estimated per-unit payout, min payout setting, treasury/quota remaining, and whether the colony is CRITICAL. Show already included rival actions as public; only future or unincluded actions are unknown. Mark pending settlement explicitly.

Observe and record: which actions changed because of another player; whether participants misunderstood turn order or quotes; whether trailing players had useful choices; what move each losing player would replay; whether anyone voluntarily asks for another match. Record objections verbatim and link them to a round and visible state. Do not coach players through a confusing UI and call that comprehension.

**Decision gate:** if players cannot predict the consequence of their own action, fix the explanation/sequence first. If they understand it but do not want another match, fix the game loop, not the visuals.

## October 31 — revise, retest, freeze

Change the **fewest** variables needed to address observed failures; rerun the same seeds and an additional held-out set. Recheck the witness, late/duplicate orders, NPC parity and user-visible preview. Freeze one tested rule version, game scope, implementation plan and a 60–90-second demo sequence. List known shortcomings honestly in README.

## Judge-visible demo target (not yet implemented)

Use two recorded runs from **identical** starting balances, shipments, medicine deadlines, round priority and NPC policy. One run delivers oxygen early; the other withholds and (only if the depot market passes its keep/cut test) resells to a merchant or NPC. Plot stock, quotes, ownership, profit, treasury and survival at each round. The first divergence must be attributable to merchant choice, not a hidden random disaster or a developer changing parameters.

Within a live run:

1. Two players and an NPC enter a visible, timed match; show equal action limits and a public shipment/medicine schedule.
2. One merchant buys oxygen while the rival makes a different plan; explain the cash-versus-survival dilemma before action confirmation.
3. A critical-round delivery executes under rotating priority; show per-unit repricing and the actual onchain settlement receipt. A competing order changes or rejects its stale quote without losing the sender's goods.
4. Show one medicine or fuel-plant choice affecting the subsequent oxygen market, then a viable round-20 score.

Fallback: if blockchain settlement cannot run reliably, **do not** imply a recorded demo is live onchain. Label what is simulated and consider whether the submission still meets the track's bar.

## Public status

The design website and Markdown are in a private repository. GitHub Pages could not be enabled for that repository on the current GitHub plan (API returned HTTP 422: “Your current plan does not support GitHub Pages for this repository”). Do not make the repo public merely to enable Pages; doing so would reveal the planning materials. If a public live URL is required, decide on hosting/visibility explicitly before publishing. The hackathon requires a public repository for final submission; this is a separate later decision.
