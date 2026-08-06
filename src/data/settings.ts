import { getSheetTitles, getValues, updateValues } from "../api/sheets/client";
import type { Settings } from "../types";

// Single-row tab (PRD §8: "One row per spreadsheet") — no ID needed, unlike
// Properties/Expenses/Categories.
const SHEET_NAME = "Settings";
const DATA_RANGE = `${SHEET_NAME}!A2:B2`;

// Returns null when the account hasn't completed onboarding yet — either
// because the Settings tab doesn't exist (pre-Outcome-5 spreadsheet, or a
// brand-new one before its first choice) or exists but has no data row.
// RequirePortfolio treats null as "show the onboarding picker".
export async function getSettings(
  accessToken: string,
  spreadsheetId: string,
): Promise<Settings | null> {
  const titles = await getSheetTitles(accessToken, spreadsheetId);
  if (!titles.includes(SHEET_NAME)) {
    return null;
  }

  const { values } = await getValues(accessToken, spreadsheetId, DATA_RANGE);
  const row = values?.[0];
  if (!row || !row[0]) {
    return null;
  }

  const [language, currency] = row as [string, string];
  return {
    language: language === "es" ? "es" : "en",
    currency: currency === "COP" ? "COP" : "USD",
  };
}

// For the Settings page, changing language/currency after onboarding — the
// tab is guaranteed to already exist by the time this is reachable, unlike
// applyOnboarding (data/portfolio.ts) which also creates it the first time.
export async function updateSettings(
  accessToken: string,
  spreadsheetId: string,
  settings: Settings,
): Promise<void> {
  await updateValues(accessToken, spreadsheetId, DATA_RANGE, [
    [settings.language, settings.currency],
  ]);
}
