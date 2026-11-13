# Colony field instruments

The November 2026 interface update keeps every building, rover, portrait, goods atlas and colony illustration. It changes typography, surfaces and layout in the existing vanilla JavaScript application.

## Direction

Another Eden Begins informed the separation between browsing, selected details and a clear action. ScourgeBringer informed the restrained HUD and larger world view. Free Fire informed strong selected states and prominent confirmation. These are general composition references; none of their artwork, screenshots or font files are shipped or used to generate assets.

The dark green map is the world. Warm ivory is reserved for the merchant's decision panel. Selected controls have a filled surface, a strong edge and a checkmark or pressed state. Colony warnings retain explicit text and their warning colors.

## Typography and implementation

- Chakra Petch 600: headings and primary controls.
- IBM Plex Sans 400/600: instructions, labels and tabular numbers.
- Three self-hosted Latin WOFF2 files, no font CDN requests at runtime. Unmodified Fontsource packages, version 5.3.0; SIL Open Font Licenses accompany both families in `runtime/`.
- `client/interface.css` supplies the shared interface theme after the existing base and world styles. `client/guide.css` adds the manual's lazy-loaded layout.
- The original Barlow file remains in the archived design library, but is no longer included in the game build.

## Screens

Desktop places a larger colony beside a compact trading panel. The map, merchant identities, round context, suggested move and exchange follow a deliberate reading order. The panel uses content height so its receipt cannot be clipped by a fixed viewport calculation.

Portrait phones place the map first, the trading panel second, then suggestions, merchants, history and the exchange. Goods use full-width rows with larger tap targets. Oxygen, medicine and clinic health remain visible. The landing page, online lobby, onboarding, results and manual share the same fonts and colors.

Eight handbook pictures were recaptured from the actual new desktop and phone interfaces. The picture sources select the matching device; these are teaching assets, separate from submission screenshot exports in Downloads.

## Verification

The existing browser suites cover the first delivery and corrective errors at 1366, 390 and 360px, onboarding and real audio, visual guide device selection, complete two-seat play, rover movement, reduced motion, keyboard focus and invalid-input preservation during room broadcasts. The build enforces a 1.2 MB core budget and a separate 300 KB optional handbook image budget. No contract, settlement rule or NPC policy changes are part of this update.
