# Ground colony and rover design kit

This is the current visual direction. The earlier orbital kit remains available as an archive; it is superseded for gameplay and the landing page.

## Visual vocabulary

An inhabited ground colony seen from overhead. Low ivory buildings, graphite hardware, muted sage trim, dusty service roads, warm practical windows. Merchant colors: mint A, amber B, coral NPC. Human identity comes from a chosen name and portrait; location and economic action come from a six-wheeled cargo rover. There is no walking/combat system.

## Original artwork

| Master | Optimized asset | Use |
| --- | --- | --- |
| `assets/ground-v2/buildings.png` | `runtime/buildings-ground.webp` + JSON | Depot, habitat, clinic, habitat plant annex, four 256px frames |
| `assets/ground-v2/rovers.png` | `runtime/rovers-ground.webp` + JSON | One rover design, three seat colors, three 160px frames |
| `assets/ground-v2/portraits.png` | `runtime/portraits-ground.webp` + JSON | Mara, Ilan, Tess; three 144px frames |
| `assets/ground-v2/colony.png` | `runtime/colony-ground-960.webp`, `runtime/colony-ground-1440.webp` | Ground-colony landing/results art; request one variant |

All original generated images and exact prompts are saved. `GROUND-PROMPTS.md` contains the prompts and the generation method. Existing goods artwork, icons, wordmark and typography are reused. Runtime sizes and hashes are recorded in `runtime/ground-manifest.json`.

The map terrain, service roads, resident silhouettes, windows, warning lamps, production light and delivery effects are lightweight SVG/CSS/code. They need no sprite animation sequences. Character portraits and rover variants are atlases, not per-frame downloads.

## Map and rules

Exactly three legal destinations: depot, habitat and clinic. The plant is a habitat annex and consumes no extra route or action. A click on the plant at the depot previews travel to the habitat; at the habitat it previews saleable cargo fuel. Clinic↔habitat travel still requires the depot.

Rovers follow explicit road waypoints after accepted travel. Queued or rejected actions never animate movement. The next untimed practice confirmation waits for the player's rover to finish arriving; timed modes can plan the next action while the settlement presentation completes. Reduced motion uses immediate positioning. Scene code is in `client/rover-scene.js`; the authoritative economy stays in `game/rules.js`.

Habitat lighting reduces with low oxygen and indicates critical oxygen explicitly. An empty/damaged clinic enters an emergency presentation. The annex lights when a fuel sale actually produces oxygen, using accepted quantity from the last settlement. Decorative residents have no individual simulation; dispatch messages derive from authoritative colony values.

## Information and identity

Player names are normalized, bounded and HTML-escaped. Each human chooses one of the player portraits; seat colors remain distinct. Tess Calder is the fixed-rule NPC with her own normal economy state. Identities are synchronized by the room authority and survive reconnects.

The main UI withholds rival cargo and detailed order intentions. Included orders remain inspectable through the public ledger, and local snapshots/replays can contain complete state. This is limited UI information, not cryptographic secrecy. The same caveat will matter for public onchain orders.

## Build and verify

```powershell
node scripts/build-ground-assets.mjs
npm run build
node tests/layout.mjs
node tests/motion.mjs
node tests/rover-room.mjs
```

The last command launches an isolated test authority and drives two browser contexts through a complete match, using three-second test windows; production rooms remain fifteen seconds. Original v1 artwork remains in `design/assets/` and the v1 design archive.
