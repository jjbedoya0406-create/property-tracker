import { Link, Outlet } from "react-router-dom";
import { BottomTabBar } from "@/components/BottomTabBar";
import { StampIcon } from "@/components/StampIcon";
import { cn } from "@/lib/utils";
import { useAuth } from "../auth";

export function Layout() {
  const { isSignedIn } = useAuth();

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-2xl items-center px-4 py-3">
          <Link to="/properties" className="flex items-center gap-2">
            <StampIcon />
            <span className="text-[13px] font-medium text-foreground">
              Property expense tracker
            </span>
          </Link>
        </div>
      </header>
      <main
        className={cn(
          "mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6",
          // Clears the fixed bottom tab bar so content never sits under it.
          isSignedIn && "pb-24",
        )}
      >
        <Outlet />
      </main>
      {isSignedIn && <BottomTabBar />}
    </div>
  );
}
