/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID: string;
  // Needed for "Connect a portfolio" (issue #3) — optional because the
  // app is fully usable without ever connecting to another account's
  // portfolio. See docs/google-cloud-setup.md.
  readonly VITE_GOOGLE_PICKER_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
