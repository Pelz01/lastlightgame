> Historical planning record. Implementation-status statements below describe the pre-build phase. Use [the current README](../README.md) and [NEAR integration guide](near-integration.md) for the released build.

# Last Light — economy design v0.1 (superseded)

> **Archived:** This draft contains an unreachable 8-credit oxygen quote and an incomplete round sequence. Use [economy v0.2](economy-v0.2.md) and the [synchronized FAQ](faq.md) for current rules.

This is an explicit **prototype hypothesis**, not a balanced or implemented economy. Numbers are for first tests, not promises. The game must be fun before a token or a polished map is justified.

## Match state and invariants

- **Duration:** 20 rounds × 15 seconds. Two humans and one rule-based NPC. Each merchant begins with 25 credits and a small vehicle fuel tank. The colony procurement treasury begins with 180 credits. No credits are created mid-match.
- **Map:** depot, habitat, clinic. One leg takes one round and consumes one fuel from a vehicle tank. A trip that would strand the vehicle is blocked before departure. Cargo holds six volume; oxygen occupies two, medicine and saleable fuel one each. The tank is separate from cargo.
- **Depots and budgets:** Depot stock arrives on a public, finite schedule. Provisional depot prices: oxygen 2 credits; medicine 2; fuel 1. Depot purchases pay a separate sink, not the colony treasury. The treasury pays only for needed, accepted delivery contracts and rejects unfundable purchases. It does not mint credit.
- **Consumption:** Habitat consumes one oxygen each round. Zero oxygen *when consumption occurs* collapses the colony. The clinic has medicine deadlines at rounds 6, 12, and 18; a missed dose damages it, and repeated failure ends the match. Deliveries settle before scheduled consumption at a round boundary.
- **Production:** A fuel unit delivered to the emergency plant makes two oxygen, with a per-match plant-use limit initially proposed as three fuel. A plant operation cannot produce unlimited supply. Medicine has no substitute.
- **Survival:** On round 20, habitat must hold at least two oxygen, the clinic must be stable, and the treasury solvent. A collapse means nobody wins.
- **Winning:** Among survivors, highest net worth gained wins: end credits + fixed low salvage value for unsold inventory − initial credits. Provisional salvage is half depot purchase value, independent of manipulated prices. Equal starts mean this is comparable across players.
- **Ownership:** Player-owned inventory and balances, NPC inventory/balances, treasury, and accepted trades have one authoritative onchain state. Frontend quotes are estimates. No action is treated as final before contract execution. This architecture is intended, not yet implemented.

## First six: economic foundations

**1. Profit source and money supply.** Merchants earn finite treasury credits for useful deliveries. The depot takes payment into a separate sink. Nobody prints money. If treasury liquidity is insufficient, a contract rejects a delivery rather than promising an unfundable payout. The interface shows budget and outstanding commitments.

**2. Goods replenishment and feasibility.** The depot receives finite shipments; the plant converts fuel into oxygen. Example resource budget: habitat begins with four oxygen; twenty rounds consume twenty; ending with two requires eighteen additional oxygen. The depot makes up to eighteen oxygen available over the match, and the plant can make up to six more. There is capacity for alternative routes and mistakes, but only if deliveries can arrive in time.

**3. Sell-versus-wait tension.** Carrying at most three oxygen ties up capacity and credits. Rivals can deliver first, reducing the premium; travel takes time and fuel; selling frees capital for a second run. If delaying still dominates, change capacity or shipment schedule instead of awarding arbitrary participation points.

**4. Can collapse be prevented?** An arithmetic-only witness schedule delivers three oxygen on rounds 3, 6, 9, 12, 15, and 18. Starting at four oxygen and consuming one per round leaves two at round twenty; the checked minimum on that schedule is two. This is **not** proof that available depot timing, transport, competing purchases, actual settlement, or player incentives make it practical. Simulate them separately.

**5. Rescue margin.** When habitat stock is one, a three-oxygen delivery hypothetically earns 7 + 6 + 5 = 18 (successive repricing). Three oxygen cost 6 and a two-leg trip uses 2 depot-priced fuel, leaving 10 credits before the opportunity cost of time. Early delivery also has a positive margin, but less urgency premium. If actual rescuers consistently lose to hoarders, this pricing fails.

**6. Trailing player.** Public shipments, medicine deadlines, fuel-to-oxygen production, and capped cargo provide comeback opportunities. There is no guaranteed comeback; a player who cannot win may rationally choose collapse. Test without progression first. Only if needed, experiment with modest cosmetic survival progression, never a financial payoff for griefing or an untested cure.

## Prices and matching (questions 7–15)

**7–8.** Colony oxygen payout is a function of local stock *after consumption*, not last trade, predicted orders, or depot purchases. Provisional unit payout from stock 4+ is 4; stock 3 → 5; stock 2 → 6; stock 1 → 7; stock 0 before consumption → 8 if a delivery can settle in time. Buying depot stock does not change the colony price.

**9.** Depot oxygen costs 2 and colony payout is 4–8; merchants pay fuel/time. The colony never sells its emergency reserves to merchants in v0.1, eliminating immediate buy-back arbitrage.

**10–11.** A small depot purchase cannot inflate a local price. Player-to-player transfers, if ever added, cannot count as consumption or trigger a treasury reward. There are no volume-mining rewards.

