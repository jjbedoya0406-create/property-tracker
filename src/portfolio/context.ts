import { createContext, useContext } from "react";
import type { ConnectedPortfolio, Settings } from "../types";

export interface PortfolioContextValue {
  // The ACTIVE spreadsheet — every feature hook (useProperties,
  // useExpenses, ...) reads this, so switching portfolios here is
  // sufficient to redirect the whole app with no changes elsewhere.
  spreadsheetId: string;
  // The ACTIVE spreadsheet's own Settings row — not always the signed-in
  // account's own, so viewing a connected portfolio shows *its*
  // language/currency (issue #3).
  settings: Settings;
  homeSpreadsheetId: string;
  // null = viewing your own portfolio; otherwise the connected
  // portfolio's label, e.g. "Mom's portfolio".
  activeLabel: string | null;
  // Paired with activeLabel — lets the switcher UI match the active row
  // by id rather than by label text (labels aren't guaranteed unique).
  activeConnectionId: string | null;
  connectedPortfolios: ConnectedPortfolio[];
  switchToHome: () => void;
  switchToPortfolio: (connectionId: string) => void;
}

export const PortfolioContext = createContext<PortfolioContextValue | null>(
  null,
);

function usePortfolio(): PortfolioContextValue {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error("usePortfolio must be used within RequirePortfolio");
  }
  return context;
}

export function useSpreadsheetId(): string {
  return usePortfolio().spreadsheetId;
}

export function useSettings(): Settings {
  return usePortfolio().settings;
}

// Always the signed-in account's OWN spreadsheet, regardless of which
// portfolio is currently active — ConnectedPortfolios (issue #3) only
// ever lives here, never in a connected portfolio's spreadsheet.
export function useHomeSpreadsheetId(): string {
  return usePortfolio().homeSpreadsheetId;
}

// Everything needed to render/drive the portfolio switcher (More sheet's
// Portfolio section, the top-bar pill) — issue #3.
// Non-throwing, unlike usePortfolio()/usePortfolioSwitcher() — Layout's
// top-bar pill renders outside RequirePortfolio's provider (it also
// wraps /sign-in), so it needs null rather than a crash when there's no
// active portfolio context yet.
export function useActivePortfolioLabel(): string | null {
  return useContext(PortfolioContext)?.activeLabel ?? null;
}

export function usePortfolioSwitcher() {
  const {
    activeLabel,
    activeConnectionId,
    connectedPortfolios,
    switchToHome,
    switchToPortfolio,
  } = usePortfolio();
  return {
    isHome: activeLabel === null,
    activeLabel,
    activeConnectionId,
    connectedPortfolios,
    switchToHome,
    switchToPortfolio,
  };
}
