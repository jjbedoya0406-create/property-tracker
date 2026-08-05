# UI Polish Handoff — v1

Reference: see Design_System_v0.1.md for full tokens (colors, type, spacing, voice).
This doc covers the specific, agreed changes across the three screens already built.

## Global (applies to every screen)

- **Header pattern, consistent everywhere:**
  - Left: small rotated stamp icon (navy `#2B3A55`) + "Property expense tracker" wordmark, 13px, weight 500
  - Right: "Capture receipt" as a **filled primary button** (`#2F5233` bg, white text, camera icon) — this is the headline action, it should look like one
  - "Sign out" as a **quiet outline button** (`#D3DCD1` border, `#5B685F` text) — secondary, de-emphasized
  - Bottom border: 1px solid `#D3DCD1`
- **Vendor names and all body copy: sentence case, never all-caps.** (Current build has "HOME DEPOT" — fix to "Home Depot".)
- **Amounts use tabular figures** (`font-variant-numeric: tabular-nums`) everywhere a dollar amount appears in a list, so digits align vertically.
- **One filled/primary-colored button per screen, max.** Everything else is outline or ghost style. (E.g., "Add property" should be outline, not filled — "Capture receipt" is the one filled action.)

## Screen 1: Sign-in / landing

- Remove the duplicate "Property Expense Tracker" heading in the card — the header wordmark already says it. Card content is just: sign-in copy + button.
- Card centered both axes in the available viewport space (not floating top-left).
- Add the stamp icon (rotated ~-6°, navy circle outline, ~44px) above the sign-in copy — this is the app's signature moment.
- Hairline rule (`#D3DCD1`, 1px) between the sign-in copy and the "Sign in with Google" button.

## Screen 2: Properties list

- Add "← My properties" pattern isn't needed here (this _is_ the list), but confirm the header pattern above is applied.
- Each property row gets a trailing chevron (`>`) icon to signal it's tappable into detail.
- Segmented control (Active/Archived): tighten padding, contained pill style — shouldn't visually compete with the "My properties" heading next to it.
- "Add property": outline button style (`#2F5233` border/text, transparent bg), not filled.
- Open decision, your call: add per-property expense totals to each row now that Outcome 3 has real data (not yet built — flag if you want this added).

## Screen 3: Property detail

- **Add a back link** ("← My properties") above the property identity card — this was a genuine gap, not just polish. No other way back currently exists.
- Apply the global header pattern (currently still has the old plain-text "Capture receipt").
- "Edit" and "Archive" buttons: outline style, consistent sizing (currently inconsistent gray pills).
- Category shown as a small pill/tag (`background: #E3E9DF; color: #3C5240; border-radius: 6px; padding: 2px 8px; font-size: 11px`), separated visually from the reference/SKU number — currently both run together as plain text.
- Date range inputs (From/To): restyle to match app borders/radius (`1px solid #D3DCD1`, `border-radius: 8px`) instead of raw browser default date input styling.
- "Log expense" stays filled (`#2F5233`) — it's the primary action on this screen specifically (property-scoped capture).

## Not in scope for this pass

- Dark mode
- Custom icon set beyond Tabler-style outline icons
- Per-property expense totals on the list screen (flagged above as an open decision, not decided yet)