**12–13.** Oxygen payout caps at 8. Treasury pays from existing funds only. Provisional maximal planned bill: 18 oxygen × 8 + 3 medicine × 8 + 3 fuel × 4 = 180 credits. That matches the starting treasury exactly; there is **no slack under this ceiling**. The implementation must cap accepted quantities, reserve funds for outstanding contracts, and refuse or reprioritize unaffordable optional buys. If the actual game requires more transactions, change the starting budget or payout curve before making solvency claims. If a rescue pays less than its cost, do not pretend players will volunteer.

**14.** Multi-unit sales reprice unit by unit against progressively replenished stock. At stock one, three oxygen pay 7, then 6, then 5. Never pay three times the first emergency quote.

**15.** The first executed order changes state. The second recomputes its quote; the order includes a minimum acceptable payout and fails without moving inventory if that minimum cannot be met. Frontend displays pending, completed, or rejected explicitly. Avoid optimistic ownership that contradicts settlement.

## Goods and transport (questions 16–22)

**16–17.** Oxygen is immediate consumption, medicine is scheduled demand, and fuel controls transport and optional oxygen production. Only fuel substitutes via the plant in v0.1. Test whether medicine preparation and plant fuel compete credibly with oxygen hauling.

**18.** Each map leg consumes one round and one tank fuel. Block moves that cannot complete the planned return; no invisible bailout. Travel has no extra credit toll beyond buying fuel.

**19.** Capacity is six volume: oxygen two, medicine and saleable fuel one. Tank fuel has a separate small cap. At most three oxygen can be held by a merchant.

**20–21.** No spoilage in v0.1. Depot shipment and clinic-demand schedules are public; rivals' future actions are not. Preparation should be skillful without punishing players with hidden demand.

**22.** A single missed clinic dose damages it; a later medicine delivery stabilizes it. Repeated failure ends the match. Habitat oxygen hitting zero when consumed ends the match immediately. Exact clinic damage threshold needs playtesting.

## Competition and NPC (questions 23–30)

**23.** No merchant may hold more than three oxygen. Finite scheduled depot supply and purchase caps prevent one player from cornering *all future stock* at once. Two humans can still hoard enough to harm the colony; this is a strategic/griefing risk to test.

**24.** Players may talk, but direct trades and enforceable delivery promises are out of MVP. Betrayal through unenforceable speech may happen, but is not required by the game design.

**25.** A player can withhold goods they own, but cannot buy oxygen out of colony reserves or mint a treasury bonus through wash trades. The premium is capped. Whether rational hoarding ruins the game is an experiment, not a solved problem.

**26.** NPC policy: seek positive expected margin, prioritize feasible rescues near collapse. Its rule-based policy is observable through actions. No claim that an LLM makes it intelligent.

**27–29.** Same public information, depot access, transport time, cargo limits, order priority, and settlement rules as humans. Starts with 25 credits; receives no free refills. It can go bankrupt. Test whether it rescues too reliably or outcompetes humans too strongly.

**30.** Disconnect does not seize a person's cargo. The NPC may purchase only stock still at the depot. A disconnect can cause a loss; rejoining restores authoritative state.

## Scoring and the ending (questions 31–36)

**31.** Winner is highest *net worth gained* only if the colony survives. Everyone loses on collapse.

**32.** Salvage uses a fixed fraction of original depot price, not last trade or current shortage price. No artificial mark-to-market windfall.

**33.** Selling useful goods should be worth more than salvage, but salvage prevents final-second pending orders from zeroing all inventory. Watch for end-of-game liquidation behavior.

**34.** The colony must finish with oxygen ≥2, a stable clinic, and a solvent treasury, not merely survive the final consumption tick.

**35–36.** No arbitrary activity points. A large early lead may be defensible, but capped inventory and recurring deadlines should leave meaningful later opportunities. If simulations show first-trade snowballing or frequent passive winners, revise supply timing, cargo caps, or payout curves rather than fake engagement.

## Required simulations and playtests (questions 37–40)

These are **unknown** until measured. Run seeded round-by-round simulations including depot arrivals, travel, fuel, exact trade execution, treasury reservation, NPC policy, and adversarial humans. Then run actual five-minute sessions with people.

1. Compare “always buy oxygen” with deadline planning, plant investment, opportunistic trading, and mixed strategies across many starting states. Count wins, collapses, profit, and rescues.
2. Measure merchants who earn the most while contributing least; compare rescuers' win rate and margin against hoarders.
3. Exercise both humans hoarding, both cooperating, one sabotaging, one disconnecting, NPC bankrupt, treasury exhausted, and simultaneous orders for one stock unit.
4. Ask players whether losses felt avoidable and whether they voluntarily rematch. Look for plan changes caused by other players, not just the clock.

**Only smoke checks performed so far:** arithmetic for one oxygen schedule (end stock 2; minimum 2), a medicine end-stock example (1), the maximum planned treasury bill (180), and the example rescue margin (10). No complete simulation, contract, player test, or live settlement exists. A budget that matches its worst-case bill exactly is fragile: add reservations or change parameters before coding a promise of safety.

## Technical questions still open

- Which onchain asset representation makes inventory genuinely player-owned and transferable without making each movement a wallet-popup bottleneck?
- Can restricted keys be scoped to the game contract while the contract enforces purchases against internal pre-funded balances? Never hand an NPC or browser a full-access key to a player account.
- How are 15-second round boundaries and transaction ordering defined so a late delivery is accepted or rejected predictably?
- How do frontend quotes include expiry/minimum payout and avoid optimistic-state lies under latency?
- Does “clinic damage” add tension or complexity without strategic choice? Cut it if it does not earn its place.

Sources: https://nearhackathon.com/HACKATHON.md ; https://docs.near.org/protocol/accounts-contracts/access-keys ; https://docs.near.org/primitives/ft
