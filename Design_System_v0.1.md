# Design System — Property Expense Tracker (v0.1)

## Concept

This is a personal ledger, not a fintech dashboard. The subject is genuinely accounting: receipts becoming permanent, tax-relevant records, organized by property. The design should feel like a well-kept paper ledger translated to a phone — calm, legible, and trustworthy — not like a generic "finance app" template.

**Audience matters here:** two users with different tech comfort levels (you, and your mom). This means legibility and clarity outrank visual flair every time there's a tradeoff. If a choice looks nice but is even slightly harder to parse at a glance, it's the wrong choice for this app.

**Signature element:** when an expense is saved, a small rotated "LOGGED" ink-stamp mark appears briefly next to it — like a receipt being stamped filed. This is the one moment of personality in the app. It reinforces the core trust promise ("this is now safely on record") and it's the only place we spend visual boldness. Everything else stays quiet and disciplined around it.

---

## Color

| Token            | Hex       | Use                                                                                                        |
| ---------------- | --------- | ---------------------------------------------------------------------------------------------------------- |
| `--bg-ledger`    | `#EFF3EC` | App background — pale ledger-paper green, not stark white                                                  |
| `--surface`      | `#FFFFFF` | Cards, elevated surfaces on top of the ledger background                                                   |
| `--ink`          | `#24302B` | Primary text — a soft green-black, not pure black                                                          |
| `--ink-muted`    | `#5B685F` | Secondary text, captions, metadata                                                                         |
| `--rule`         | `#D3DCD1` | Hairline dividers between list rows — literal ledger lines                                                 |
| `--action`       | `#2F5233` | Primary actions, active states — deep ledger-ink green                                                     |
| `--action-hover` | `#25401F` | Hover/pressed state for primary actions                                                                    |
| `--stamp`        | `#2B3A55` | The signature "LOGGED" stamp mark only — deep stamp-ink navy. Not used anywhere else, so it stays special. |
| `--error`        | `#A13D2F` | Validation errors, destructive actions only                                                                |

**Why not the obvious fintech palette:** avoiding warm-cream-plus-terracotta and near-black-plus-neon — both read as generic AI-generated defaults right now, not as choices made for this app. The ledger-green background and stamp-navy accent come directly from the "paper ledger" concept instead.

---

## Typography

- **Body / UI text:** a clean humanist sans (e.g. Inter or system-ui stack) — legibility is non-negotiable given the two-user audience. Set body text no smaller than 15px on mobile.
- **Amounts (dollar figures):** use **tabular figures** (`font-variant-numeric: tabular-nums`) wherever amounts appear in a list — this is a real content-driven choice, not decoration: numbers in a ledger need to align vertically like a real ledger column.
- **Headings/property names:** same sans family, medium weight, no separate display face — this app doesn't need a "hero" typographic moment, it needs to stay out of the way of the data.

---

## Layout & Components

- **Cards:** soft rounded corners (`border-radius: 12px`), white surface on the ledger-green background, subtle — no heavy borders or drop shadows.
- **List rows within a card:** separated by a 1px `--rule` hairline, not by boxing each row individually — this is the literal "ledger line" motif, used structurally (it separates real records) not decoratively.
- **Primary action button:** filled `--action` green, `border-radius: var(--radius)`, full-width on mobile for primary flows (e.g., "Capture receipt").
- **Secondary actions:** outline style, `--ink-muted` text, no fill.
- **Empty states:** per the writing guidance below — these should read as an invitation to act, not a dead end. E.g., "No properties yet — add your first one to get started." with the add-property action right there, not a separate step to hunt for.
- **The stamp signature:** on successful save (property added, expense logged), a small `--stamp`-colored circular mark reading "LOGGED" appears briefly next to the new item, slightly rotated (~-8°), then settles/fades to a quiet permanent indicator (e.g., small checkmark) after ~1.5s. This should feel satisfying but never block the UI — the user can keep working immediately.

---

## Accessibility & Quality Floor (non-negotiable, not "polish")

Given one of two users is less tech-comfortable, these aren't nice-to-haves:

- Text contrast meets WCAG AA minimum against `--bg-ledger` and `--surface`
- Every interactive element has a visible keyboard focus state
- Tap targets minimum 44×44px (mobile)
- Respect `prefers-reduced-motion` — the stamp animation should degrade to an instant, non-animated state if the user has this set
- Every error message says what went wrong and what to do about it — never just "Error" or "Something went wrong"

---

## Writing / Voice

- **Active voice, plain terms.** "Log expense," not "Submit." "Add property," not "Create new property object."
- **Consistent vocabulary through a flow.** If the button says "Capture receipt," the confirmation afterward says "Receipt logged" — not "Success" or "Saved" or some other word for the same thing.
- **Errors are specific and calm, never apologetic.** "Property name can't be blank" — not "Oops! Something went wrong."
- **Empty states invite action.** Every empty screen should say what's missing and offer the fix right there, not just describe absence.
- **Written for the end user, not the system.** "Archive this property" — never "Set status to archived."

---

## Explicitly Not Doing (for now)

- No dark mode (single theme keeps the ledger-paper concept coherent; revisit later if wanted)
- No custom illustration/iconography system — use a plain icon set (e.g. Lucide) rather than commissioning custom art
- No elaborate page-load animation sequences — the stamp moment is the one place motion is intentional; everywhere else stays still
