# Baseline design coverage

Every screen reuses `tokens.css`, `components.css`, the same icon geometry and one display font. Inspect the screen/action/order selectors in `runtime/index.html`. A full game engine is deliberately not bundled into the design library.

| Screen / state | Visual assets | Required behavior at implementation |
| --- | --- | --- |
| Entry / lobby | Colony background, wordmark, three merchant marks | Match identity, join/create, two human seats, fixed NPC, testnet identity, ready states |
| Wallet setup | Shared panel, lock/link/check icons | Explain restricted function-call permissions before setup; external wallet-provider UI remains provider-owned |
| Loading | Shared panel, progress meter, retry icon | Real progress; retry on missing asset; text if renderer cannot start |
| Match | District atlas, tug, SVG routes, status strip | Always-visible round, oxygen, health, medicine, decision timer and current action |
| Critical oxygen | Same board, danger banner and warning icon | Explicit deadline, zero stock, rescue options; no full-screen flashing |
| Cargo empty | Cargo icon and clear text | Show no goods; preserve useful buy, travel and wait choices |
| Preview / queued / included / settled / rejected | One shared receipt component and distinct icons | Distinct meanings. Included orders public. No pending inventory changes |
| Closed / stale / duplicate order | Rejection component | Reason, match/round, ownership unchanged, safe recovery path |
| Reconnect / delayed settlement | Reconnect icon, panel, last known round | Mark stale state; reconcile before resubmission. No promise that the live match paused |
| Survived | Existing background, trophy icon and score table | Verify final reserves; cash + cargo salvage − 25; ties share placement |
| Colony collapse | Same background, shared-loss text and cause | No winner, even if a merchant leads in cash; show actual collapse cause/round |
| Help / settings | Shared panels, action icons, mute/settings/help | Rules, sound opt-in, reduced motion, readable contrast, keyboard focus |

## Action designs

The gallery provides each action layout. Form inputs are design examples and never submit transactions or calculate authoritative quotes.

| Action | Inputs / pre-confirmation data | Receipt |
| --- | --- | --- |
| Buy / refill | Good, quantity, tank refill, fixed price, depot stock, cargo after, cash/cost | Accepted quantity, credits spent, stock and tank changes |
| Travel | Current node, legal destination, arrival/sale round, tank and reserved return fuel | New location and fuel spent; no automatic sale |
| Sell oxygen | Requested amount, max fill, per-unit repricing, estimate, minimum total, storage/quota/treasury | Exact quantity and payout or whole-action rejection |
| Sell medicine | Requested amount, min total, clinic room, deadline, health, lifetime cap | Exact fill and payout; health is not restored |
| Plant fuel | Cargo fuel, all-or-nothing quantity, output, min total, lifetime cap, storage/quota | Atomic payment and immediate oxygen creation |
| Wait | Current cargo, next public events, survival deadline | No trade; scheduled consumption still occurs |

## Consistency and accessibility

- Depot is the only transit hub. Routes are depot↔habitat and depot↔clinic. No direct district route.
- Resource glyphs: cylinder, medical case/plus, fuel can. Merchant glyphs: triangle, diamond, circle. Avoid leaf symbols for oxygen.
- Normal selected state is mint, fuel/time warning amber, medicine coral. Critical state is strong red plus explicit text and icon.
- Input targets are at least 44px. Focus is visible. Never communicate status by color alone.
- At 1366×768 keep the primary action within the game viewport. On narrow screens use the compact board over an action sheet; keep vital status at the top. Review at 390px as well as the target devices.
- HTML text stays selectable and accessible; decorative art is not a canvas substitute for controls.
- State samples may differ between selected action variants. They are labeled design references, not a continuous match replay.

## Motion and audio

Feedback: 140ms. Panels: 180ms. Settled travel: up to 600ms. Apply only transform/opacity where possible, never animate all UI continuously. Turn off decorative motion with prefers-reduced-motion and pause rendering when hidden. The provided 8 procedural cues are short and quiet; sound is off initially and requires a user gesture. No music, video, particle storm or periodic alarm is needed for the baseline.
