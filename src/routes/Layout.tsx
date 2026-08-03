import { useQueryClient } from "@tanstack/react-query";
import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../auth";

export function Layout() {
  const { isSignedIn, signOut } = useAuth();
  const queryClient = useQueryClient();

  function handleSignOut() {
    signOut();
    // Drops any cached portfolio/property data so it can't leak to whoever
    // signs in next in this browser (two known users on shared devices).
    queryClient.clear();
  }

  return (
    <div>
      <header>
        <nav>
          <Link to="/properties">Properties</Link>
          {isSignedIn && (
            <>
              {" | "}
              <Link to="/capture">Capture receipt</Link>
              {" | "}
              <button type="button" onClick={handleSignOut}>
                Sign out
              </button>
            </>
          )}
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
