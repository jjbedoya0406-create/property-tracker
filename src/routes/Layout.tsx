import { useQueryClient } from "@tanstack/react-query";
import { Camera } from "lucide-react";
import { Link, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StampIcon } from "@/components/StampIcon";
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
    <div className="flex min-h-svh flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/properties" className="flex items-center gap-2">
            <StampIcon />
            <span className="text-[13px] font-medium text-foreground">
              Property expense tracker
            </span>
          </Link>
          {isSignedIn && (
            <nav className="flex items-center gap-2">
              <Button asChild size="sm">
                <Link to="/capture">
                  <Camera className="size-4" />
                  Capture receipt
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-muted-foreground"
                onClick={handleSignOut}
              >
                Sign out
              </Button>
            </nav>
          )}
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
