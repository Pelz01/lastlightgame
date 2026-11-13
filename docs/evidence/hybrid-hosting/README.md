# Vercel / VPS release — November 13, 2026

Public game: [last-light-site.vercel.app](https://last-light-site.vercel.app/). The [existing Sites address](https://last-light-colony.faleyeoluwapelumi.chatgpt.site/) remains a mirror. Both call the same authenticated VPS signing service; the game contract remains `last-light-market-a2500d58.testnet`.

## Actual verification

- [Live match 000008](live-match.json) completed 20 rounds through two isolated browser wallets on the Vercel frontend. Setup used Node-held QA wallets; real restricted browser keys submitted game actions. No RPC or contract results were mocked.
- [Replay](live-replay.json) and [NPC proofs](npc-proof.json) verify every round's complete result against the JS engine, every human planned move, and all 20 independently signed NPC orders. Tess bought a player lot and delivered it. The colony survived.
- [Restart](restart.json) retained all 70 confirmed receipt rows after replacing the backend container. [Two fresh browsers recovered match 000008](recovery.json), including all 20 NPC receipts. [Older match 000005 also recovered](archived-recovery.json), with its historical outcomes verified through archival RPC.
- [HTTP checks](http-checks.json) cover both frontend proxies, receipt history, completed-match handling, unauthorized backend access, caller-supplied NPC orders and cross-origin writes.
- [Vercel onboarding](vercel-onboarding.json) and [Sites onboarding](sites-onboarding.json) check the first-play dialog, persistent opt-out, quick rules in the match and online lobby, mute, preserved draft inputs and an actual nonzero Web Audio waveform. These checks do not measure physical speaker volume.
- [Vercel guide](vercel-visual-guide.json) and [Sites guide](sites-visual-guide.json) check 1366, 390 and 360 px widths, next-step controls, image enlargement and loading only the screenshots appropriate to that device. Pictures are absent from landing-page requests.
- The suite has 43 passing JS unit tests. Twenty-round self-play, the full first-delivery walkthrough, compact landing and corrective error checks also pass. The FAQ source and generated outputs contain 24 synchronized questions.
- Test-only human function-call keys were [revoked after verification](test-key-cleanup.json). The production NPC's restricted key stays on the VPS; no human private key or NPC signing key is held by Vercel.

## Issues found during this release

The old Sites mirror rejected the Fetch `redirect: "error"` mode. The shared proxy now uses manual mode and rejects redirect responses explicitly. The sound module had an incorrect MIME type on that host; `.mjs` now serves as JavaScript. The online lobby omitted its old rules panel; Quick rules now uses a native dialog outside the part of the UI replaced by game updates.

The first two automated attempts, matches 000006 and 000007, did not complete the planned route. Historical verification inside the driver's 15-second decision loop delayed human inputs. The corrected driver keeps both browsers submitting moves and verifies all planned orders, settled records and final state afterward; match 000008 passed. The failed attempts remain visible on testnet.

The regular RPC did not retain older transaction outcomes. Receipt recovery uses an archival endpoint, and recovery requests are sequential within each browser. Proof audit scripts pace reads and retry rate-limit responses. This read-only retry does not submit or repeat a game transaction.

## Release identities and operating limits

[Deployment metadata](deployment.json) identifies the tested frontend source, VPS image and mirror version. The [runbook](../../hybrid-hosting.md) covers credentials, cutover, backup and recovery. Thirty-three confirmed pre-cutover receipts were verified on NEAR and imported; transient leases were not migrated. The old D1 database remains a historical backup, with its signing secret removed.

This is ready for public playtesting on testnet, not evidence that the economy is balanced or that first-time humans will understand every instruction. The VPS, free backend DNS hostname, Vercel and public NEAR RPC are external dependencies. Production-size traffic would need capacity and RPC planning. Practice saves and preferences belong to their browser origin; wallet-owned online matches retain the same contract and match codes across both frontends.
