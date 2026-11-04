# Last Light — economy FAQ

**Version 0.2.** Implemented testnet baseline; human enjoyment and strategic balance remain unproven. This file and the website FAQ are generated from `data/faq.json`.

The full rules and critical round sequence live in [economy-v0.2.md](economy-v0.2.md).

## Foundation

### 1. Where does profit come from?

The colony pays merchants from a finite, pre-funded 180-credit treasury for accepted deliveries. Merchants buy finite depot stock; depot payments leave the treasury economy. No credits are minted mid-match. Purchases cannot exceed the treasury or the contract's procurement limits.

### 2. What replenishes goods?

The depot releases 18 oxygen in scheduled batches, plus finite medicine and fuel. Each accepted plant-fuel sale immediately converts one fuel into two oxygen within that action, up to three fuel. The initial habitat stock is four. The 18-unit quota includes both purchased oxygen and oxygen from plant fuel; quota 20 is an untested variant, not the baseline.

### 3. Why sell now instead of waiting?

Cargo holds at most three oxygen. Holding it blocks another run and a rival or NPC may deliver first and lower the price. A trip costs rounds and fuel. Waiting can earn a higher premium, so we must compare whole-match strategies; a cargo cap alone is not proof it is balanced.

### 4. Can players prevent collapse?

A complete twenty-round two-browser NEAR testnet match survived and matched the JS rules at every settlement. Public reports and the complete replay are committed in docs/evidence/. The Python witness is an additional feasibility schedule, not proof of balance or human playability.

### 5. What makes rescue financially sensible?

At habitat stock one, three oxygen pay 7 + 6 + 5 = 18. Goods cost 6 and two travel fuel cost 2: a 10-credit trip margin before time and rival risk. Selling earlier pays less but frees capacity sooner. Measure total profit across matches, not one trip.

### 6. What can a trailing player accomplish?

They can target public depot releases, medicine deadlines, or fuel-powered oxygen production. Equal cargo limits constrain runaway scale. A hopeless player may still prefer collapse; we have not solved that incentive. Test it before adding cosmetic survival progression.

## Prices & orders

### 7. What exactly moves prices?

Oxygen price follows habitat stock immediately before each accepted unit: stock 4 or above pays 4; 3 pays 5; 2 pays 6; 1 pays 7; 0 in the critical rescue round pays 8. Medicine pays 5 at clinic stock one or 8 at stock zero. The last trade price and trading volume do not set quotes.

### 8. Does buying stock raise the price?

No. Buying depot inventory does not change colony stock or payout. Only consumption, accepted deliveries and plant production change colony oxygen inventory.

### 9. Are purchase and sale prices different?

Yes. Oxygen costs 2 at the depot and pays 4–8 at the colony. The merchant must still spend two fuel and several rounds on a round trip. The colony does not resell its emergency reserves to merchants in v0.2.

### 10. Can a small purchase inflate an existing stockpile?

No. Depot purchases cannot move colony prices. A player can withhold oxygen until real consumption raises urgency, but is capped at three oxygen and risks pre-emption or shared collapse.

### 11. Can players wash-trade to manufacture demand or rewards?

No volume rewards exist. Only actual scheduled consumption drives demand; transferring goods among merchants cannot trigger a treasury payout. Direct player trades are out of the first prototype.

### 12. Are emergency prices capped?

Oxygen tops out at 8 per unit and medicine at 8. Preview maximum fillable quantity and estimated total. Oxygen and medicine can partially fill only if the accepted total meets the declared minimum; otherwise the whole action rejects.

### 13. Can the colony afford emergency purchases?

The baseline treasury starts at 180 credits, while the conservative ceiling on legal payouts is 168: treasury exhaustion is not a baseline strategic threat. Quota 20 raises this ceiling to 184, requiring a larger treasury. Compare both quotas with equal funding too; no accepted trade goes unpaid.

### 14. Does a large shipment get one quoted price?

