import { useCallback, useMemo, useState, type ReactNode } from "react";
import { AuthContext, type AuthState } from "./context";
import { requestAccessToken } from "./tokenClient";
import { fetchUserEmail } from "./userInfo";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async () => {
    setIsSigningIn(true);
    setError(null);
    try {
      const token = await requestAccessToken();
      setAccessToken(token);
      // Best-effort — the account email is only for display (the "More"
      // sheet), so a failure here shouldn't block sign-in itself.
      setUserEmail(await fetchUserEmail(token).catch(() => null));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const signOut = useCallback(() => {
    setAccessToken(null);
    setUserEmail(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      accessToken,
      userEmail,
      isSignedIn: accessToken !== null,
      isSigningIn,
      error,
      signIn,
      signOut,
    }),
    [accessToken, userEmail, isSigningIn, error, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
