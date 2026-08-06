# UI Polish Handoff — v1

Reference: see Design_System_v0.1.md for full tokens (colors, type, spacing, voice).
This doc covers the specific, agreed changes across the three screens already built.

## Global (applies to every screen)

- **Navigation, locked (see Design_System_v0.1.md → Navigation for full reasoning):**
  - **Bottom tab bar, exactly 3 tabs: Properties, Capture, More.** Permanent, on every screen. Do not add a 4th tab per new section — Income and Occupancy (Outcome 6) go into the More sheet, not new tabs.
  - **"More" opens a bottom sheet:** signed-in account email at top, then secondary destinations as a plain list (Categories today; Income, Occupancy as they ship), then "Sign out" at the bottom.
  - **This replaces two earlier, now-superseded patterns:** the header-only avatar dropdown, and plain-text header links (as briefly happened on the Categories screen — see Screen 4 below, needs correcting to this pattern).
  - **Top bar keeps just the brand mark:** small rotated stamp icon (navy `#2B3A55`) + "Property expense tracker" wordmark, 13px, weight 500, left-aligned. No buttons live in the top bar anymore — Capture and account/nav both moved to the bottom tab bar.
  - Bottom border on top bar: 1px solid `#D3DCD1`. Bottom tab bar gets a matching top border, `#FFFFFF` background.
- **Vendor names and all body copy: sentence case, never all-caps.** (Current build has "HOME DEPOT" — fix to "Home Depot".)
- **Amounts use tabular figures** (`font-variant-numeric: tabular-nums`) everywhere a dollar amount appears in a list, so digits align vertically.
- **One filled/primary-colored button per screen, max.** Everything else is outline or ghost style. (E.g., "Add property" should be outline, not filled — "Capture receipt" is the one filled action, and it now lives in the tab bar, not as an in-page button.)

## Screen 1: Sign-in / landing

- Remove the duplicate "Property Expense Tracker" heading in the card — the header wordmark already says it. Card content is just: sign-in copy + button.
- Card centered both axes in the available viewport space (not floating top-left).
- Add the stamp icon (rotated ~-6°, navy circle outline, ~44px) above the sign-in copy — this is the app's signature moment.
- Hairline rule (`#D3DCD1`, 1px) between the sign-in copy and the "Sign in with Google" button.
- No tab bar on this screen — it only applies once signed in.

## Screen 2: Properties list

- Confirm the top bar + bottom tab bar pattern above is applied (this screen currently has the old header-button pattern from before navigation was locked — needs rebuilding).
- Each property row gets a trailing chevron (`>`) icon to signal it's tappable into detail.
- Segmented control (Active/Archived): tighten padding, contained pill style — shouldn't visually compete with the "My properties" heading next to it.
- "Add property": outline button style (`#2F5233` border/text, transparent bg), not filled.
- Open decision, your call: add per-property expense totals to each row now that Outcome 3 has real data (not yet built — flag if you want this added).

## Screen 3: Property detail

- **Add a back link** ("← My properties") above the property identity card — this was a genuine gap, not just polish. No other way back currently exists.
- Confirm the top bar + bottom tab bar pattern above is applied.
- "Edit" and "Archive" buttons: outline style, consistent sizing (currently inconsistent gray pills).
- Category shown as a small pill/tag (`background: #E3E9DF; color: #3C5240; border-radius: 6px; padding: 2px 8px; font-size: 11px`), separated visually from the reference/SKU number — currently both run together as plain text.
- Date range inputs (From/To): restyle to match app borders/radius (`1px solid #D3DCD1`, `border-radius: 8px`) instead of raw browser default date input styling.
- "Log expense" stays filled (`#2F5233`) — it's the primary action on this screen specifically (property-scoped capture), separate from the global "Capture receipt" tab.

## Screen 4: Categories (Story 1.6)

- **Rebuild the header to match the locked pattern above.** Current build has "Categories" as a plain-text header link and a standalone "Sign out" button — both are now wrong. Remove them; Categories should be reached via the More sheet, and Sign out lives in the More sheet too.
- Everything else on this screen (list styling, hairline dividers, Rename/Archive button treatment, the Active/Archived segmented control, "Add category" as outline style) is already correct and consistent — no changes needed there.

## Not in scope for this pass

- Dark mode
- Custom icon set beyond Tabler-style outline icons
- Per-property expense totals on the list screen (flagged above as an open decision, not decided yet)
- Promoting any More-sheet item into a full tab (explicitly deferred until usage data justifies it, per Design_System_v0.1.md → Navigation)
