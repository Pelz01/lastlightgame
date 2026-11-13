# Submission readiness — November 13, 2026

**Preparation complete; application not sent.** The builder confirmed “not submitted yet.” Required personal details, final choices and the public demo-post link are still outstanding.

## Checked now

| Check | Result |
| --- | --- |
| Public source repository | `Pelz01/lastlightgame` is public; both project READMEs disclose the independent Accord/Last Light entries |
| Hosted game and mirror | Both returned HTTP 200; both exposed all twenty saved NPC receipts for match 000008 |
| Backend | Healthy, signing service ready, public local-room controls disabled |
| Deployed contract | Version 0.3.0, rules version 2; deployed WASM SHA-256 matches the recorded release artifact |
| NPC authority | Current key is limited to `submit_order` on the game contract; all twenty live receipt hashes match the verified proof file |
| JS checks | 43 tests passed; zero failed |
| Production build | Passed; 1,068,949 core bytes plus 252,048 optional handbook-image bytes |
| Independent reference gate | Six checks passed from a clean Git archive: Python tests, edges, witness, FAQ, replay and strategy replay |
| Retained history | 42 reachable revisions scanned for NEAR private-key encodings and private-key headers; no findings. This is a scoped pattern check, not an exhaustive third-party secrets audit |
| Demo images | Six current screenshots, captured separately on desktop and phone through the real solo controls; both routes ended with Delivery complete and 32 credits |

The machine-readable snapshot is [verification.json](verification.json). The unit/runtime audit started at commit `da4092645d70f5117b9f726b88a7fd7e36e1317a`; the submission-preparation changes update documents, media and a screenshot-capture helper, not game rules or contract deployment.

## Existing execution evidence

The [hosted release](../docs/evidence/hybrid-hosting/README.md) includes an actual two-browser, twenty-round testnet match, full state parity, all NPC signatures/exact orders, a market purchase, and recovery after replacing the backend container. The earlier match 000005 and v0.2 reports are retained and labelled. This preparation did not create another match, sign a transaction or spend tokens.

The first-delivery, onboarding, audio, responsive guide and browser controls were checked in the preceding release. The new screenshots repeat the current first delivery through hosted UI controls. No independent human usability or balance study is claimed.

## Builder decisions still pending

- Team lead name, contact email and team size.
- Mainnet NEAR account to receive a prize, supplied by the builder. Do not use the game's testnet contract or invent an address.
- Approval of the recommended `games` track, project description and demo assets.
- A public X demo post, published by the builder with the required event tags and attached media; its URL is needed for the form.
- Contact consent and separate approval of the exact final application.

Only after those details are reviewed should a private application payload and request ID be prepared. Before any later send, recheck the live rules, confirm the project is still unsubmitted, display the complete exact payload and wait for explicit approval. If an already-saved application needs a correction, use the organizer's change-request process rather than creating a duplicate.

## Boundaries to preserve in the demo

Practice runs locally in the browser; online ownership and settlement use NEAR testnet. Credits/cargo are match-scoped game units with no cash value. The NPC follows a rule-based policy. Social login, NEP-245 items, mainnet deployment and proven human enjoyment are not implemented. Do not relabel the supplied solo screenshots as wallet or chain footage.

Vercel, the VPS, free backend DNS and public RPC are operating dependencies. Keep the demo running during judging. Account for the 0.5 test NEAR storage payment and fees if demonstrating new online matches; review commands that create accounts or sign transactions before running them.
