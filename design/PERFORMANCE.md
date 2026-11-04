# Lightweight asset pipeline

This is a 20-round strategy game with three locations. The proposed rendering approach is a static 2D board with reusable sprites and accessible DOM controls. Do not add a 3D engine solely to display prerendered artwork. If a game engine is selected later, the exported JSON texture atlases are compatible with Phaser-style atlas loading.

## Research applied

- [Phaser Loader](https://www.phaser.io/oss/docs/phaser/concepts/loader): scene-based loading queues and asset caches. Load only what the active screen requires.
- [Phaser rendering concepts](https://phaser.io/tutorials/phaser-4-rendering-concepts): texture atlases reduce texture switching. Resources share one sheet; districts share another.
- [web.dev image performance](https://web.dev/learn/performance/image-performance): appropriate dimensions, SVG for simple line art, modern image formats. Masters remain PNG; runtime textures are sized WebP.
- [MDN Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices): user-gesture activation and user control. The sound module is optional and synthesizes cues locally.

This is an application of those principles to Last Light's scope, not a claim that an engine guarantees a particular frame rate.

## What ships

| Asset | Export |
| --- | --- |
| Lobby/result environment | 960px and 1440px WebP alternatives; request one, not both |
| Match districts | 1152×384 RGBA WebP, three 384px atlas frames |
| Cargo | 768×256 RGBA WebP, three 256px atlas frames |
| Merchant tug | 256px-wide RGBA WebP; shared across all merchants |
| Controls/icons/wordmark | Small SVG and CSS, no bitmap buttons |
| Typography | One Latin 600 WOFF2, system fallbacks, font-display swap |
| Sound | ~1KB optional Web Audio module, zero audio-file downloads |
| Concept screenshot | Review only; exclude from production builds |

Use atlas JSON coordinates for a canvas renderer, or CSS background positions for DOM sprites. The gallery demonstrates the latter. Keep the alpha padding; do not rotate/flip district sprites to invent locations. Merchant identity comes from vector badges, so no duplicate ship textures are needed.

## Budgets and measurements

`runtime/manifest.json` is the source of truth for actual byte counts and hashes. `node build.mjs` fails when asset budgets are exceeded:

- Boot + match assets: at most 750,000 bytes.
- Boot + mobile lobby art: at most 500,000 bytes.
- All production raster variants together: at most 1,500,000 bytes.

These numbers exclude game code, wallet libraries, chain/RPC traffic, gallery files, source PNGs and transport compression. Match and lobby groups share boot assets. The asset gallery deliberately loads more than a production scene because it displays the entire library. Do not use its total page weight as the production loading plan.

Compressed download size is not GPU memory. Approximate uncompressed RGBA residency is width×height×4 before mipmaps and engine overhead. Keep the match district/resource atlases and one tug resident; unload or omit cinematic backgrounds during a match. Cap device-pixel-ratio rendering at a measured level, starting at 1.5 on low-end phones; avoid allocating screen-sized canvas buffers repeatedly.

## Loading plan

1. Boot: wordmark, basic CSS, icon sprite. Allow fallback fonts immediately.
2. Lobby: select 960px or 1440px environment based on rendered size. Preload match atlases only after joining/ready intent.
3. Match: await the district/resource textures and ship. Remove lobby background references. Reuse cached sprite textures and HTML controls.
4. State changes: update values and CSS classes; do not fetch new crisis/result illustration variants. Results may reuse the cached environment after settlement.
5. Sound: import only after user opt-in. Cancel/pause optional effects when hidden. Never put audio decoding or asset downloads in a round-settlement callback.

Use content hashes from the manifest for deployed cache versioning. Retain old assets while old clients can still request them. Match network inclusion/settlement timers remain authoritative and independent of rendering frame rate.

## Before release

Measure on a real target phone over constrained network conditions: time to readable lobby, time to ready match, input latency, memory, background-tab return and stale-state recovery. The current QA checks local layouts and assets; it does not establish production FPS, latency or wallet behavior.
