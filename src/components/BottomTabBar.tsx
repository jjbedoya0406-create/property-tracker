import { useQueryClient } from "@tanstack/react-query";
import { Camera, Home, Menu } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

// Locked navigation pattern (Design_System_v0.1.md): exactly 3 tabs,
// permanently. Properties and Capture are the two most-used actions and
// stay one tap away always; everything else (Categories today, Income and
// Occupancy later) lives in the "More" sheet instead of growing the tab
// bar or the old header-link pattern this replaces.
const tabItemClass =
  "flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium";

export function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userEmail, signOut } = useAuth();
  const queryClient = useQueryClient();

  function handleSignOut() {
    signOut();
    // Drops any cached portfolio/property data so it can't leak to whoever
    // signs in next in this browser (two known users on shared devices).
    queryClient.clear();
    navigate("/sign-in");
  }

  const isProperties = location.pathname.startsWith("/properties");
  const isCapture = location.pathname.startsWith("/capture");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card">
      <div className="mx-auto flex max-w-2xl">
        <Link
          to="/properties"
          className={cn(
            tabItemClass,
            isProperties ? "text-primary" : "text-muted-foreground",
          )}
        >
          <Home className="size-5" />
          Properties
        </Link>
        <Link
          to="/capture"
          className={cn(
            tabItemClass,
            isCapture ? "text-primary" : "text-muted-foreground",
          )}
        >
          <Camera className="size-5" />
          Capture
        </Link>
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className={cn(tabItemClass, "text-muted-foreground")}
            >
              <Menu className="size-5" />
              More
            </button>
          </SheetTrigger>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle className="text-sm font-normal text-muted-foreground">
                {userEmail ?? "Signed in"}
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-1 px-4">
              <SheetClose asChild>
                <Link
                  to="/categories"
                  className="flex min-h-11 items-center rounded-md px-2 text-sm font-medium hover:bg-muted"
                >
                  Categories
                </Link>
              </SheetClose>
            </div>
            <Separator />
            <div className="px-4 pb-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleSignOut}
              >
                Sign out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
