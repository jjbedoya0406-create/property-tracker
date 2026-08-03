# Property Expense Tracker

A PWA for tracking rental property expenses and receipts. See
[`Property_Expense_Tracker_PRD_v0.1.md`](./Property_Expense_Tracker_PRD_v0.1.md)
for the full product spec.

This repo is currently scaffolding only — architecture and tooling are wired
up, but the Outcome 1–3 features (manage properties, view portfolio, capture
receipts) are not yet implemented.

## Architecture

Backend-less SPA: React calls the Google Sheets and Drive APIs directly from
the browser using an OAuth access token from Google Identity Services. No
custom server — static hosting only.

| Layer                 | Choice                                                                    |
| --------------------- | ------------------------------------------------------------------------- |
| Frontend              | React + TypeScript, via Vite                                              |
| Data storage          | Google Sheets API (one spreadsheet per user, created on first login)      |
| Receipt image storage | Google Drive API (`drive.file` scope)                                     |
| Auth                  | Google OAuth via Google Identity Services                                 |
| OCR                   | Tesseract.js (on-device)                                                  |
| Routing               | react-router, `HashRouter` (GitHub Pages has no server-side SPA fallback) |
| Server state          | TanStack Query                                                            |
| Validation            | Zod                                                                       |
| Hosting               | GitHub Pages, deployed via GitHub Actions                                 |

```
src/
  api/          Sheets + Drive REST clients (thin, typed wrappers), query keys
  auth/         Google Identity Services integration, AuthContext, ProtectedRoute
  routes/       Page components + router layout
  types/        Property, Expense, Category domain types (mirrors PRD §8)
  test/         Vitest setup
docs/
  google-cloud-setup.md   One-time OAuth/API console setup
.github/workflows/
  deploy.yml    Build + deploy to GitHub Pages on push to main
```

## Local development

```bash
npm install
```

Follow [`docs/google-cloud-setup.md`](./docs/google-cloud-setup.md) to create
a Google Cloud OAuth client, then create `.env.local` in the project root:

```
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

```bash
npm run dev      # start dev server at http://localhost:5173
npm run test     # run Vitest
npm run lint     # oxlint
npm run format   # prettier --write
npm run build    # typecheck + production build to dist/
```

## Deployment

Pushes to `main` trigger `.github/workflows/deploy.yml`, which builds and
publishes to GitHub Pages at
`https://jjbedoya0406-create.github.io/property-tracker/`.

One-time setup in the GitHub repo (after `git push` to a `jjbedoya0406-create/property-tracker`
remote — not yet created as of this scaffold):

1. **Settings → Pages → Source** → `GitHub Actions`
2. **Settings → Secrets and variables → Actions** → add `VITE_GOOGLE_CLIENT_ID`
3. In the Google Cloud OAuth client (see `docs/google-cloud-setup.md`), add
   `https://jjbedoya0406-create.github.io` as an authorized JavaScript origin

## Tooling notes

- **oxlint**, not ESLint — Vite's newer default, a fast Rust-based linter.
  Config in `.oxlintrc.json`.
- **Vitest**, configured inside `vite.config.ts` (see the `test` key) rather
  than a separate config file.
- Data model types in `src/types` mirror the `Properties`/`Expenses` Sheets
  tabs described in PRD §8 — see that section before changing either.