Each accepted unit reprices as it replenishes stock. Three oxygen at stock one pay 7, then 6, then 5. Oxygen and medicine may partially fill up to cargo, storage and quota/cap if the total meets the minimum; surplus stays with the merchant. Plant fuel is all-or-nothing and capped cumulatively at three per match.

### 15. Can two players both expect the same quote?

Included orders are public. Priority rotates within three-round blocks and shifts at each block, giving oxygen-shipment first seats A, B, NPC, A, B, NPC. Later sales see changed inventory and price. Partial sales require the merchant's minimum total payout. Orders name match_id and round_id; late inclusion rejects without rollover. Inclusion latency remains a fairness risk.

## Goods & transport

### 16. Why carry fuel or medicine instead of oxygen?

Fuel powers trips or the oxygen plant, changing future oxygen scarcity and profits. Medicine covers clinic deadlines at rounds 6, 12 and 18 and is limited by clinic storage. If neither creates a credible winning strategy in tests, the design fails.

### 17. Can one resource substitute for another?

Only fuel: one plant fuel immediately becomes two habitat oxygen when that sale resolves, at most three times per match. Stock, quota and treasury change atomically before the next merchant acts. Medicine cannot substitute for oxygen or fuel.

### 18. What does movement cost and can merchants get stranded?

Each graph leg (depot–habitat or depot–clinic; no habitat–clinic direct route) costs one action and one tank fuel. Each decision window lasts 15 seconds, but settlement delay can lengthen the match. Loading may refill the tank up to two from finite depot fuel. Return-fuel checks block infeasible trips. Arrival never sells automatically.

### 19. Is cargo measured by units or volume?

Volume six: oxygen uses two, medicine and saleable fuel one. Vehicle tank fuel is separate. A merchant can hold at most three oxygen, even if other cargo slots are empty.

### 20. Do goods expire?

No spoilage in v0.2. The economy already has urgency from consumption, deadlines, capacity and rivals; we will not add a hidden penalty before testing those.

### 21. Are future shipments visible?

Yes. Depot arrivals, medicine deadlines and included plaintext orders are public. Players can react to visible included orders, though network visibility/inclusion latency can differ. The interface does not promise hidden choices. True secret simultaneous orders would require a separate mechanism such as commit–reveal.

### 22. Can a district recover after running out?

Oxygen at zero after consumption starts one CRITICAL rescue round; failure to deliver or produce oxygen before the next consumption collapses the colony. A missed medicine deadline costs one clinic health; a later dose prevents another miss but does not restore health. Two misses collapse the clinic.

## Competition & NPC

### 23. What prevents the leader buying all oxygen?

A merchant can hold no more than three oxygen, and future depot stock is released on a public schedule. This limits one person's corner, but two humans can still coordinate to withhold supply and cause a shared loss. That risk requires playtesting.

### 24. Can players trade directly or enforce delivery agreements?

Not in the baseline. Optional depot offers lock one whole lot. A buyer accepts a previously included offer by exact ID, version, quantity and price; replacement invalidates stale acceptance. Any refill uses the same finite depot fuel and all cargo types count against buyer capacity. Leaving cancels an offer. A round-5 rescue and competing-order rejection still need action-level witnesses.

### 25. Can a player deliberately create a shortage for the rescue premium?

They can withhold their own cargo. They cannot drain colony stock by purchasing it, fabricate demand through wash trades, or claim an uncapped premium. Whether strategic hoarding becomes dominant remains unproven.

### 26. What does the NPC optimize?

The implemented deterministic policy returns to the depot after selling, carries existing cargo to its district, buys available oxygen when colony oxygen is low, otherwise buys medicine when the clinic is empty. It accounts for publicly included oxygen loads. Read game/rules.js chooseNPC and contracts/last-light/src/model.rs npc for exact quantities and ordering. It is a rule-based NPC, not an LLM or an independent signing wallet.

### 27. Does the NPC have the same information and action limits?

