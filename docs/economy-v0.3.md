# Last Light economy v0.3

Version 0.3 preserves the [v0.2 colony economy](economy-v0.2.md) and adds merchant resale and a separately signing NPC. Credits remain match-scoped game units; test NEAR pays storage and gas, not cargo prices.

## Merchant exchange

At the depot, a merchant may spend one round listing a whole cargo lot: one good, quantity 1–6 within owned inventory, and a unit price of 1–25 credits. Each merchant has at most one offer. Offered cargo remains owned, occupies hold space and contributes salvage exactly once. An offer does not create goods or credits.

Other merchants can accept the entire lot from a later round. The buy action binds the seller, offer version, good, quantity and price. It can include a tank refill from finite depot stock. Settlement validates both rovers at the depot, remaining stock, cargo/tank capacity and buyer funds before transferring anything. The seller receives the lot price; refill payments go to the depot sink. A stale, withdrawn, unaffordable or unavailable lot transfers nothing. There are no partial merchant fills.

Listing again replaces the old offer and increments its version. Cancellation uses a round. Accepted travel automatically withdraws the departing merchant's offer. Rejected travel leaves it intact. Ending a match clears offers without deleting cargo. Existing rotating settlement priority resolves buy/cancel/replacement races.

Goods supply, district budgets, procurement quotas, scarcity prices and survival requirements remain unchanged. Merchant resale redistributes existing goods and credits; it does not replenish the colony treasury or count as a district delivery.

## Tess's decisions and ownership

Tess owns a separate NEAR testnet account registered for the NPC seat. A hosted deterministic runner reads final contract state and public included orders, evaluates demand and trade margin, and signs `submit_order`. The contract never invents an NPC move at settlement. If her move is missing, she waits. Her first included order is fixed for that round; human orders remain replaceable until cutoff.

She considers a merchant offer only when projected district resale, less lot price and two travel fuel, leaves at least two credits of margin. District storage, quota and procurement limits affect that estimate. She checks her cash and cargo capacity and uses the same settlement rules as humans. With supplies stable, she may offer carried goods at an ask leaving a buyer room for delivery profit; an unsold lot eventually goes on her own delivery route. These are estimates, not guaranteed profit or rescue.

The hosted key is restricted to `submit_order` on this contract with a bounded testnet gas allowance. It cannot transfer NEAR, deploy code or control human seats. Its secret is held in production runtime configuration; deployment and recovery keys remain outside the repository. D1 leases serialize signing across requests and retain public transaction hashes. The browser can request a policy evaluation, but cannot choose Tess's order, price or signing destination. The runner operates while a match is being polled; it is not an unattended scheduler or an LLM agent.

## Verification and limits

The deterministic market witness lists three oxygen at three credits each in round 2. Tess buys in round 3, travels in round 4 and delivers in round 5 for 21 credits, rescuing the colony's critical window. Both humans continue supplying oxygen and medicine through round 20. Asking 25 credits in the same starting state leaves the offer unsold and the colony collapses. A second model test raises that ask from three to five credits with the same starting state and human route schedule: both matches survive, but the winner changes from Tess to merchant A. This establishes price-sensitive behavior, not broad strategic balance.

`tests/market.test.mjs` checks exact terms, stale versions, cancellation, rejected travel, all-or-nothing capacity/funds/refill checks, self-trading, double acceptance, terminal ownership and read-only previews. `scripts/verify-market.mjs` compares complete JS/Rust state for the twenty-round witness and 120 adversarial settlements and checks money conservation. The deployed-WASM sandbox additionally exercises separate account authority, missing NPC moves and an actual A-to-B trade. Browser and live testnet reports are recorded separately in the evidence index.

Human balance remains unproven. Watch passive winners, dealer-versus-delivery profit, rejected orders, clinic contribution and whether NPC rescue removes meaningful pressure. NEP-245 items, cross-match asset ownership and social login remain outside this release.
