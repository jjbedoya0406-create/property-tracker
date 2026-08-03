# PRD: Rental Property Expense Tracker (v0.1 — Draft)

**Status:** Draft for review
**Owner:** Jason
**Last updated:** Aug 3, 2026

---

## 1. Problem Statement

Landlords managing a portfolio of rental properties currently track expenses manually — saving paper/digital receipts and entering them into spreadsheets by hand. This process is:

- **Time-consuming** — manual entry after the fact, batched instead of captured in the moment
- **Error-prone** — mistyped amounts, wrong categories, receipts attributed to the wrong property
- **Lossy** — receipts get forgotten, lost, or never make it into the spreadsheet at all, which is a real problem at tax time or during an audit

This gets worse as the number of properties grows — each property needs its own clean expense record, but a spreadsheet-based process doesn't scale well per-property without becoming its own maintenance burden.

## 2. Goal (v1) — Three Outcomes

MVP is scoped as three outcomes, in build order (each depends on the one before it):

1. **Manage my properties** — I can add, edit, and archive the properties in my portfolio.
2. **See my properties** — I can view my portfolio and confirm it's set up correctly.
3. **Capture a receipt for tax purposes** — I can take a photo of a receipt, have it stored durably (retrievable later, e.g. for an audit), and have it unambiguously assigned to the correct property.

Outcome 3 is the headline value ("automated capture instead of Excel"), but 1 and 2 are the foundation it depends on — there's nowhere to assign a receipt to if properties don't exist yet.

**v1 success looks like:** a user can set up their portfolio, confirm it looks right, and log a receipt against the correct property — end to end, nothing lost.

## 3. Non-Goals (explicitly out of scope for v1)

- Bank/credit card feed integration (auto-import from financial institutions)
- Email receipt forwarding/parsing
- Multi-user permissions within one portfolio (e.g., a property manager with limited access)
- Tax filing / export to accounting software (QuickBooks, Schedule E, etc.)
- Revenue/rent tracking (this is expense-only for v1)
- Reporting/analytics dashboards beyond basic per-property totals

These are reasonable v2+ candidates, not being ruled out — just not blocking v1.

## 4. Users

| User        | Portfolio size | Notes                       |
| ----------- | -------------- | --------------------------- |
| Jason       | 2 properties   | Primary user, building this |
| Jason's mom | 7 properties   | Secondary user              |

**Decided:** Each person logs into their own account and only sees their own properties. Two fully independent portfolios — no shared access, no "switch portfolio" concept needed in v1. Simple per-user data isolation is sufficient.

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

| Layer                 | Choice                                | Why                                                                                                                                                                                                         |
| --------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Data storage          | Google Sheets (via Google Sheets API) | $0, no account to stand up, human-readable — you can open the sheet directly if something needs debugging                                                                                                   |
| Receipt image storage | Google Drive (via Google Drive API)   | $0, durable, naturally satisfies the "tax-audit-retrievable" bar in Outcome 3                                                                                                                               |
| Auth                  | Google OAuth ("Sign in with Google")  | $0, no password system to build — replaces Story 1.1 entirely with an existing, trusted flow. You and your mom already have Google accounts.                                                                |
| OCR                   | Tesseract.js (on-device, in-browser)  | $0 guaranteed, no API keys/usage costs. Tradeoff: lower accuracy than a cloud OCR API — acceptable because OCR is a shortcut, never a gate (Section 6), so manual correction is already a built-in fallback |
| Frontend framework    | React                                 | Widely-documented, strong PWA tooling, good fit for a learning project                                                                                                                                      |

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

### Should-have (v1 if feasible, else immediately post-v1)

- [ ] Edit/delete an already-saved expense
- [ ] Search/filter expenses by category or vendor
- [ ] Export a property's expense list (CSV at minimum)

## 8. Data Model — Google Sheets Structure

Each user gets their own spreadsheet (created on first login, tied to their Google account — this is what gives us the per-user isolation from Story 1.1 without building custom auth).

