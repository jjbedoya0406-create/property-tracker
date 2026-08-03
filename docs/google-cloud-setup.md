# Google Cloud setup (one-time, per deployment)

This app is a backend-less SPA: it calls the Google Sheets and Drive APIs directly
from the browser using an OAuth access token issued by Google Identity Services (GIS).
There is no server-side client secret — only a public OAuth **Client ID** is needed.

You (the project owner) do this once per environment (once for local dev, once for
the deployed GitHub Pages site). Each user just signs in with their own Google account
afterward — no per-user setup.

## 1. Create a Google Cloud project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g. "Property Expense Tracker").

## 2. Enable the required APIs

In **APIs & Services → Library**, enable:

- **Google Sheets API**
- **Google Drive API**

## 3. Configure the OAuth consent screen

In **APIs & Services → OAuth consent screen**:

- User type: **External** (since this isn't a Google Workspace org app).
- App name, support email: whatever you like.
- Scopes: add
  - `https://www.googleapis.com/auth/spreadsheets`
  - `https://www.googleapis.com/auth/drive.file` (not full `drive` — this scope
    only grants access to files the app itself creates, which is enough for the
    per-user spreadsheet + receipt images and keeps the requested permission
    narrow).
- Test users: add your Google account and your mom's, since the app won't be
  verified by Google (only 2 users, no public distribution — verification is
  unnecessary overhead here).

## 4. Create an OAuth Client ID

In **APIs & Services → Credentials → Create Credentials → OAuth client ID**:

- Application type: **Web application**.
- Authorized JavaScript origins — add both:
  - `http://localhost:5173` (local dev)
  - `https://jjbedoya0406-create.github.io` (production — note: just the
    origin, no path; the app itself lives at the `/property-tracker/` path
    under that origin, but GIS only checks the origin)
- No redirect URIs are needed for the token-client flow this app uses.

Copy the generated **Client ID** (looks like `xxxx.apps.googleusercontent.com`).

## 5. Set the environment variable

Create a `.env.local` file in the project root (already gitignored):

```
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

For the deployed GitHub Pages build, this same value is injected at build time via
a GitHub Actions secret — never commit it directly. In the GitHub repo, go to
**Settings → Secrets and variables → Actions → New repository secret** and add
`VITE_GOOGLE_CLIENT_ID` with the same value. The workflow at
`.github/workflows/deploy.yml` reads it from there on every build.

Also enable Pages itself: **Settings → Pages → Source → GitHub Actions** (not
"Deploy from a branch" — the workflow publishes directly via the Pages API).

## Why `drive.file` and not `drive`

`drive.file` is a narrower OAuth scope: it only lets the app see/manage files it
created itself, not your entire Drive. Since every receipt image is uploaded by
this app, that's sufficient — and it's a much smaller ask than full Drive access,
which matters for the OAuth consent screen review a user sees when signing in.
