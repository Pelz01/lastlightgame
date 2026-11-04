# Merchant economy verification — November 4, 2026

Contract: last-light-market-a2500d58.testnet. NPC wallet: tess.last-light-market-a2500d58.testnet. Rules version 2 / game release 0.3.0. These are automated integration checks, not human playtests.

| Report | Evidence |
| --- | --- |
| [NPC transaction proof](npc-transactions.json) | All twenty real NPC signatures, exact round orders, complete JS/chain state parity, and restricted access-key permissions |
| [Live match](live-match.json) | Twenty-round two-browser match 000005: player listing, NPC purchase, round-five rescue and shared survival |
| [Recovered match](recovered-match.json) | Same result and all twenty verified NPC receipts recovered in fresh browser sessions |
| [Integration phases](testnet-run.json) | Live state checks plus targeted receipt recovery after the reload fix |
| [WASM sandbox](wasm-sandbox.json) | Separate NPC authority, first-order locking, missing NPC wait, actual A-to-B transfer and full match parity |
| [Model parity](model-parity.json) | Twenty market rounds and 120 adversarial settlements, including ownership and money conservation |
| [Published market controls](browser-market.json) | A-to-B purchase, exact lot terms, laptop confirmation visibility and phone overflow checks |
| [Hosted artifact](hosted-artifact.json) | Public wallet, market, configuration and CSS hashes match the deployed manifest; client stays below 1.2 MB |
| [Deployment](deployment.json) | New account, real deployment hash and WASM SHA-256; previous deployment preserved separately |

The live match survived with two oxygen, one medicine and two clinic health. Tess paid 9 credits for three oxygen, then delivered them for 21 credits. A browser reloaded during round two. QA injected wallets signed setup in Node; browser-held restricted keys submitted human gameplay. The NPC used its own hosted restricted key. No RPC or contract execution was mocked in the live run.

Testing found and fixed request-scoped Worker resource reuse, stale access-key nonces during reconnect, laptop action placement and incomplete browser-local NPC receipt recovery. In the initial completed live run, nineteen NPC hashes reached browser-local history even though all twenty transactions were confirmed. The authoritative public proof verified twenty; the client was then updated to hydrate verified hashes from durable storage, and recovery was tested in fresh browser sessions. The integration report distinguishes those phases.

The NPC is a deterministic policy, not an LLM or unattended scheduler. Test-only human game keys are revoked after verification. Tess's restricted production key remains active. This demonstrates ownership, settlement and price-sensitive behavior; it does not establish broad balance or human enjoyment.
