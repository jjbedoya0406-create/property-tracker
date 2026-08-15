import { Link, Outlet } from "react-router-dom";
import { StampIcon } from "@/components/StampIcon";
import { useActivePortfolioLabel } from "@/portfolio/context";

export function Layout() {
  const activeLabel = useActivePortfolioLabel();

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link to="/properties" className="flex items-center gap-2">
            <StampIcon />
            <span className="text-[13px] font-medium text-foreground">
              Property expense tracker
            </span>
          </Link>
          {activeLabel !== null && (
            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
              {activeLabel}
            </span>
          )}
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
