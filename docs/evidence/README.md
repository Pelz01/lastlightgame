# Verification evidence

Current v0.3 merchant-market and separate-NPC-wallet results are in [merchant-economy/](merchant-economy/README.md). They include the twenty-round testnet match, wallet signature proof and receipt-recovery checks.

## Historical v0.2 baseline

The reports below were generated on November 3, 2026 against the deployed testnet build. They establish integration behavior, not human enjoyment or strategic balance.

| Report | Evidence |
| --- | --- |
| [Live testnet run](testnet-run.json) | Two browser wallets, all 20 rounds, reload on round 2, full state parity |
| [Full match replay](testnet-match.json) | Authoritative game history and public transaction hashes |
| [WASM sandbox](wasm-sandbox.json) | Real deployed WASM; authorization, early/late cutoffs, replacement, idempotence and terminal protection |
| [Model parity](model-parity.json) | Full 20-round Rust/JS trace and 100 adversarial settlements |
| [Hosted client](hosted-client.json) | Desktop/mobile, real wallet selector, public-origin RPC and practice |
| [Deployment](deployment.json) | Contract account, deployment hash and WASM SHA-256 |

The live test used Playwright-injected QA wallets for setup. Gameplay used real restricted function-call keys and real testnet RPC. These test-only keys were revoked afterward. No full-access key is included.

See the root README and docs/near-integration.md for reproduction commands. New runs write to ignored qa/; committed reports are historical snapshots rather than automatically updated pass claims.
