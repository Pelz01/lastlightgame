# Vercel frontend and VPS backend

The frontend is a static Vercel build with two small server-side proxy functions. The VPS owns Tess's signing service and SQLite receipt/lease store. NEAR testnet remains authoritative for game state, balances, ownership and settlement.

The public game is **https://last-light-site.vercel.app/**. The existing Sites address remains a frontend mirror. The dedicated HTTPS backend is `https://lastlight-backend.51-195-137-246.sslip.io`; it does not use the Boomster domain or routes.

## Frontend

Use the repository root as Vercel's Root Directory. `vercel.json` runs `npm run build:vercel`, serves `dist`, and packages `api/npc/tick.js` and `api/npc/receipts.js`. The build omits development room controls; solo and NEAR online play are the public entry points. The internal two-seat test mode is exercised through a saved QA fixture, without a landing link.

Configure these server-only variables in production and preview:

- `LAST_LIGHT_BACKEND_URL`: the backend's HTTPS origin.
- `LAST_LIGHT_BACKEND_TOKEN`: its proxy credential, marked sensitive.

No NPC signing key belongs on Vercel or in a browser bundle. The proxies accept only a six-character match code, discard incoming cookies/credentials when contacting the backend, validate the caller's origin, reject redirects, and return uncached JSON. The browser chooses neither Tess's order nor her signing destination.

## Backend

`deploy/vps/compose.yml` runs one non-root Node 24 container with a persistent data directory, read-only secret mounts, restart policy, bounded logs and a health check. The container listens only on host loopback port 8796. Nginx provides HTTPS on a separate hostname; the existing applications' routing files need no edits.

Run Compose with an external environment file containing `LAST_LIGHT_DATA_DIR`, `LAST_LIGHT_SECRETS_DIR`, `RELEASE_SHA` and `NPC_SIGNING_ENABLED`. The secrets directory contains `npc-runner.json` (the existing contract-restricted `submit_order` key) and `proxy-token`. Both files must be readable only by the deployment user, whose UID matches the container's `node` user. Store neither file in Git or Docker build context.

`BACKEND_ONLY=true` disables frontend and room endpoints. Both NPC endpoints require the proxy credential. `/health` reports liveness, signing readiness and release identity without revealing credentials. SQLite uses WAL, full synchronization and a busy timeout; leases and receipts survive process/container restarts. Back up the database using SQLite's backup mechanism rather than copying a live database file without its WAL.

## Cutover and recovery

1. Deploy with signing disabled. Confirm TLS, health, proxy authentication and rejection of caller-supplied orders.
2. Snapshot public receipt hashes from the old service. `scripts/import-npc-receipts.mjs` verifies each transaction's signer, receiver, action, match and round against NEAR before importing it. Pending leases are not migrated. Historical proofs use NEAR’s archival testnet RPC; the live RPC may no longer retain older transaction outcomes.
3. Point the existing Sites mirror and Vercel proxy functions at the VPS. Remove the old Worker signing secret during cutover. Enable the VPS signer only after the old service stops accepting signing jobs; keep one active signing backend.
4. Verify online gameplay, all NPC signatures, receipt recovery and a backend restart. Keep the old frontend usable as a mirror. Wallet-owned NEAR matches retain the same contract and match codes across frontend domains. Browser-only practice saves remain with their original origin.

The supplied Nginx template has a hostname marker for deployment substitution. A custom purchased domain is optional: Vercel supplies a frontend address, and a free IP-based HTTPS hostname can serve as the backend origin. That free DNS provider is an infrastructure dependency; it can be replaced without changing game code or match ownership.

Use an immutable source revision for each backend image and retain the previous release plus shared data for rollback. The deployed addresses, source revisions and verification results belong in the release evidence, not in frontend secrets.

Browser receipt recovery also uses the archival RPC. The proxy uses manual redirect handling and rejects all redirect responses; Cloudflare Workers does not support Fetch’s `redirect: "error"` mode ([runtime documentation](https://developers.cloudflare.com/workers/runtime-apis/request/)). This preserves the same rule across Node and Worker deployments without following a credential-bearing redirect.

The November 13 cutover and public playtest are recorded in [release evidence](evidence/hybrid-hosting/README.md). Current archival queries use FastNEAR’s [documented archival endpoint](https://docs.fastnear.com/rpc). Audit scripts pace read-only proof requests and retry HTTP 429 responses; these retries never resend a gameplay transaction.
