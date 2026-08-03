import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./context";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return <>{children}</>;
}
