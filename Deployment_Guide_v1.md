# Deployment Guide — v1

Goal: get off localhost onto a free, HTTPS, shareable URL your mom can open and "Add to Home Screen" on her phone.

## Recommended: Vercel (free tier)

Netlify is an equally valid alternative — same idea, pick whichever. Steps below assume Vercel.

1. **Confirm the project is a git repo.** If it isn't already, initialize one and push to GitHub. Use a **private** repo — this project touches Google API credentials, no reason to make it public.
2. **Before pushing: make sure no secrets are committed.** Google OAuth client secrets / API keys should never be hardcoded into source files that go into git. If Claude Code hasn't already set this up, use a `.env` file (and add `.env` to `.gitignore`) for any keys, then set the real values as environment variables in Vercel's dashboard, not in the repo.
3. **Sign up for Vercel with your GitHub account**, import the repo, deploy. Vercel auto-detects a React project — should work with no extra config for a standard setup.
4. You'll get a URL like `your-project-name.vercel.app`. This is what you'll send your mom.

## Critical step — update Google OAuth settings

Your OAuth client is currently authorized for `localhost` only. In [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → your OAuth client:

- Add the new Vercel URL to **Authorized JavaScript origins**
- Add the new Vercel URL (plus any callback path your app uses) to **Authorized redirect URIs**

Without this, sign-in will fail on the deployed site even though it works fine locally — the failure won't be obvious from the error message, so check this first if sign-in breaks after deploying.

## Note: repo stayed public, not private

This guide recommends a private repo. We tried that (2026-08-04) and hit a
concrete limit: this GitHub account's plan does **not** support GitHub Pages
on a private repository (`gh api` returned "Your current plan does not
support GitHub Pages for this repository"). Making the repo private silently
disabled the live Pages site.

Decided to keep the repo **public** instead, because:
- No actual secrets are committed — the Google OAuth Client ID in
  `docs/google-cloud-setup.md` / the deploy workflow is a public-safe
  identifier by design (see that doc), not a secret like an API key or
  client secret.
- Private would require a paid GitHub plan just to keep Pages working.

If this account's plan ever changes (or you move to a paid tier), private +
Pages becomes viable again — re-check with:
`gh api -X POST repos/<owner>/<repo>/pages -f build_type=workflow` after
flipping visibility, since that's exactly the error that surfaces the
limitation.

## Before sending to your mom

- Test sign-in and the full capture flow yourself on the deployed URL first — confirm Google sign-in, property list, and receipt capture all work on the real domain, not just localhost.
- Send her the link directly (text/email).
- On her phone: open the link in the browser, then use **"Add to Home Screen"** (iOS Safari: Share icon → Add to Home Screen. Android Chrome: menu → Install app / Add to Home Screen). This gives her an app-like icon without needing any app store.
