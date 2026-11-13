# Judge walkthrough

Play [Last Light](https://last-light-site.vercel.app/). [Source](https://github.com/Pelz01/lastlightgame) · [current evidence](evidence/hybrid-hosting/README.md). This guide describes the implemented testnet release; it is not a submitted application.

## First delivery — no wallet or funds

1. Choose **Play solo**. The short introduction explains the route; choose **Let’s play**. Leave Suggested moves on and the timer off.
2. At the Depot choose **Load → Oxygen**, amount **3**, tank refill **+ 2 fuel**. Choose **Buy & load**. Expect **17 credits**, **3 oxygen** and **2 tank fuel**.
3. Choose **Travel → Habitat**, then **Travel to Habitat**. The rover moves and arrives with **1 tank fuel** and the same cargo. Arrival alone sells nothing.
4. Choose **Sell**, amount **3**, minimum payout **0**, then **Sell cargo**. Read **Delivery complete**, increased credits and updated Habitat oxygen. In the recorded solo reference route, this sale paid 15 credits, leaving 32; online prices and accepted quantities can differ.
5. Open **Match history** to inspect the three completed moves. Open **Quick rules** to review objectives; sound is opt-in through the top bar. **How to play** on the home page contains numbered desktop/phone screenshots.

This route runs in the browser. It demonstrates gameplay, not a newly signed NEAR transaction.

## Inspect real NEAR evidence without signing

The contract is [`last-light-market-a2500d58.testnet`](https://testnet.nearblocks.io/address/last-light-market-a2500d58.testnet). Tess uses a separate [`tess.last-light-market-a2500d58.testnet`](https://testnet.nearblocks.io/address/tess.last-light-market-a2500d58.testnet) wallet.

- [Match 000008](evidence/hybrid-hosting/live-match.json): two isolated browser wallets, twenty rounds, reload recovery and full engine/chain agreement.
- [Exact NPC-order proofs](evidence/hybrid-hosting/npc-proof.json): twenty successful, independently signed orders and a key limited to `submit_order` on the game contract. The [transaction index](../submission/chain-proof.md) links each public outcome.
- [Full replay](evidence/hybrid-hosting/live-replay.json): human orders, NPC actions, rotating priority, district stock, credits and cargo.
- [Restart/recovery](evidence/hybrid-hosting/restart.json): all 70 confirmed receipts survived replacing the backend container; [two fresh browsers](evidence/hybrid-hosting/recovery.json) recovered all twenty receipts for the completed match.

These are actual testnet results. Setup used Node-held QA wallets; gameplay used real browser-held restricted keys. The automated checks are not a human usability study.

## Try a new online match

This optional path sends real testnet transactions and needs two different funded testnet wallets. Solo play and the existing evidence can be reviewed without them.

1. Both choose **Play online → Connect wallet**. Each connects their own wallet. Use **Get test NEAR** if necessary.
2. Enable **fast actions** to avoid a wallet popup each move. The permission covers four game methods and up to 0.25 test NEAR for fees; it cannot transfer NEAR. It can be revoked in the online lobby.
3. One player chooses **Create match**, approving the shown **0.5 test NEAR non-refundable storage payment plus fees**. Share the invite/code; the other player chooses **Join match**, paying fees only.
4. Both choose **Ready to play**. Each round gives fifteen seconds to save or update a move. **Move saved** does not change cargo or credits immediately; read the result after the round ends.
5. Reconnect with the same wallet and code to recover the merchant. When everyone disconnects, a round waits for someone to settle it; the world does not simulate independently forever.

NEAR enforces seats, inventory, credits, offers, cutoffs and round results. The board withholds rival cargo; onchain records remain public.

## Merchant market moment

At the Depot, load cargo and choose **Market**. List a whole lot at your price per unit. In a later round another merchant at the Depot can choose **Buy lot**. The exact offer version, amount and price bind the purchase; a changed offer rejects without moving credits or goods. Tess can buy and post offers too. In recorded match 000008, she bought three oxygen from the human merchant for nine credits and later delivered it.

## Scope and reproduction

Run `npm ci`, `npm test` and `npm run build:vercel` with Node 24. `python3 scripts/verify_release.py` checks the independent historical model and generated references. The [NEAR integration guide](near-integration.md) documents the Rust/WASM sandbox. Live verification commands are explicitly separate because they can create accounts and send transactions.

Credits/cargo are game units, not cash or transferable external tokens. Social login, NEP-245 items, a mainnet release and proven economic balance are not implemented. The submission materials and demo-post text remain drafts until the builder approves and publishes them.
