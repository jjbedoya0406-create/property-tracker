import { Navigate } from "react-router-dom";
import { useAuth } from "../auth";

export function SignInPage() {
  const { isSignedIn, isSigningIn, error, signIn } = useAuth();

  if (isSignedIn) {
    return <Navigate to="/properties" replace />;
  }

  return (
    <div>
      <h1>Property Expense Tracker</h1>
      <p>Sign in to view and manage your portfolio.</p>
      <button type="button" onClick={signIn} disabled={isSigningIn}>
        {isSigningIn ? "Signing in…" : "Sign in with Google"}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
