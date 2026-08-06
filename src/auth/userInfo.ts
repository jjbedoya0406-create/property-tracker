// Just for display (the "More" sheet's account row) — not used for any
// authorization decision, that's still enforced server-side by Google via
// the OAuth flow itself.
export async function fetchUserEmail(
  accessToken: string,
): Promise<string | null> {
  const response = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!response.ok) {
    return null;
  }
  const data = (await response.json()) as { email?: string };
  return data.email ?? null;
}
