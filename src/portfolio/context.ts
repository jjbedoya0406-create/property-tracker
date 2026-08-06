import { createContext, useContext } from "react";
import type { Settings } from "../types";

export interface PortfolioContextValue {
  spreadsheetId: string;
  settings: Settings;
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
