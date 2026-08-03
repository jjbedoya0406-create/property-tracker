import { createContext, useContext } from "react";

export const SpreadsheetIdContext = createContext<string | null>(null);

export function useSpreadsheetId(): string {
  const spreadsheetId = useContext(SpreadsheetIdContext);
  if (!spreadsheetId) {
    throw new Error("useSpreadsheetId must be used within RequirePortfolio");
  }
  return spreadsheetId;
}
