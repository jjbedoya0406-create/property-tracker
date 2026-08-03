import { ApiError } from "./errors";

// Thin fetch wrapper shared by the Sheets and Drive clients. Callers supply
// the OAuth access token from the auth module (src/auth) — this layer has no
// knowledge of how the token was obtained.
export async function authorizedFetch(
  accessToken: string,
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => undefined);
    throw new ApiError(
      `Request to ${url} failed with ${response.status}`,
      response.status,
      body,
    );
  }

  return response;
}

export async function authorizedFetchJson<T>(
  accessToken: string,
  url: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await authorizedFetch(accessToken, url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  return response.json() as Promise<T>;
}
