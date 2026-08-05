import { useQueryClient } from "@tanstack/react-query";
import { Link, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
    <div className="min-h-svh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link
            to="/properties"
            className="text-lg font-medium text-foreground"
          >
            Property Expense Tracker
          </Link>
          {isSignedIn && (
            <nav className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link to="/capture">Capture receipt</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            </nav>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
