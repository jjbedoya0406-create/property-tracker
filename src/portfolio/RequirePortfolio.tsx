import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AlertCircle, XIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useRequiredAccessToken } from "../auth";
import { queryKeys } from "../api/queryKeys";
import { listConnectedPortfolios } from "../data/connectedPortfolios";
import { applyOnboarding, ensurePortfolioSpreadsheet } from "../data/portfolio";
import { getSettings } from "../data/settings";
import type { Settings } from "../types";
import { OnboardingPicker } from "./OnboardingPicker";
import { PortfolioContext } from "./context";

// A connected portfolio can fail in ways your OWN portfolio never can
// (its owner revoked access, deleted the sheet, never finished
// onboarding) — unlike a failure in your own portfolio, there's always
// a safe way out: drop back to home. Rendered full-bleed (there's no
// BottomTabBar yet at this point — RequirePortfolio hasn't resolved),
// but bounded and dismissible rather than bare error text with no exit.
function ConnectedPortfolioIssue({
  message,
  onBack,
}: {
  message: string;
  onBack: () => void;
}) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <Alert variant="destructive" className="relative max-w-sm pr-10">
        <AlertCircle />
        <AlertDescription>{message}</AlertDescription>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-2 right-2"
          onClick={onBack}
        >
          <XIcon />
          <span className="sr-only">Back to my portfolio</span>
        </Button>
      </Alert>
    </div>
  );
}

// Sits inside ProtectedRoute: resolves (or creates, on first sign-in) the
// user's own spreadsheet before rendering any property/expense UI (Story
// 1.1), resolves account Settings — showing a one-time onboarding picker
// if the account hasn't chosen a language/currency yet (Outcome 5) — and
// resolves the portfolio switcher (issue #3): which spreadsheet is
// currently ACTIVE (home, or a connected portfolio someone shared),
// which drives every feature hook in the app via useSpreadsheetId().
export function RequirePortfolio({ children }: { children: ReactNode }) {
  const accessToken = useRequiredAccessToken();
  const queryClient = useQueryClient();

  const {
    data: homeSpreadsheetId,
    isPending: isSpreadsheetPending,
    isError: isSpreadsheetError,
    error: spreadsheetError,
  } = useQuery({
    queryKey: ["portfolio", "spreadsheetId"],
    queryFn: () => ensurePortfolioSpreadsheet(accessToken),
    staleTime: Infinity,
    retry: false,
  });

  // Never persisted, and always re-initialized to null on mount — a
  // fresh sign-in always lands on your own portfolio, per your explicit
  // call, rather than remembering the last-viewed one.
  const [activeConnectionId, setActiveConnectionId] = useState<
    string | null
  >(null);

  const { data: connectedPortfolios } = useQuery({
    queryKey: queryKeys.connectedPortfolios.list(),
    queryFn: () =>
      listConnectedPortfolios(accessToken, homeSpreadsheetId!),
    enabled: homeSpreadsheetId !== undefined,
    staleTime: Infinity,
  });

  const activeConnection = activeConnectionId
    ? (connectedPortfolios ?? []).find(
        (c) => c.connectionId === activeConnectionId,
      )
    : undefined;
  // Falls back to home if the selected connection ever disappears (e.g.
  // stale state after data reloads) — never gets stuck pointed at
  // nothing.
  const activeSpreadsheetId =
    activeConnection?.spreadsheetId ?? homeSpreadsheetId;

  const {
    data: settings,
    isPending: isSettingsPending,
    isError: isSettingsError,
    error: settingsError,
  } = useQuery({
    queryKey: ["portfolio", "settings", activeSpreadsheetId],
    queryFn: () => getSettings(accessToken, activeSpreadsheetId!),
    enabled: activeSpreadsheetId !== undefined,
    staleTime: Infinity,
    retry: false,
  });

  const onboarding = useMutation({
    mutationFn: (chosen: Settings) =>
      applyOnboarding(accessToken, homeSpreadsheetId!, chosen),
    onSuccess: (_data, chosen) => {
      queryClient.setQueryData(
        ["portfolio", "settings", homeSpreadsheetId],
        chosen,
      );
      // Categories may have just been seeded for the first time.
      void queryClient.invalidateQueries({
        queryKey: queryKeys.categories.all,
      });
    },
  });

  if (
    isSpreadsheetPending ||
    (activeSpreadsheetId !== undefined && isSettingsPending)
  ) {
    return <p>Setting up your portfolio…</p>;
  }

  if (isSpreadsheetError) {
    return (
      <p role="alert">
        {spreadsheetError instanceof Error
          ? spreadsheetError.message
          : "Failed to load your portfolio."}
      </p>
    );
  }

  if (isSettingsError) {
    if (activeConnection) {
      return (
        <ConnectedPortfolioIssue
          message={
            settingsError instanceof Error
              ? `${activeConnection.label}: ${settingsError.message}`
              : `Failed to load ${activeConnection.label}.`
          }
          onBack={() => setActiveConnectionId(null)}
        />
      );
    }
    return (
      <p role="alert">
        {settingsError instanceof Error
          ? settingsError.message
          : "Failed to load your account settings."}
      </p>
    );
  }

  if (!settings) {
    // Onboarding only ever applies to your OWN portfolio — a connected
    // portfolio without settings yet is a real error (someone else's
    // account never finished setup), not something this account can fix
    // by picking a language here.
    if (activeConnection) {
      return (
        <ConnectedPortfolioIssue
          message={`${activeConnection.label} hasn't finished setup yet — its owner needs to sign in and choose a language/currency first.`}
          onBack={() => setActiveConnectionId(null)}
        />
      );
    }
    return (
      <OnboardingPicker
        isSubmitting={onboarding.isPending}
        error={
          onboarding.error instanceof Error ? onboarding.error.message : null
        }
        onSubmit={(chosen) => onboarding.mutate(chosen)}
      />
    );
  }

  return (
    <PortfolioContext.Provider
      value={{
        spreadsheetId: activeSpreadsheetId!,
        settings,
        homeSpreadsheetId: homeSpreadsheetId!,
        activeLabel: activeConnection?.label ?? null,
        activeConnectionId: activeConnection?.connectionId ?? null,
        connectedPortfolios: connectedPortfolios ?? [],
        switchToHome: () => setActiveConnectionId(null),
        switchToPortfolio: (connectionId) =>
          setActiveConnectionId(connectionId),
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}