**Tab: `Properties`**

| Column      | Notes                            |
| ----------- | -------------------------------- |
| property_id | Unique ID, generated on creation |
| name        | Required                         |
| address     | Optional                         |
| status      | `active` or `archived`           |
| created_at  |                                  |

**Tab: `Expenses`**

| Column            | Notes                                          |
| ----------------- | ---------------------------------------------- |
| expense_id        | Unique ID                                      |
| property_id       | Links to a row in `Properties`                 |
| amount            |                                                |
| date              |                                                |
| vendor            |                                                |
| category          | One of the five starter categories (Section 7) |
| receipt_drive_url | Link to the image file in Google Drive         |
| source            | `ocr` or `manual`                              |
| created_at        |                                                |
| edited_at         |                                                |

**Why this shape:** it mirrors the original draft's User → Property → Expense structure, just expressed as Sheets tabs instead of database tables. `property_id` as a foreign-key-style column is what lets "Outcome 3 assigns to a property" and "Outcome 2 filters by property" both work off the same two tabs without duplicating data.

## 9. Success Metrics

Since this is a personal tool first, "success" is qualitative at v1, but worth defining so you know if it's working:

- Are receipts actually getting captured at time-of-purchase instead of piling up?
- Is time-to-log-an-expense meaningfully faster than the spreadsheet process it replaces?
- At month-end, is anything missing that would've been missing under the old process too? (i.e., did automation actually reduce loss, or just move where things get lost)

## 10. Risks / Open Questions

| #   | Risk/Question                                                      | Why it matters                                                                                                           |
| --- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| 1   | OCR accuracy on real-world receipts (faded, handwritten, crumpled) | Directly determines whether this saves time or adds a correction chore                                                   |
| 2   | Where are receipt images stored, and for how long?                 | Resolved — Google Drive, per Section 5. Durable and outlives the app itself if maintenance ever stops.                   |
| 3   | Offline capture (property with bad cell signal)                    | Common real-world scenario for rental properties; not addressed yet in this draft                                        |
| 4   | Sheets has no enforced schema or transactions                      | A bad write (bug, race condition, manual edit) could corrupt a row silently — accepted risk at this scale, per Section 5 |

## 11. Open Decisions Needed From You

1. Decide if offline capture is a v1 requirement or explicitly deferred (leaning toward defer, not yet fully locked in)

**Resolved:** Starter category list is Repairs & Maintenance, Insurance, Utilities, Property Management Fees, Cleaning. Worth revisiting before tax season if you want closer alignment to Schedule E buckets (e.g., splitting capital improvements out from repairs matters for depreciation vs. expense treatment) — noted here, not blocking v1.

## 12. Acceptance Criteria — Outcome 1: Manage My Properties

_Criteria for the other two outcomes will be added once we get to them. This is the first buildable slice — nothing here depends on OCR, categories-at-capture, or any Outcome 3 complexity._

### Story 1.1 — Sign in with Google

**As a** user, **I want** to sign in with my Google account **so that** I only ever see my own portfolio, never someone else's, without needing to manage a separate password.

- **Given** I'm a new user, **when** I sign in with Google for the first time, **then** a new spreadsheet is created and linked to my account, and I land in my (empty) portfolio.
- **Given** I have an existing account, **when** I sign in with Google, **then** I see my own portfolio, loaded from my linked spreadsheet.
- **Given** I decline/cancel the Google sign-in prompt, **when** the flow is interrupted, **then** I'm returned to a clear "sign in to continue" state, not an error or blank screen.
- **Given** I'm signed in as User A, **when** I'm using the app, **then** I have no way to view or access User B's spreadsheet, properties, or expenses — isolation is enforced by each user's data living in their own Google account, not by app-level permission logic.

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

_(Open, not blocking: whether users can add custom categories beyond the starter five is not yet decided — currently out of scope for v1 unless you want to add it.)_

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
