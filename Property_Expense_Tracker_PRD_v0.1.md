# PRD: Rental Property Expense Tracker (v0.1 — Draft)

**Status:** v1 shipped and deployed; this update scopes v1.1 (localization + income/occupancy for mom's Colombia portfolio)
**Owner:** Jason
**Last updated:** Aug 5, 2026

---

## 1. Problem Statement

Landlords managing a portfolio of rental properties currently track expenses manually — saving paper/digital receipts and entering them into spreadsheets by hand. This process is:

- **Time-consuming** — manual entry after the fact, batched instead of captured in the moment
- **Error-prone** — mistyped amounts, wrong categories, receipts attributed to the wrong property
- **Lossy** — receipts get forgotten, lost, or never make it into the spreadsheet at all, which is a real problem at tax time or during an audit

This gets worse as the number of properties grows — each property needs its own clean expense record, but a spreadsheet-based process doesn't scale well per-property without becoming its own maintenance burden.

## 2. Goal — Six Outcomes

v1 shipped with the first four outcomes. This update adds two more, driven by real usage feedback from Jason's mom (see Sections 15-17):

1. **Manage my properties** — I can add, edit, and archive the properties in my portfolio.
2. **See my properties** — I can view my portfolio and confirm it's set up correctly.
3. **Capture a receipt for tax purposes** — I can take a photo of a receipt, have it stored durably (retrievable later, e.g. for an audit), and have it unambiguously assigned to the correct property.
4. **See a tax-year expense summary** — I can see how much I spent on a property during a specific tax year, broken down by category, without doing the math myself.
5. **Use the app in Spanish, with Colombian pesos** — a user whose properties are in Colombia can use a fully Spanish interface, log expenses in COP, and have OCR read Spanish-language receipts.
6. **Track rental income and occupancy** — I can log rent payments and tenancy dates (contract start, expected end, actual move-out) per property, so I can see income alongside expenses and account for vacant periods — replacing the manual Excel process Jason's mom currently uses.

1 and 2 remain the foundation everything else depends on. Outcomes 5 and 6 are independent of each other but both depend on 1-4 already existing.

**Success looks like:** a user — in their own language and currency — can set up their portfolio, log a receipt against the correct property, pull up their tax-year summary, and see income and occupancy alongside expenses, matching or exceeding what they could do by hand in Excel.

## 3. Non-Goals (explicitly out of scope for v1)

- Bank/credit card feed integration (auto-import from financial institutions)
- Email receipt forwarding/parsing
- Multi-user permissions within one portfolio (e.g., a property manager with limited access)
- Tax filing / export to accounting software (QuickBooks, Schedule E, etc.) — includes Colombian tax filing/DIAN; the app records data, it doesn't file or advise on either country's taxes
- Reporting/analytics dashboards beyond basic per-property totals and the income/expense view in Outcome 6
- Portfolio-wide total across all properties combined (considered for Outcome 4, not selected as needed — each property's tax-year total stands alone)
- ~~Revenue/rent tracking~~ — **promoted to Outcome 6** as of this update, no longer a non-goal
- Multi-language support beyond English/Spanish (e.g. no framework for arbitrary additional languages — Spanish is added as a second hardcoded option, not a general i18n system)

These are reasonable v2+ candidates, not being ruled out — just not blocking v1.

## 4. Users

| User        | Portfolio size                                                               | Language | Currency | Notes                                                                                                |
| ----------- | ---------------------------------------------------------------------------- | -------- | -------- | ---------------------------------------------------------------------------------------------------- |
| Jason       | 2 properties                                                                 | English  | USD      | Primary user, building this                                                                          |
| Jason's mom | 7 properties (units within a building — e.g. 301/302/303/304 at one address) | Spanish  | COP      | Secondary user; properties are in Colombia, currently tracked manually in Excel (see Sections 15-17) |

**Decided:** Each person logs into their own account and only sees their own properties. Two fully independent portfolios — no shared access, no "switch portfolio" concept needed. Simple per-user data isolation is sufficient.

**New as of this update:** language and currency are per-user account settings, not global app settings — Jason's account stays English/USD, his mom's account is Spanish/COP. Each user's experience is fully independent, consistent with how portfolios already work.

## 5. Technical Approach — Decided: Progressive Web App (PWA) on Google Workspace

**Platform decision:** Build as a PWA, not a native iOS/Android app.

**Why:**

- Primary constraints are cost ($0 target) and this being a learning project — not scale, not sale
- Two known users (self + mom), no App Store/Play Store distribution needed
- Camera-for-still-photo (the core capture use case) is well-supported in mobile browsers today — the reliability gap between native and web camera APIs matters more for continuous/AR use cases, not "snap one photo of a receipt"
- No developer program fees ($99/yr Apple, $25 Play), no store review cycles, no signing/provisioning overhead
- One codebase/skillset to learn deeply (web) instead of splitting across a cross-platform framework and two native toolchains
- "Add to Home Screen" distribution is trivial for exactly two users

**Explicitly reconsider if:** camera/OCR behavior proves unreliable in real testing, or the project's goals change (e.g., decide to actually learn native mobile dev as its own goal, or pivot toward selling this to other landlords — currently a stated non-goal, see Section 3).

**Stack decision:**

| Layer                     | Choice                                                                | Why                                                                                                                                                                                                                                                                                                                                      |
| ------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Data storage              | Google Sheets (via Google Sheets API)                                 | $0, no account to stand up, human-readable — you can open the sheet directly if something needs debugging                                                                                                                                                                                                                                |
| Receipt image storage     | Google Drive (via Google Drive API)                                   | $0, durable, naturally satisfies the "tax-audit-retrievable" bar in Outcome 3                                                                                                                                                                                                                                                            |
| Auth                      | Google OAuth ("Sign in with Google")                                  | $0, no password system to build — replaces Story 1.1 entirely with an existing, trusted flow. You and your mom already have Google accounts.                                                                                                                                                                                             |
| OCR                       | Tesseract.js (on-device, in-browser)                                  | $0 guaranteed, no API keys/usage costs. Tradeoff: lower accuracy than a cloud OCR API — acceptable because OCR is a shortcut, never a gate (Section 6), so manual correction is already a built-in fallback                                                                                                                              |
| Frontend framework        | React                                                                 | Widely-documented, strong PWA tooling, good fit for a learning project                                                                                                                                                                                                                                                                   |
| UI language (new)         | Per-account setting: English or Spanish                               | Simple key-based string dictionary (not a general i18n framework) — a small, fixed set of UI strings translated once per language, selected by the signed-in account's language setting. $0, no translation service needed at this scale.                                                                                                |
| OCR language (new)        | Per-account: Tesseract English (`eng`) or Spanish (`spa`) traineddata | Tesseract supports Spanish, but it's a separate language pack from what's configured today — needs to be added and tested separately; Spanish OCR accuracy is unverified until tested against real receipts (see Section 10 risks)                                                                                                       |
| Currency formatting (new) | Per-account: USD or COP display formatting                            | COP is conventionally shown with no decimal places and a period as the thousands separator (e.g. `$430.000`), unlike USD's comma-thousands/decimal-cents format — this is a display/parsing rule, not a currency conversion (no exchange-rate logic; each account's amounts are simply denominated and shown in that account's currency) |

**Known tradeoff, accepted deliberately:** Sheets is not a real database — no enforced schema, no transactions, easier for a bad write to silently corrupt a row than with Postgres/similar. At this scale (2 users, ~9 properties) this is a small, acceptable risk in exchange for $0 cost and a much simpler setup. Revisit if the project ever grows past "just us."

## 6. Core User Flow (v1)

1. User opens app, selects which property the expense belongs to (or app defaults to "last used property" to reduce friction)
2. User taps "capture receipt" → camera opens
3. Photo taken → OCR extracts: vendor, amount, date, (best-effort) category
4. User reviews extracted data on a confirm screen — edits anything OCR got wrong
5. User confirms → expense is saved, tagged to that property, receipt image stored alongside it
6. Expense appears in that property's expense list

**Design principle:** OCR is a shortcut, not a gate. If OCR fails or misreads, the user can still manually enter/correct in the same flow — capture should never dead-end because OCR had a bad read.

## 7. Functional Requirements — MVP, by Outcome

### Outcome 1: Manage my properties

- [ ] Sign in with Google (OAuth) — no custom password system
- [ ] Add a property (name, address, at minimum)
- [ ] Edit a property's details
- [ ] Archive a property (soft-delete — don't lose historical expense data tied to it)
- [ ] App provides a starter expense category list (Repairs & Maintenance, Insurance, Utilities, Property Management Fees, Cleaning) as part of setup — not invented per-expense at capture time
- [ ] Categories are fully editable per account after setup: add a new category, rename an existing one, archive one no longer needed — starter list is a sensible default, not a fixed set (resolves the open question from Story 1.5)
- [ ] Archiving a category follows the same soft-delete pattern as archiving a property (Story 1.4): existing expenses keep their category, archived categories just stop appearing as options for new expenses

### Outcome 2: See my properties

- [ ] View list of all active properties in portfolio
- [ ] View a single property's detail (basic info + its expenses, once Outcome 3 exists)
- [ ] Distinguish active vs. archived properties in the view

### Outcome 3: Capture a receipt, tied to the right property, tax-durable

- [ ] Camera capture flow for receipts
- [ ] OCR extraction of vendor, amount, date from receipt image
- [ ] Manual edit/override of any OCR-extracted field (OCR is a shortcut, never a gate — bad read shouldn't block saving)
- [ ] Manual entry path (no photo) for cases with no receipt (e.g., cash, phone-paid)
- [ ] Assign expense to a specific property (explicit selection, not just "last used" defaulting silently)
- [ ] Assign a category to the expense, selected from the starter list defined in Outcome 1
- [ ] Store receipt image durably, tied to its expense record — durability bar is "still retrievable years later for a tax audit," not just "saved for now"
- [ ] Per-property expense list (chronological, filterable by date range at minimum)
- [ ] Per-property running total of expenses

### Outcome 4: See a tax-year expense summary

- [ ] Year selector on the property detail view, defaulting to the current calendar year
- [ ] Total clearly labeled with the year it reflects (e.g. "2026 total: $X") — replaces the current unlabeled "Total," which is ambiguous about what period it covers
- [ ] Category breakdown: each category (from the Outcome 1 starter list) shown with its own subtotal for the selected year
- [ ] Switching the year selector recalculates both the total and the category breakdown
- [ ] The existing From/To custom date filter (Outcome 3 requirements) remains available as a separate, secondary filter — not replaced by the year selector, since ad hoc range questions are a different need than the tax-year view

### Outcome 5: Use the app in Spanish, with Colombian pesos

- [ ] Language setting per account (English/Spanish), set at account creation or in account settings
- [ ] All UI strings (buttons, labels, headers, empty states, error messages) available in Spanish, applied when the account's language is set to Spanish
- [ ] Currency setting per account (USD/COP), independent of language (though in practice mom's account uses both Spanish + COP together)
- [ ] Amounts entered and displayed in COP format for COP accounts (no decimals, period thousands-separator) vs. USD format for USD accounts
- [ ] Tesseract OCR configured with Spanish-language data for Spanish-set accounts, English for English-set accounts
- [ ] Starter category defaults for Spanish accounts use mom's own eight categories (Section 11) as the seeded starting point — a distinct set from Jason's five, not a translation of it, and fully editable afterward (Story 1.6) like any account's categories

### Outcome 6: Track rental income and occupancy

- [ ] Log a rent payment: property, amount, date received — mirrors the "Money In" data Jason's mom currently tracks in Excel
- [ ] Per-property income list, similar in structure to the existing expense list (Outcome 3)
- [ ] Record a tenancy/contract per property: contract start date, expected end date, actual move-out date (captured separately from expected end — the gap between them is meaningful, e.g. early departure or overstay)
- [ ] Record the property's rent rate (needed to translate vacant days into a dollar figure later, per the original Section 15 reasoning)
- [ ] Per-property view showing income total alongside expense total for a given period (mirrors the "Money In / Money Out / Money Left Over" structure from her Excel) — exact period scope (tax-year, matching Outcome 4, vs. custom range) is an open decision, see Section 11
- [ ] Notes field on expenses (free text) — present in her current Excel workflow, not in the current expense data model; add it
- [ ] Property model supports multiple units at the same address (e.g. unit 301, 302 at one building) — confirm this is adequately handled by the existing name+address fields (Story 1.2) rather than requiring a building/unit hierarchy

### Should-have (v1 if feasible, else immediately post-v1)

- [ ] Edit/delete an already-saved expense
- [ ] Search/filter expenses by category or vendor
- [ ] Export a property's expense list (CSV at minimum)

## 8. Data Model — Google Sheets Structure

Each user gets their own spreadsheet (created on first login, tied to their Google account — this is what gives us the per-user isolation from Story 1.1 without building custom auth).

**Tab: `Categories` (new)**

| Column      | Notes                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------- |
| category_id | Unique ID                                                                                         |
| name        | Editable — starter list pre-populated on account creation, user can add/rename/archive from there |
| status      | `active` or `archived` — same soft-delete pattern as `Properties` (Story 1.4)                     |
| created_at  |                                                                                                   |

Replaces the earlier assumption of a fixed, hardcoded category list. Each account gets its own `Categories` tab, seeded with sensible defaults on first setup (Jason's five, or mom's eight — see Section 11), fully editable afterward.

**Tab: `Properties`**

| Column      | Notes                            |
| ----------- | -------------------------------- |
| property_id | Unique ID, generated on creation |
| name        | Required                         |
| address     | Optional                         |
| status      | `active` or `archived`           |
| created_at  |                                  |

**Tab: `Expenses`**

| Column            | Notes                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------- |
| expense_id        | Unique ID                                                                                                                 |
| property_id       | Links to a row in `Properties`                                                                                            |
| amount            |                                                                                                                           |
| date              |                                                                                                                           |
| vendor            |                                                                                                                           |
| category          | Links to a row in `Categories` — renaming a category updates everywhere it's used; archiving doesn't affect past expenses |
| notes             | Free text — new, matches the Notes column in mom's current Excel workflow                                                 |
| receipt_drive_url | Link to the image file in Google Drive                                                                                    |
| source            | `ocr` or `manual`                                                                                                         |
| created_at        |                                                                                                                           |
| edited_at         |                                                                                                                           |

**Tab: `Settings` (new)**

| Column   | Notes          |
| -------- | -------------- |
| language | `en` or `es`   |
| currency | `USD` or `COP` |

One row per spreadsheet (i.e. per user) — this is what drives Outcome 5's per-account language/currency/OCR behavior.

**Tab: `Income` (new)**

| Column        | Notes                          |
| ------------- | ------------------------------ |
| income_id     | Unique ID                      |
| property_id   | Links to a row in `Properties` |
| amount        |                                |
| date_received |                                |
| notes         |                                |
| created_at    |                                |

**Tab: `Occupancy` (new)**

| Column                | Notes                                                      |
| --------------------- | ---------------------------------------------------------- |
| occupancy_id          | Unique ID                                                  |
| property_id           | Links to a row in `Properties`                             |
| contract_start        |                                                            |
| contract_end_expected |                                                            |
| actual_move_out       | Nullable until the tenant actually leaves                  |
| monthly_rent          | Needed to later translate vacant days into a dollar figure |
| created_at            |                                                            |

**Why separate tabs for Income and Occupancy rather than folding into `Properties`:** a property can have multiple tenancies over time (new tenant every year, for instance), so this needs to be a repeating record like `Expenses`, not fixed fields on the property itself.

**Why this shape:** it mirrors the original draft's User → Property → Expense structure, just expressed as Sheets tabs instead of database tables. `property_id` as a foreign-key-style column is what lets "Outcome 3 assigns to a property" and "Outcome 2 filters by property" both work off the same two tabs without duplicating data — the same pattern now extends to `Income` and `Occupancy`.

## 9. Success Metrics

Since this is a personal tool first, "success" is qualitative at v1, but worth defining so you know if it's working:

- Are receipts actually getting captured at time-of-purchase instead of piling up?
- Is time-to-log-an-expense meaningfully faster than the spreadsheet process it replaces?
- At month-end, is anything missing that would've been missing under the old process too? (i.e., did automation actually reduce loss, or just move where things get lost)

## 10. Risks / Open Questions

| #   | Risk/Question                                                                                                                                                                                       | Why it matters                                                                                                                                                                                                                                                                                 |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Open access — no allowlist yet.** As deployed, any Google account can sign in and create a portfolio. Fix spec'd in Story 1.1; needs to be built and deployed before this link is shared further. | The app is live at a public URL right now — this is an active gap, not a theoretical one                                                                                                                                                                                                       |
| 2   | OCR accuracy on real-world receipts (faded, handwritten, crumpled)                                                                                                                                  | Directly determines whether this saves time or adds a correction chore                                                                                                                                                                                                                         |
| 3   | Where are receipt images stored, and for how long?                                                                                                                                                  | Resolved — Google Drive, per Section 5. Durable and outlives the app itself if maintenance ever stops.                                                                                                                                                                                         |
| 4   | Offline capture (property with bad cell signal)                                                                                                                                                     | Common real-world scenario for rental properties; not addressed yet in this draft                                                                                                                                                                                                              |
| 5   | Sheets has no enforced schema or transactions                                                                                                                                                       | A bad write (bug, race condition, manual edit) could corrupt a row silently — accepted risk at this scale, per Section 5                                                                                                                                                                       |
| 6   | Spanish OCR accuracy is unverified                                                                                                                                                                  | Tesseract.js supports Spanish, but it hasn't been tested against real Colombian receipts — accuracy could differ meaningfully from the English path already in use. Worth a real test pass with sample Spanish receipts before trusting it, same as the earlier English test-receipt exercise. |
| 7   | COP amounts risk parsing errors if OCR/manual entry assumes USD-style formatting                                                                                                                    | COP conventionally has no decimal places and uses a period as the thousands separator (e.g. `$430.000` = 430,000 pesos, not $430.00) — if the app's amount parser assumes US formatting by default, COP amounts could be silently misread by a factor of 1,000                                 |

## 11. Open Decisions Needed From You

1. Decide if offline capture is a v1 requirement or explicitly deferred (leaning toward defer, not yet fully locked in)
2. Should the income/expense summary (Outcome 6) be scoped to the tax-year selector from Outcome 4, or to a custom range, or both? Not yet decided.

**Resolved (Jason's account):** Starter category list is Repairs & Maintenance, Insurance, Utilities, Property Management Fees, Cleaning. Worth revisiting before tax season if you want closer alignment to Schedule E buckets (e.g., splitting capital improvements out from repairs matters for depreciation vs. expense treatment) — noted here, not blocking v1. This is Jason's Schedule E context specifically; it doesn't apply to mom's Colombia properties, which are a separate tax context entirely (see Section 3 non-goals).

**Resolved (mom's account) — starter defaults, fully editable from there (Story 1.6), confirmed from her existing Excel — not a translation of Jason's list, a distinct starting point:**

- EMCALI (electricity)
- Gases de Occidente (gas)
- Claro Hogar (phone/internet)
- Limpieza Áreas Comunes (common area cleaning)
- Implementos de Limpieza (cleaning supplies)
- Administración 10% (admin fee — her own category, confirmed, not folded into Property Management Fees)
- Arreglos - Mano de Obra (repairs — labor, confirmed as separate from materials)
- Arreglos - Materiales (repairs — materials)

Eight categories, not five — genuinely different from Jason's list, not a Spanish mirror of it. Note the overlap between category and vendor for her: `EMCALI` is simultaneously the vendor and the category, unlike Jason's model where vendor (Home Depot) and category (Repairs & Maintenance) are distinct. Worth a future enhancement (not spec'd now): OCR-detected vendor text matching "EMCALI" could auto-suggest that category, since for her account they're effectively the same signal.

## 12. Acceptance Criteria — Outcome 1: Manage My Properties

_Criteria for the other two outcomes will be added once we get to them. This is the first buildable slice — nothing here depends on OCR, categories-at-capture, or any Outcome 3 complexity._

### Story 1.1 — Sign in with Google

**As a** user, **I want** to sign in with my Google account **so that** I only ever see my own portfolio, never someone else's, without needing to manage a separate password.

- **Given** I'm on the allowed list (currently: you and your mom's email addresses), **when** I sign in with Google for the first time, **then** a new spreadsheet is created and linked to my account, and I land in my (empty) portfolio.
- **Given** I have an existing account, **when** I sign in with Google, **then** I see my own portfolio, loaded from my linked spreadsheet.
- **Given** I decline/cancel the Google sign-in prompt, **when** the flow is interrupted, **then** I'm returned to a clear "sign in to continue" state, not an error or blank screen.
- **Given** I'm signed in as User A, **when** I'm using the app, **then** I have no way to view or access User B's spreadsheet, properties, or expenses — isolation is enforced by each user's data living in their own Google account, not by app-level permission logic.
- **Given** someone signs in with a Google account that is NOT on the allowed list, **when** they complete the Google auth prompt, **then** the app rejects access with a clear message (e.g. "This app is invite-only") — no spreadsheet is created, no portfolio is shown, before this check exists. **This gap was caught after v1 deployment (Aug 2026) — "Sign in with Google" alone authenticates identity, it does not restrict authorization. The allowed-list check must run before any spreadsheet creation or data access.**
- **Implementation note:** the allowed-email list should be an environment variable (e.g. in Vercel), never hardcoded into a committed source file.

### Story 1.2 — Add a property

**As a** user, **I want** to add a property to my portfolio **so that** I have somewhere to assign expenses to later.

- **Given** I'm logged in, **when** I choose to add a property and enter at least a name, **then** the property is saved and appears in my portfolio.
- **Given** I try to add a property with no name, **when** I attempt to save, **then** I get a validation error and the property is not created (name is required; address is not, for v1).
- **Given** I've added a property, **when** I view my portfolio, **then** the new property appears immediately without needing to refresh/reload.

### Story 1.3 — Edit a property

**As a** user, **I want** to edit a property's details **so that** I can correct mistakes or update info (e.g., address change).

- **Given** an existing property, **when** I edit its name or address and save, **then** the changes are reflected everywhere the property appears (list view, detail view).
- **Given** I edit a property, **when** I clear the name field entirely and try to save, **then** I get a validation error (name can't be blank) and the prior value is preserved.

### Story 1.4 — Archive a property

**As a** user, **I want** to archive a property I no longer manage **so that** it's out of my active view but its historical expense data isn't lost.

- **Given** an active property with existing expenses, **when** I archive it, **then** it no longer appears in my default/active property list, but its expense history remains intact and accessible.
- **Given** an archived property, **when** I look at my portfolio, **then** I can still find and view it (e.g., via an "archived" filter/toggle), distinct from active properties.
- **Given** an archived property, **when** I choose to, **then** I can un-archive it and it returns to the active list with all data intact.
- Archiving is a soft-delete only — there is no hard-delete of a property with expense history in v1 (prevents accidental permanent loss of tax-relevant records).

### Story 1.5 — Starter category list provisioning

**As a** user, **I want** the app to give me a starter expense category list when I set up **so that** I don't have to invent categories myself before I can log an expense.

- **Given** I'm a new user setting up my portfolio, **when** setup completes, **then** the five starter categories (Repairs & Maintenance, Insurance, Utilities, Property Management Fees, Cleaning) are available for use — no manual configuration required.
- **Given** the starter categories exist, **when** I'm elsewhere in the app (this becomes testable once Outcome 3 is built), **then** these are the categories offered when assigning an expense.

### Story 1.6 — Manage categories

**As a** user, **I want** to add, rename, and archive my own categories **so that** the app fits how I actually track expenses, not just the defaults it shipped with.

- **Given** I'm logged in, **when** I add a new category with a name, **then** it's saved and immediately available when assigning an expense.
- **Given** an existing category, **when** I rename it, **then** the new name applies everywhere it's referenced — past expenses using that category reflect the new name, not a broken link.
- **Given** a category with expenses already assigned to it, **when** I archive it, **then** those expenses keep their category (unchanged), and the archived category simply stops appearing as an option for new expenses — same soft-delete principle as archiving a property (Story 1.4).
- **Given** I try to add a category with a blank name, **when** I attempt to save, **then** I get a validation error and no category is created.

## 13. Acceptance Criteria — Outcome 2: See My Properties

_Depends on Outcome 1 (properties must exist to be viewed). No dependency on Outcome 3 — property detail views work with zero expenses, since Outcome 3 hasn't been built yet at this point in the build order._

### Story 2.1 — View property list

**As a** user, **I want** to see all my active properties in one place **so that** I can confirm my portfolio is set up correctly.

- **Given** I have one or more active properties, **when** I open the app, **then** I see a list of all my active properties, each showing at minimum its name.
- **Given** I have zero properties (new user, nothing added yet), **when** I open the app, **then** I see a clear empty state prompting me to add my first property — not a blank screen or an error.
- **Given** I have both active and archived properties, **when** I view the default list, **then** only active properties are shown.

### Story 2.2 — View a single property's detail

**As a** user, **I want** to open a specific property **so that** I can see its full details and (once Outcome 3 exists) its expense history.

- **Given** an active property, **when** I select it from the list, **then** I see its detail view showing its name and address.
- **Given** a property with no expenses yet, **when** I view its detail, **then** the expense section shows an empty state, not an error — this must work correctly before Outcome 3 is built, since the property detail view exists ahead of expense capture in the build order.

### Story 2.3 — Distinguish active vs. archived properties

**As a** user, **I want** to tell at a glance whether a property is active or archived **so that** I don't confuse a retired property with one I'm still managing.

- **Given** I have archived properties, **when** I look at my portfolio, **then** archived properties are not mixed into the default active view (per Story 1.4/2.1).
- **Given** I switch to an "archived" view/filter, **when** I look at it, **then** archived properties are visually distinguishable from active ones (e.g., a label or muted styling) — exact visual treatment is a UI/UX decision for post-MVP polish, not specified here.

## 14. Acceptance Criteria — Outcome 4: See a Tax-Year Expense Summary

_Depends on Outcome 3 (there must be expenses to summarize). This is where the app's tax-purposes promise actually gets delivered — capture alone doesn't help at filing time without this._

### Story 4.1 — Tax-year total per property

**As a** user, **I want** to see how much I spent on a property in a given tax year **so that** I have the number I need at filing time without adding it up by hand.

- **Given** a property with expenses, **when** I view its detail page, **then** I see a total explicitly labeled with the year it covers (e.g. "2026 total: $1,240"), not an unlabeled "Total."
- **Given** the current calendar year, **when** I open a property's detail page, **then** the year selector defaults to the current year and the total reflects only expenses dated within that year.
- **Given** a property with expenses spanning multiple years, **when** I switch the year selector to a prior year, **then** the total recalculates to reflect only that year's expenses.
- **Given** a property with zero expenses in the selected year, **when** I view the total, **then** it shows $0 for that year, not an error or a blank state.

### Story 4.2 — Spend by category

**As a** user, **I want** to see my spend broken down by category for the selected year **so that** I understand where money went and have it pre-sorted the way my tax categories expect.

- **Given** a property with expenses across multiple categories in the selected year, **when** I view the category breakdown, **then** each category (from the Outcome 1 starter list) shows its own subtotal for that year.
- **Given** a category with no expenses in the selected year, **when** I view the breakdown, **then** that category either shows $0 or is omitted — exact treatment is a UI decision, not specified here, but it must not be silently missing without explanation.
- **Given** I switch the year selector, **when** the total recalculates (Story 4.1), **then** the category breakdown recalculates to match the same year — the two numbers must never be out of sync with each other.

_(Open, not blocking: whether the category breakdown also respects the existing custom From/To date filter, or is scoped to the year selector only, is not yet decided — currently spec'd as year-selector-only for simplicity.)_

## 15. Future Considerations — History

**Occupancy / vacancy tracking — promoted to Outcome 6 (Aug 2026).** Originally parked here as a v2 candidate. Jason's mom independently requested the same capability, already tracks it manually in Excel, and the request was formalized into real requirements (Section 7) and acceptance criteria (Section 17) rather than staying speculative. Original reasoning preserved below for context.

_Original note: track date ranges per property for rented vs. vacant periods, plus the property's rent rate — vacancy days alone don't produce a dollar figure; the rate is what turns "14 vacant days" into a number a CPA can actually use for the loss calculation. The exact tax treatment of vacancy periods (holding-out-for-rent status, personal-use-day limits, passive loss rules) remains CPA territory, not something this app asserts — its job is accurate record-keeping (dates and rate), not tax conclusions._

## 16. Acceptance Criteria — Outcome 5: Spanish UI + COP

_Depends on Outcomes 1-4 already existing (this localizes them, doesn't replace them). Applies per-account — Jason's account is unaffected; only accounts with `language: es` / `currency: COP` in Settings see this behavior._

### Story 5.1 — Language setting

**As a** Spanish-speaking user, **I want** the entire app in Spanish **so that** I can use it the way I actually think, not translate in my head as I go.

- **Given** an account with `language: es` in Settings, **when** any screen loads, **then** all UI text (buttons, labels, headers, empty states, validation and error messages) appears in Spanish.
- **Given** an account with `language: en`, **when** any screen loads, **then** all UI text appears in English, unchanged from current v1 behavior.
- **Given** a starter category is shown (Story 1.5), **when** the account language is Spanish, **then** the account seeds with its own starter defaults (Section 11: EMCALI, Gases de Occidente, Claro Hogar, Limpieza Áreas Comunes, Implementos de Limpieza, Administración 10%, Arreglos - Mano de Obra, Arreglos - Materiales) — a distinct, more granular starting point confirmed from her existing Excel workflow, not a Spanish translation of Jason's five-category list. Like any account, she can add, rename, or archive from there (Story 1.6).

### Story 5.2 — Currency setting

**As a** user with COP-denominated properties, **I want** amounts entered and shown in pesos, formatted the way pesos are actually written **so that** the numbers look right and I don't misread them.

- **Given** an account with `currency: COP`, **when** an amount is displayed anywhere in the app, **then** it's formatted with no decimal places and a period as the thousands separator (e.g. `$430.000`), not USD-style formatting.
- **Given** an account with `currency: COP`, **when** a user manually enters an amount, **then** the input accepts COP-style formatting without misinterpreting it as a USD-style decimal amount (guards against the 1,000x misread risk in Section 10).
- **Given** an account with `currency: USD` (Jason's), **when** amounts are displayed, **then** formatting is unchanged from current v1 behavior.

### Story 5.3 — Spanish OCR

**As a** user capturing Spanish-language receipts, **I want** OCR to actually read them correctly **so that** capture is still faster than manual entry, not slower.

- **Given** an account with `language: es`, **when** a receipt photo is captured, **then** OCR runs using Spanish-language Tesseract data, not English.
- **Given** OCR misreads a Spanish receipt (expected, per Section 10 risk — accuracy unverified), **when** the user reaches the confirm screen, **then** the same manual-correction fallback from Outcome 3 applies — OCR is still a shortcut, never a gate, regardless of language.
- _(Not yet done: a real test pass with sample Spanish-language receipts, similar to the English test-receipt set already generated, is needed before trusting this in production.)_

## 17. Acceptance Criteria — Outcome 6: Rental Income and Occupancy

_Depends on Outcome 1 (properties must exist). Independent of Outcomes 3-5 — income/occupancy data doesn't require expenses or OCR to exist first._

### Story 6.1 — Log rent income

**As a** landlord, **I want** to log rent payments per property **so that** I can see income the same way I see expenses.

- **Given** a property, **when** I log an income entry with amount and date received, **then** it's saved and associated with that property, mirroring how expenses work (Outcome 3).
- **Given** a property with logged income, **when** I view its detail, **then** I see an income list alongside (not replacing) the expense list.

### Story 6.2 — Track tenancy dates

**As a** landlord, **I want** to record when a tenant's contract starts, when it's expected to end, and when they actually leave **so that** I can see the difference between planned and actual, and account for vacant time.

- **Given** a property, **when** I record a new tenancy, **then** I can enter contract start date, expected end date, and (later, once known) actual move-out date.
- **Given** a tenancy with only contract start/expected-end filled in, **when** the tenant hasn't left yet, **then** actual move-out remains blank/null without being treated as an error.
- **Given** a tenancy where actual move-out differs from expected end, **when** I view the property, **then** both dates are visible — the gap itself is meaningful data (early departure vs. overstay), not something to be collapsed into one date.
- **Given** a tenancy record, **when** I create it, **then** I also record the monthly rent for that tenancy (needed later to value vacant time).

### Story 6.3 — Income/expense summary

**As a** landlord, **I want** to see income and expenses together for a property **so that** I can see money left over, the way I currently calculate it by hand in Excel.

- **Given** a property with both income and expense entries, **when** I view its summary, **then** I see income total, expense total, and the difference (income minus expenses) — mirroring the "Money In / Money Out / Money Left Over" structure from the existing Excel workflow.
- _(Open, not blocking: whether this summary is scoped to the Outcome 4 tax-year selector or a separate/custom range is Section 11 open decision #4 — not yet resolved.)_

### Story 6.4 — Expense notes

**As a** landlord, **I want** to add a free-text note to an expense **so that** I can record context that doesn't fit into vendor/category/amount (e.g. "paint for unit 304 walls and ceiling").

- **Given** the expense capture or edit flow, **when** I add or edit an expense, **then** I can enter and save a free-text note field, matching the Notes column already in use in the Excel workflow.
