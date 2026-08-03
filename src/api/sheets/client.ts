import { authorizedFetchJson } from "../http";

const SHEETS_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

export interface ValueRange {
  range: string;
  majorDimension?: "ROWS" | "COLUMNS";
  values?: unknown[][];
}

export interface Spreadsheet {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

// Creates a new spreadsheet with the given sheet (tab) titles, e.g.
// createSpreadsheet(token, 'My Portfolio', ['Properties', 'Expenses']).
export function createSpreadsheet(
  accessToken: string,
  title: string,
  sheetTitles: string[],
): Promise<Spreadsheet> {
  return authorizedFetchJson<Spreadsheet>(accessToken, SHEETS_BASE, {
    method: "POST",
    body: JSON.stringify({
      properties: { title },
      sheets: sheetTitles.map((sheetTitle) => ({
        properties: { title: sheetTitle },
      })),
    }),
  });
}

export function getValues(
  accessToken: string,
  spreadsheetId: string,
  range: string,
): Promise<ValueRange> {
  // UNFORMATTED_VALUE avoids locale-formatted strings (e.g. "1,234.56") for
  // numeric columns like Expenses.amount — return raw numbers instead.
  const url = `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueRenderOption=UNFORMATTED_VALUE`;
  return authorizedFetchJson<ValueRange>(accessToken, url);
}

// Appends rows after the last row of data in `range`'s sheet.
export function appendValues(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: unknown[][],
): Promise<unknown> {
  const url = `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;
  return authorizedFetchJson(accessToken, url, {
    method: "POST",
    body: JSON.stringify({ range, values }),
  });
}

// Overwrites the cells in `range` — used for edits (e.g. archiving a
// property, correcting an expense) rather than appending new rows.
export function updateValues(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: unknown[][],
): Promise<unknown> {
  const url = `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  return authorizedFetchJson(accessToken, url, {
    method: "PUT",
    body: JSON.stringify({ range, values }),
  });
}
