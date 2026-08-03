import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../auth";

export function Layout() {
  const { isSignedIn, signOut } = useAuth();

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
              <button type="button" onClick={signOut}>
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
