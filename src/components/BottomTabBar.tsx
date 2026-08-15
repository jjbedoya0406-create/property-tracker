import { useQueryClient } from "@tanstack/react-query";
import { Camera, Check, Home, Menu } from "lucide-react";
import { useState } from "react";
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
import { ConnectPortfolioForm } from "@/features/connectedPortfolios/ConnectPortfolioForm";
import { useTranslation } from "../i18n/useTranslation";
import { usePortfolioSwitcher } from "../portfolio/context";

// Locked navigation pattern (Design_System_v0.1.md): exactly 3 tabs,
// permanently. Properties and Capture are the two most-used actions and
// stay one tap away always; everything else (Categories today, Income and
// Occupancy later) lives in the "More" sheet instead of growing the tab
// bar or the old header-link pattern this replaces.
const tabItemClass =
  "flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium";

export function BottomTabBar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { userEmail, signOut } = useAuth();
  const queryClient = useQueryClient();
  const {
    isHome,
    activeConnectionId,
    connectedPortfolios,
    switchToHome,
    switchToPortfolio,
  } = usePortfolioSwitcher();

  function handleSignOut() {
    signOut();
    // Drops any cached portfolio/property data so it can't leak to whoever
    // signs in next in this browser (two known users on shared devices).
    queryClient.clear();
    navigate("/sign-in");
  }

  const isProperties = location.pathname.startsWith("/properties");
  const isCapture = location.pathname.startsWith("/capture");

  // Controlled so a completed "Connect a portfolio" flow can close the
  // sheet itself (SheetClose alone can't fire after an async mutation).
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showConnectForm, setShowConnectForm] = useState(false);

  function closeSheet() {
    setIsSheetOpen(false);
    setShowConnectForm(false);
  }

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
          {t("nav.properties")}
        </Link>
        <Link
          to="/capture"
          className={cn(
            tabItemClass,
            isCapture ? "text-primary" : "text-muted-foreground",
          )}
        >
          <Camera className="size-5" />
          {t("nav.capture")}
        </Link>
        <Sheet
          open={isSheetOpen}
          onOpenChange={(open) => {
            setIsSheetOpen(open);
            if (!open) setShowConnectForm(false);
          }}
        >
          <SheetTrigger asChild>
            <button
              type="button"
              className={cn(tabItemClass, "text-muted-foreground")}
            >
              <Menu className="size-5" />
              {t("nav.more")}
            </button>
          </SheetTrigger>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle className="text-sm font-normal text-muted-foreground">
                {userEmail ?? t("nav.signedInFallback")}
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-1 px-4">
              <span className="px-2 pt-1 pb-0.5 text-xs font-medium text-muted-foreground">
                {t("nav.portfolio")}
              </span>
              <button
                type="button"
                className="flex min-h-11 items-center justify-between rounded-md px-2 text-sm font-medium hover:bg-muted"
                onClick={() => {
                  switchToHome();
                  closeSheet();
                }}
              >
                {t("nav.myPortfolio")}
                {isHome && <Check className="size-4 text-primary" />}
              </button>
              {connectedPortfolios.map((connection) => (
                <button
                  key={connection.connectionId}
                  type="button"
                  className="flex min-h-11 items-center justify-between rounded-md px-2 text-sm font-medium hover:bg-muted"
                  onClick={() => {
                    switchToPortfolio(connection.connectionId);
                    closeSheet();
                  }}
                >
                  {connection.label}
                  {activeConnectionId === connection.connectionId && (
                    <Check className="size-4 text-primary" />
                  )}
                </button>
              ))}
              {showConnectForm ? (
                <ConnectPortfolioForm
                  onConnected={(connection) => {
                    switchToPortfolio(connection.connectionId);
                    closeSheet();
                  }}
                  onCancel={() => setShowConnectForm(false)}
                />
              ) : (
                <button
                  type="button"
                  className="flex min-h-11 items-center rounded-md px-2 text-sm font-medium text-muted-foreground hover:bg-muted"
                  onClick={() => setShowConnectForm(true)}
                >
                  {t("nav.connectPortfolio")}
                </button>
              )}
            </div>
            <Separator />
            <div className="flex flex-col gap-1 px-4">
              <SheetClose asChild>
                <Link
                  to="/categories"
                  className="flex min-h-11 items-center rounded-md px-2 text-sm font-medium hover:bg-muted"
                >
                  {t("nav.categories")}
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  to="/settings"
                  className="flex min-h-11 items-center rounded-md px-2 text-sm font-medium hover:bg-muted"
                >
                  {t("nav.settings")}
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
                {t("nav.signOut")}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
