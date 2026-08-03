import { useCallback, useMemo, useState, type ReactNode } from "react";
import { AuthContext, type AuthState } from "./context";
import { requestAccessToken } from "./tokenClient";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async () => {
    setIsSigningIn(true);
    setError(null);
    try {
      const token = await requestAccessToken();
      setAccessToken(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const signOut = useCallback(() => {
    setAccessToken(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      accessToken,
      isSignedIn: accessToken !== null,
      isSigningIn,
      error,
      signIn,
      signOut,
    }),
    [accessToken, isSigningIn, error, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
