import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useRequiredAccessToken } from "../auth";
import { queryKeys } from "../api/queryKeys";
import { applyOnboarding, ensurePortfolioSpreadsheet } from "../data/portfolio";
import { getSettings } from "../data/settings";
import type { Settings } from "../types";
import { OnboardingPicker } from "./OnboardingPicker";
import { PortfolioContext } from "./context";

// Sits inside ProtectedRoute: resolves (or creates, on first sign-in) the
// user's spreadsheet before rendering any property/expense UI (Story
// 1.1), then resolves account Settings — showing a one-time onboarding
// picker if the account hasn't chosen a language/currency yet (Outcome 5).
export function RequirePortfolio({ children }: { children: ReactNode }) {
  const accessToken = useRequiredAccessToken();
  const queryClient = useQueryClient();

  const {
    data: spreadsheetId,
    isPending: isSpreadsheetPending,
    isError: isSpreadsheetError,
    error: spreadsheetError,
  } = useQuery({
    queryKey: ["portfolio", "spreadsheetId"],
    queryFn: () => ensurePortfolioSpreadsheet(accessToken),
    staleTime: Infinity,
    retry: false,
  });

  const {
    data: settings,
    isPending: isSettingsPending,
    isError: isSettingsError,
    error: settingsError,
  } = useQuery({
    queryKey: ["portfolio", "settings"],
    queryFn: () => getSettings(accessToken, spreadsheetId!),
    enabled: spreadsheetId !== undefined,
    staleTime: Infinity,
    retry: false,
  });

  const onboarding = useMutation({
    mutationFn: (chosen: Settings) =>
      applyOnboarding(accessToken, spreadsheetId!, chosen),
    onSuccess: (_data, chosen) => {
      queryClient.setQueryData(["portfolio", "settings"], chosen);
      // Categories may have just been seeded for the first time.
      void queryClient.invalidateQueries({
        queryKey: queryKeys.categories.all,
      });
    },
  });

  if (
    isSpreadsheetPending ||
    (spreadsheetId !== undefined && isSettingsPending)
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
    return (
      <p role="alert">
        {settingsError instanceof Error
          ? settingsError.message
          : "Failed to load your account settings."}
      </p>
    );
  }

  if (!settings) {
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
      value={{ spreadsheetId: spreadsheetId!, settings }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}
