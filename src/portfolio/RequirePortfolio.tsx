import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useRequiredAccessToken } from "../auth";
import { ensurePortfolioSpreadsheet } from "../data/portfolio";
import { SpreadsheetIdContext } from "./context";

// Sits inside ProtectedRoute: resolves (or creates, on first sign-in) the
// user's spreadsheet before rendering any property/expense UI, satisfying
// Story 1.1's "new user gets a spreadsheet created and lands in their
// (empty) portfolio" / "existing user loads their linked spreadsheet".
export function RequirePortfolio({ children }: { children: ReactNode }) {
  const accessToken = useRequiredAccessToken();

  const {
    data: spreadsheetId,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["portfolio", "spreadsheetId"],
    queryFn: () => ensurePortfolioSpreadsheet(accessToken),
    staleTime: Infinity,
    retry: false,
  });

  if (isPending) {
    return <p>Setting up your portfolio…</p>;
  }

  if (isError) {
    return (
      <p role="alert">
        {error instanceof Error
          ? error.message
          : "Failed to load your portfolio."}
      </p>
    );
  }

  return (
    <SpreadsheetIdContext.Provider value={spreadsheetId}>
      {children}
    </SpreadsheetIdContext.Provider>
  );
}
