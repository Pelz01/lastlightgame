# Player language and learning audit — November 5, 2026

The public game needs to teach a first-time player how to make a delivery, explain what a saved move means, and support a friend joining from the internet. This audit covers the landing page, guide/FAQ, action controls, previews, results, history and online setup. Game rules, transaction permissions and stored receipts are unchanged.

## Research used

- [Xbox Accessibility Guideline 109: Objective clarity](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/109) recommends clear, reviewable goals and progress information. Applied here: the guide starts with the win/loss condition, and the first delivery has a visible next step beside the controls.
- [Xbox Accessibility Guideline 114: UI context](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/114) recommends labels and context that explain what a control does and what to expect. Applied here: “Buy & load,” “Travel to Habitat,” “Sell cargo,” and “Finish round” name the result of the action. Fast-action permissions and testnet costs remain available where players decide to use them.
- [Xbox Accessibility Guideline 115: Error messages](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/115) recommends identifying input errors and explaining how to correct them. Applied here: cargo, fuel, minimum-payout and wallet errors give a next step instead of exposing raw contract errors or JSON.
- [Microsoft: Writing for all abilities](https://learn.microsoft.com/en-us/style-guide/accessibility/writing-all-abilities) recommends brief, focused instructions, meaningful structure and input-neutral verbs. Applied here: short answers grouped by player task and consistent use of “choose” across mouse and touch.
- Andersen et al., [The Impact of Tutorials on Games of Varying Complexity, CHI 2012](https://grail.cs.washington.edu/projects/game-abtesting/chi2012/chi2012.pdf), studied eight tutorial designs across three games and over 45,000 players. The benefit depended on the game; tutorials did not improve engagement in every case. This supports testing a short, optional learning path rather than assuming a larger manual is better. It does not prove that this rewrite improves Last Light's retention.

## Findings and changes

| Before | Player problem | Change |
| --- | --- | --- |
| Guide says internet hosting is unavailable and the host must run a server | Contradicts the deployed game and blocks invitations | Explain hosted online play, separate testnet wallets, invites and reconnecting |
| “Settlement,” “included,” “procurement quota,” “salvage” appear before explanation | Players have to learn implementation vocabulary before making a move | Use round end, Move saved, oxygen allowance and cargo value; define limits in the guide |
| Long, ungrouped FAQ and a separate technical FAQ source | Hard to scan; answers drift apart | Generate game, web FAQ and Markdown from one player-focused source, grouped into five topics |
| “Confirm load” and “Replace included order” | Purchase cost and timing are unclear | “Buy & load” and “Update move”; explain that saving a move is not yet a successful trade |
| First-time player must infer Load → Travel → Sell | Arrival can be mistaken for delivery | Three-round oxygen example, with an 8-credit initial purchase and contextual hints |
| Raw rejection reasons and wallet JSON | Error explains machinery rather than recovery | Display corrective language; keep authoritative data unchanged in replay files |
| Online entry presents wallet concepts without a clear invitation path | Friends do not know who creates, joins or readies | Connect → create/share or join → enable fast actions → both ready |

The landing page stays short. Detailed stock schedules, end reserves, cargo values, public information and Tess's policy remain in optional help. Testnet labels and fees stay explicit because they affect a player's decision; development-server instructions do not belong in the public guide.

## Validation

Browser checks follow the guide's actual three-round route and verify stock/cash changes, corrective previews, readable online setup, FAQ hosting guidance, laptop confirmation placement and phone overflow. Solo/pass-and-play checks cover a complete match. The FAQ generator checks synchronization. Existing rule tests verify that display changes do not alter the economy.

These are implementation checks, not a human usability study. For the next human session, give no spoken tutorial: ask a new player to make one oxygen delivery, invite a friend and explain Move saved versus a completed trade. Record where they hesitate, whether they need help and whether the first delivery succeeds. Revise from those observations rather than claiming the copy is proven easy.
