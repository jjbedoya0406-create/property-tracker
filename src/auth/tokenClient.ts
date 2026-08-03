import { loadGoogleIdentityServices } from "./loadGis";
import type { TokenResponse } from "./gis-types";

// drive.file (not the broader `drive` scope) — see docs/google-cloud-setup.md
// for why: it only grants access to files this app creates itself.
const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
].join(" ");

// Opens the Google OAuth consent popup and resolves with a short-lived
// access token (GIS tokens expire in ~1hr; callers re-request as needed
// rather than this module managing refresh/persistence).
export async function requestAccessToken(): Promise<string> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error(
      "VITE_GOOGLE_CLIENT_ID is not set — see docs/google-cloud-setup.md.",
    );
  }

  await loadGoogleIdentityServices();

  return new Promise<string>((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (response: TokenResponse) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error ?? "Sign-in failed"));
          return;
        }
        resolve(response.access_token);
      },
      error_callback: (error) => {
        reject(new Error(error.message ?? "Sign-in was cancelled or failed"));
      },
    });
    client.requestAccessToken();
  });
}
