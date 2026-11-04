# NEAR testnet integration

Public game: [Last Light](https://last-light-colony.faleyeoluwapelumi.chatgpt.site). The contract is `last-light-323356eb.testnet`. This deployment is testnet only. Credits, cargo and scores are non-transferable, match-scoped game units; they are not fungible tokens or redeemable balances.

## Play

Choose **Play on NEAR testnet**, connect a testnet wallet, and create a match or enter an invite code. A different wallet owns each merchant. Creating a match attaches **0.5 test NEAR** for bounded contract storage; joining and playing use gas. There is no stake or prize pool, and the storage payment is not refunded. The account must have enough test NEAR for storage and transaction fees.

An optional **game key** authorizes only `join_match`, `ready_match`, `submit_order`, and `settle_round` on this contract, with a 0.25 test NEAR gas allowance. It cannot transfer funds, deploy code, create matches or archive results. The restricted private key stays in the browser's local storage; the user's full-access key remains in their wallet. Revoke the game key from the NEAR lobby, or remove it through the wallet's access-key controls. Browser storage clearing does not revoke an onchain key. Wallet-only play is supported but requires signatures, including a settlement transaction after cutoff; enable the game key for the fifteen-second loop.

Both players ready onchain. The contract then opens a **15-second decision window** using block timestamps. Transactions included at or after the cutoff reject without carry-over. A confirmed order means **included**, not an accepted trade: the contract resolves competing actions in rotating priority after cutoff. The next window starts when settlement executes. Either merchant's game key can settle automatically; anyone may call `settle_round`. Duplicate settlement returns the existing state. If both players leave, the current round waits for a settlement transaction rather than silently simulating later rounds.

Refresh retains `?near=MATCH_CODE`. Connect the same wallet and choose Join / reconnect. Seat ownership comes from the contract account mapping; no server token can impersonate it. The map withholds rival cargo, but chain state and included orders are public. The ledger links real transaction hashes and exports the authoritative history with the current browser's transaction evidence. An exported trace alone is not a blockchain receipt.

## Contract

Source: `contracts/last-light/src/`. Rust 1.86.0, pinned near-sdk 5.17.2, pinned dependencies in Cargo.lock. The model ports the original rules and fixed NPC policy; the original JS and Python models remain independent comparison references.

- `create_match(identity)` — payable; assigns caller A.
- `join_match(match_id, identity)` — assigns B or restores the caller's existing seat.
- `ready_match(match_id)` — requires a seat owner.
- `submit_order(match_id, round, order)` — requires a seat owner, a current round and inclusion before cutoff; replaces that merchant's pending action.
- `settle_round(match_id, round)` — permissionless after cutoff, atomic and idempotent.
- `get_match(match_id)`, `list_matches(from_index, limit)`, `version()` — public views.
- `archive_match(match_id)` — only finished matches; both owners must vote before data is removed. Export evidence first. This is deliberately excluded from game-key permissions.

Storage is bounded to 100 retained matches and twenty rounds per match. Open match registration uses a public code, not a secret invitation or an opponent allowlist. The deployment account retains upgrade authority: this is a development contract, not an immutable audited mainnet economy. No player resale market, FT/NFT, cross-chain bridge, mainnet payments or autonomous LLM merchant is claimed.

## Build and verify

On Linux install Rust 1.86.0 with `wasm32-unknown-unknown`. On Windows the build helper uses the installed Ubuntu WSL distribution.

```text
npm ci
npm run build:contract
# Build the native model comparison binary:
cd contracts/last-light
cargo build --locked --features model-testing --bin trace
cd ../..
npm run verify:near
npm test
npm run build
```

`verify:near` compares a twenty-round survival trace and 100 adversarial settlements, including complete receipts, NPC decisions, ownership and balances. `contracts/testing/sandbox.mjs` deploys actual WASM to NEAR sandbox and tests permissions, early/late cutoffs, replacements, idempotence and all twenty rounds. It uses Linux-only `near-workspaces`; install with `npm ci` in `contracts/testing`. Its legacy package defaults to an old sandbox binary; `scripts/run-sandbox.sh` selects NEAR sandbox 2.14.0 from `$HOME/.cache/last-light-sandbox-2.14.0/Linux-x86_64`.

`tests/near-testnet.mjs` controls two isolated browsers and real testnet accounts. Its QA wallet is injected by Playwright and signs setup transactions in Node; no full-access key enters the browser. Gameplay uses the production browser signer and real restricted keys, not mocked RPC or local settlement. The test verifies all settled states against the JS model and reloads one browser. It is a deterministic integration test, not a human playtest or balance proof. New output lives under ignored `qa/near/`; selected public reports are committed in [docs/evidence](evidence/README.md).

`scripts/deploy-near.mjs` creates a new account through the testnet faucet only when needed, then deploys and verifies `version()`. It reuses `data/near-deployment.json`, writes public configuration to `client/near-config.js`, and keeps private credentials **outside the repository** under the current user's `.near-credentials/testnet/`. `NEAR_DEPLOY_ACCOUNT` selects another existing testnet credential. Do not run it against a populated incompatible contract state without migration; this build has no generic state migration. Never commit private credentials.

## Hosting and local durability

The hosted build is a static client: practice runs in the browser and online matches read/write NEAR directly. It requires neither the local Node server nor a server-held player key. Local WebSocket room controls are omitted from that build because they would require an additional Node host.

The complete Node build retains local-room play. It stores room state, pending orders, deadlines, identities and hashed seat tokens atomically in `data/rooms.json`. Set `ROOM_STORE` to an absolute persistent-volume path in production. One process owns the file; this is not a multi-instance database. A restart recovers the pending round and settles an expired cutoff once, then opens a fresh window. Corrupt storage fails closed. Disconnected rooms are retained for 24 hours. Losing the original tab's session token cannot be repaired by guessing a code.

`Dockerfile` runs the Node build; mount `/app/data` as a persistent volume and terminate HTTPS/WSS at a proxy. Public NEAR play is independent of this optional local-room service. The public source release is [Pelz01/lastlightgame](https://github.com/Pelz01/lastlightgame). The separate Sites publishing repository is private.

## References

- [Official Rust contract quickstart](https://docs.near.org/smart-contracts/quickstart)
- [NEAR Connect](https://docs.near.org/tools/near-connect)
- [Access-key permissions](https://docs.near.org/protocol/accounts-contracts/access-keys)
- [Testnet accounts](https://docs.near.org/getting-started/create-account)

## Verified deployment evidence — November 3, 2026

The deployed WASM SHA-256 matches the current build artifact. NEAR testnet match `000001` completed twenty rounds through two isolated browser wallets and survived, with every state matching the JS oracle. One browser reloaded and recovered on round 2. The QA wallet signed setup transactions in Node; real browser-held restricted keys submitted gameplay actions. Test-only game keys were revoked afterward. The public desktop and phone builds loaded the real wallet manifest and selector.

- `qa/near/parity.json`: twenty-round model trace and 100 adversarial comparisons.
- `qa/near/sandbox.json`: actual WASM, twenty rounds and contract authorization/cutoff/idempotence tests.
- `qa/near/testnet.json`, `testnet-replay.json`: live two-wallet testnet evidence.
- `qa/near/hosted.json`: public desktop/mobile and real wallet selector checks.
- `hosting/deployment.json`: public site deployment and version identifiers.

The local suite passes 26 unit tests, twenty-round self-play, two-tab room settlement, the focused live-interaction regression, colony feedback and desktop/mobile landing checks. The complete client is about 1.01 MB uncompressed; the ~297 KB wallet bundle loads only on wallet connection.
