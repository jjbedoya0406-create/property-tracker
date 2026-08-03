import { useAuth } from "./context";

// For use inside ProtectedRoute-guarded trees, where a null token would mean
// something is wired wrong rather than a normal "not signed in yet" state.
export function useRequiredAccessToken(): string {
  const { accessToken } = useAuth();
  if (!accessToken) {
    throw new Error(
      "useRequiredAccessToken must be used within a signed-in (ProtectedRoute) tree",
    );
  }
  return accessToken;
}
