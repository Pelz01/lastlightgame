# Current game build

Last Light supports NEAR testnet play, browser practice, pass-and-play and same-network rooms. See the [README](../README.md) for installation and [NEAR guide](near-integration.md) for chain behavior.

## Local play

Run `npm ci` and `npm start`, then open http://127.0.0.1:4173/. Node 24 LTS is recommended; no design-tool installation is needed.

- **Play now:** optional suggestions and a disclosed training rival; changing the route can change the outcome.
- **Play both sides:** untimed A/B control. Confirm both orders before settlement. Pending moves and seat selection survive resume.
- **Create room:** fifteen-second multiplayer with another tab or device on the same network. Refresh retains the room code.
- **Play online:** two testnet wallets share a contract match using the same rules and map.

Local rooms atomically store game state, pending orders, deadlines and hashed tokens in `data/rooms.json`. Set `ROOM_STORE` to a persistent-volume path for hosted Node rooms. Restart recovery settles an expired round once, then opens a fresh window. Corrupt storage fails closed. One process owns the file; original-tab session tokens are required for seat recovery.

## Map and interactions

Destinations are depot, habitat and clinic; the plant is a habitat annex. Three rovers move after accepted travel. Loading, travel and sales are separate actions. Buildings react to shortages and production. Previews respect accepted quantities, storage and quota. Reduced motion uses immediate positioning. Live updates preserve editing and ledger reading.

Masters, prompts, optimized atlases and SVGs are in [design/](../design/README.md). The wallet bundle loads on connection, not during practice. `npm run build` enforces the client budget.

## Architecture

`game/rules.js` supplies practice and local transitions. `game/rooms.js` manages seats/cutoffs; `game/room-store.js` persists them. `server.mjs` serves an allowlisted client and WebSocket endpoint.

`contracts/last-light/src/model.rs` ports the rules/NPC policy; `lib.rs` adds authorization, storage and chain cutoffs. `client/near-chain.js` handles wallets, restricted signing, finalized reads, evidence and recovery.

The static public client runs practice in-browser and sends online actions directly to NEAR. Local WebSocket controls are omitted; the development computer can be offline. The optional Node Docker build uses a persistent `/app/data` volume.

## Verification and limits

See [committed evidence](evidence/README.md) for the testnet match, actual-WASM sandbox, parity and public desktop/mobile checks. Generated output is ignored under `qa/`; selected public reports are committed under `docs/evidence/`.

Human playtesting and balance work remain. The NPC has no independent signing wallet, and direct player resale is not implemented.
