# Judge walkthrough

Open [the public game](https://last-light-colony.faleyeoluwapelumi.chatgpt.site/). Source: [Pelz01/lastlightgame](https://github.com/Pelz01/lastlightgame). This demonstrates the implemented testnet build; it is not a hackathon submission.

## Fast gameplay demonstration

1. Choose **Play now**. Confirm three oxygen and two tank fuel at the depot. Credits become 17; cargo becomes three oxygen.
2. Confirm travel to the habitat. The rover moves and burns one fuel. Arrival does not sell cargo.
3. Confirm the separate oxygen sale. Cargo falls, credits increase and colony oxygen responds. Open the settled round in the ledger.
4. Point to rotating priority, shipments and medicine deadlines. Another merchant can change the price or leave only a partial fill.

Practice is local. Use the online path to demonstrate real NEAR transactions.

## Two-wallet online demonstration

1. Open two browser profiles with different funded NEAR testnet wallets. Choose **Play online** and connect each.
2. Optionally enable fast actions: join, ready, order and settle only; 0.25 test NEAR gas allowance; no transfer permission.
3. Create a match, attaching the displayed 0.5 test NEAR storage payment plus gas. Join its code from the second browser and ready both merchants.
4. Submit a load. Show **included** while credits and cargo remain unchanged. After cutoff, show the settled result and the ledger's transaction link.
5. Refresh and reconnect with the same wallet. Confirm its seat, credits and cargo return from the contract.

Contract: [`last-light-market-a2500d58.testnet`](https://testnet.nearblocks.io/address/last-light-market-a2500d58.testnet). It controls ownership, inventory, credits and settlement. Chain state is public; the map merely withholds rival cargo.

## Evidence

The [evidence index](evidence/README.md) links a complete twenty-round testnet replay and public hashes. QA wallet setup used an injected signer; gameplay used real restricted keys. Sandbox/model reports cover authorization, cutoffs, replacements, idempotence and state parity.

Run `npm test`, `npm run build`, and `python3 scripts/verify_release.py` for ordinary checks. Follow [near-integration.md](near-integration.md) for Rust/sandbox verification.

Tess has a separate signing wallet and the merchant exchange supports player-to-player trade. Social login and NEP-245 assets remain unimplemented. Automated matches establish integration behavior, not enjoyment or balance.

## Merchant market demo

At the depot, load cargo and choose Market to list a whole lot at your unit price. In the next round a second merchant at the depot can choose Buy lot; the displayed quantity and price bind the order. Watch the recent-trades tape after settlement. Changing or cancelling an offer invalidates an older accept without moving goods or credits. Tess can also buy and post offers, uses a separate wallet, and exposes her policy explanation and wallet link in the exchange. See [the current economy rules](economy-v0.3.md).
