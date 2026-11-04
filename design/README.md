# Last Light design library

**Current direction: ground colony + merchant rovers.** Start with [GROUND-V2.md](GROUND-V2.md), [the new asset gallery](runtime/ground-index.html), and [the original generation prompts](GROUND-PROMPTS.md). The orbital v1 material below is archived reference. All new masters are preserved in `assets/ground-v2/` and optimized files in `runtime/`.

This directory preserves original masters and optimized runtime assets.

Open **runtime/index.html** in a browser to inspect the responsive design library. It works offline without a server. Screen, action, colony and order selectors demonstrate the baseline UI. This is a design handoff, not the game.

## Contents

| Folder / file | Purpose |
| --- | --- |
| `assets/` | Five original PNG masters: screen concept, environment, resource sheet, district sheet, ship |
| `runtime/` | Optimized WebP textures, atlas JSON, 34 SVG icons, wordmark, mark, font, tokens, components, procedural audio and offline design viewer |
| `src/` | Editable vector geometry, design tokens, CSS, gallery templates and sound code |
| `PROMPTS.md` | Exact built-in image-generation prompts and corrections |
| `DESIGN.md` | Original direction and research; updated implementation conventions below supersede early suggestions |
| `SCREENS.md` | Complete baseline screen, action and feedback coverage |
| `PERFORMANCE.md` | Loading strategy, asset budgets, memory guidance and source references |
| `runtime/manifest.json` | Exact file sizes, SHA-256 hashes, load groups and budget results |
| `qa/report.json` | Latest local browser and asset validation |

## Final conventions for this pack

Use the district atlas and vector routes for the interactive match board. Use the cinematic colony background for lobby/results only. Never load both board representations during a normal match. The flattened image concept is reference-only and must never appear in a production load group.

Use one self-hosted Barlow Condensed 600 Latin WOFF2 for display headings, system sans for instructions and a system monospace for numbers. The font's SIL OFL license is included. There are no third-party artwork files or CDN dependencies. Icons, merchant marks and wordmark are original SVG; raster artwork uses built-in image generation. Coral identifies medicine; danger has a separate explicit CRITICAL message and stronger red. Merchant seats use triangle, diamond and circle marks independent of resource symbols.

All-or-nothing plant sales, accepted-quantity previews, minimum payout, separate travel/sale, public orders and final viability follow the blueprint. Gameplay integration must bind illustrative state to authoritative rules. Do not infer validation or balance from this viewer.

## Build and verify

Requires Node.js 22+ and npm. Build tooling is development-only; never ship node_modules.

```powershell
cd 'C:\Users\faley\Documents\Last Light\design'
npm ci
npm run build
npm run verify
```

Verification uses installed Edge or Chrome, falling back to Playwright Chromium if available. It checks desktop/mobile states, UI scripts, image loading, overflow, reduced motion, atlas frames, transparency and asset budgets. QA screenshots are saved under `qa/`.

The archive `last-light-design-kit-v1.zip` is a portable copy of sources, masters, runtime and documentation. It excludes node_modules. Nothing has been uploaded or published.

## What is complete

The visual assets and reusable components needed for the current locked prototype are covered: lobby, loading, gameplay, six action previews, crisis, transaction states, reconnect, help/settings, survival/shared-loss results, resources, districts, ship, marks, icons, typography and optional sound cues. Desktop/mobile review views are included. More content is required only if scope expands, such as player resale, cosmetic progression or characters.

Human usability, actual frame rates on target phones, wallet-provider integration and onchain state handling must be verified in the playable build. The pack does not claim those are complete.
