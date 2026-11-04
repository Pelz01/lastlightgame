# Last Light — visual direction v1

Created November 2, 2026. First art-direction proposal, not a playable build or approved final design.

## The direction

A worn orbital trading terminal. The colony should feel inhabited and fragile: warm windows, practical cargo hardware, ivory insulation, dark metal and restrained mint indicators. Keep the human stakes visible through the environment. The interface should let players understand the next action within a 15-second window.

## Reference research

- Pinterest search and a public pin were attempted; both were inaccessible through the research tool. No claim of reviewing Pinterest boards.
- [Chaotic Era: interface development](https://www.bobbybobbybobby.com/blogs/news/how-80s-scifi-inspired-a-complete-overhaul-of-our-games-ui): believable spacecraft instrumentation and retro industrial character.
- [Desynced UI/UX case study](https://gamestudio.n-ix.com/case-study/desynced/): reference for presenting complex strategy systems.
- [IXION imagery](https://store.playstation.com/en-gb/concept/10009170): reference for inhabited orbital scale and persistent survival information.
- [Sci-fi interface portfolio](https://www.behance.net/gallery/77592353/Sci-fi-Interface): interface graphic reference. Use selective functional linework.

These are inspiration sources, not licensed production assets. The delivered artwork is generated specifically for Last Light.

## Visual system

| Role | Starting value | Use |
| --- | --- | --- |
| Space | #090E11 | Background |
| Panel | #141C1D | Opaque action surfaces |
| Ivory | #E9E7D9 | Main text |
| Secondary | #A4B2AD | Supporting text; verify contrast at final size |
| Mint | #9CDBC3 | Oxygen, selected route, primary action |
| Amber | #EEC384 | Fuel, time warnings |
| Coral | #F29381 | Medicine identification; use a distinct stronger red plus explicit CRITICAL text for danger |

Use a condensed display face for LAST LIGHT and major headings, a readable sans for instructions, and tabular numbers for timers and values. Candidate implementation families: Barlow Condensed, IBM Plex Sans, IBM Plex Mono; validate assets and licenses when installing. Body text should start at 16px, decision values at 24px or larger. Avoid widely spaced condensed text for explanatory paragraphs.

## Gameplay composition

Persistent top band: round, remaining decision time, oxygen, medicine and health. Main area: spatial colony board with depot, habitat and clinic. Flat right-hand action panel: current position, cargo and fuel, selected action, earliest sale, estimated payout and one primary confirmation. Bottom band: public rival information and shipment/deadline timeline.

At 1366×768 the primary action and life-support state must fit without scrolling. On narrow screens use a compact board and a bottom action sheet; preserve life support and timer. This pass contains desktop artwork only; mobile layouts still need their own design pass.

## Assets

- `assets/gameplay-concept-v1.png`: visual reference only. Rebuild text, controls, meters and layout in code. Do not ship a flattened screenshot as the game.
- `assets/colony-environment-v1.png`: standalone background artwork. The corrected graph has exactly depot–habitat and depot–clinic links. Align interactive nodes and routes with this artwork; retain an accessible textual route list.
- `assets/resource-atlas-v1.png`: one transparent inventory artwork sheet: oxygen cylinder, medicine case, fuel container. Distinct silhouettes and colors. Export separate source sprites through the image workflow if needed; do not use tiny atlas details as UI icons.
- `PROMPTS.md`: full generation and edit prompts. Built-in generation tool used.

## Product requirements for implementation

Show buy, travel and sell as separate actions. Distinguish preview, queued, included, settled and rejected. Include minimum total payout, return fuel, cargo space, accepted quantity, quota/treasury and clinic deadline where relevant. A route never implies a sale on arrival. Derived values must come from authoritative match state.

Normal state uses calm mint; a critical state needs explicit text, a clear rescue deadline and restrained red. Never rely on color alone. Animate travel only after settlement; display pending state while waiting. Avoid continuous flashing and support reduced motion.

## Review notes

The screen concept has illustrative economic values, not a valid replay snapshot. Its route artwork differs from the standalone environment; use the corrected standalone environment for implementation. Remove the generated explanatory sentence below PREVIEW ONLY in the implemented UI. Replace leaf-like merchant decoration with distinct merchant marks. The timeline must be generated from the public schedule, including all medicine deadlines at 6/12/18 and oxygen releases at 1/4/7/10/13/16. Implement explicit final-score/salvage and shared-loss states separately.

Resource sheet visually inspected for distinct objects and transparent margins. PNG dimensions, pixel format and sampled alpha verified with System.Drawing: the resource sheet has transparent background and opaque object pixels. Art direction remains open for user feedback.