The NPC uses the same cargo, fuel, travel, trade, storage and priority rules as humans. Its deterministic order is computed inside settlement from the current state and public included orders. Full-state Rust/JS comparisons and deployed-WASM tests verify the baseline; optional merchant resale is not implemented.

### 28. Can the NPC go bankrupt?

Yes. It starts with 25 credits like each human and receives no replacement credits or goods. It cannot buy when it cannot pay.

### 29. Will the NPC always rescue or outcompete humans?

A single NPC doing only oxygen runs can sell at most 15 oxygen on rounds 3, 7, 11, 15 and 19, below the 18 extra oxygen needed for the required ending reserve. That does not prove it cannot sustain oxygen by using plant fuel, nor that humans will matter under full clinic rules. Compare identical seeded scenarios with and without the NPC; its survival-first rule may be a free rescue service or may steal opportunities.

### 30. What if a human disconnects holding essential cargo?

Their cargo remains theirs. The NPC may buy only unclaimed depot stock, not confiscate inventory. The colony can still collapse; reconnecting restores the onchain settled state.

## Winning & ending

### 31. Is the winner determined by cash, profit or total wealth?

Only on survival: final credits plus fixed salvage of owned unsold cargo minus the common initial 25 credits. Outstanding offers cancel and unlock at terminal settlement, then balances and scores freeze. All lose on collapse.

### 32. How is unsold inventory valued?

Integer salvage equals one credit per unsold oxygen or medicine plus floor(unsold saleable fuel units / 2) credits. Tank fuel earns none. Listed goods remain seller-owned and count once when terminal offers cancel. Last trade price cannot change salvage.

### 33. If inventory counts little, does the last minute become liquidation?

Useful sales pay more than salvage, but take a round and can be pre-empted. The low salvage cushions a late rejection without making a pure sell-everything rush automatically optimal. We still need to test final-round behavior.

### 34. Must the colony finish viable, not merely alive?

Yes. At the end of round 20, habitat oxygen must be at least two, clinic medicine at least one, and clinic health at least one. The treasury cannot have unpaid accepted purchases. There is no arbitrary extra cash reserve because accepted purchases pay immediately.

### 35. Can someone win with one early trade then do nothing?

Possibly if rivals perform badly; we do not add activity points to forbid it. Ongoing deadlines and capped cargo should create further opportunities. Measure passive winners; fix the market if they are common.

### 36. Can early profit create an irreversible lead?

No guarantee against it. Cargo caps limit how much a rich merchant can hold, and scheduled shortages offer later trades. If seeded tests show a strong first-trade snowball, revise stock access or price curves rather than manipulate scoring.

## Tests, not claims

### 37. Does always buying oxygen beat balanced trading?

Unknown. Compare identical starting conditions and opponent policies with early oxygen delivery versus withholding, and—only if the optional depot market clears in testing—merchant resale. Log when stock, quotes, owners, profit and survival diverge. Run round-by-round seeded simulations of oxygen-only, medicine-preparation, fuel-plant and mixed strategies, including movement, depot timing, competition and treasury. Report whole-match outcomes, not isolated margins.

### 38. Can freeloaders profit while rescuers lose?

Unknown. Measure contribution to survival and final profit separately, with and without the NPC. The rules must make rescue a plausible path to winning, not a forced subsidy to hoarders.

### 39. What happens when both cooperate, both hoard or one sabotages?

Unknown beyond possible shared collapse. Simulate cooperation, hoarding, sabotage, disconnects, simultaneous last-stock orders and NPC bankruptcy. Test missing or invalid actions, duplicate or delayed settlement and terminal rejection. Baseline treasury insolvency is excluded by its 168-credit payout ceiling below 180; test altered-budget variants separately.

### 40. Do losses feel like a decision or like helplessness?

Only players can answer. Observe plan changes, ask what move they would replay, and watch voluntary rematches. If losses feel imposed by timing or the NPC, this is not a winning game regardless of correct accounting.
