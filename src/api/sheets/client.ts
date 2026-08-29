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

// Lightweight metadata-only read (no cell data) — used to detect whether a
// spreadsheet created by an older app version is missing a tab a newer
// version expects, so it can be migrated in place.
export async function getSheetTitles(
  accessToken: string,
  spreadsheetId: string,
): Promise<string[]> {
  const url = `${SHEETS_BASE}/${spreadsheetId}?fields=sheets.properties.title`;
  const { sheets } = await authorizedFetchJson<{
    sheets: { properties: { title: string } }[];
  }>(accessToken, url);
  return sheets.map((sheet) => sheet.properties.title);
}

// Adds a new tab to an already-existing spreadsheet — for migrating a
// spreadsheet created before this tab existed, as opposed to
// createSpreadsheet's initial full set on brand-new accounts.
export function addSheet(
  accessToken: string,
  spreadsheetId: string,
  title: string,
): Promise<unknown> {
  const url = `${SHEETS_BASE}/${spreadsheetId}:batchUpdate`;
  return authorizedFetchJson(accessToken, url, {
    method: "POST",
    body: JSON.stringify({
      requests: [{ addSheet: { properties: { title } } }],
    }),
  });
}

// deleteDimension needs the tab's numeric sheetId, not its title.
async function getSheetId(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string,
): Promise<number> {
  const url = `${SHEETS_BASE}/${spreadsheetId}?fields=sheets.properties`;
  const { sheets } = await authorizedFetchJson<{
    sheets: { properties: { sheetId: number; title: string } }[];
  }>(accessToken, url);
  const sheet = sheets.find((s) => s.properties.title === sheetTitle);
  if (!sheet) {
    throw new Error(`Sheet "${sheetTitle}" not found`);
  }
  return sheet.properties.sheetId;
}

// Permanently removes one row (1-indexed, matching the row numbers
// data/*.ts's findXRowNumber helpers already compute) — used for actual
// deletion (as opposed to updateValues, which is for edits/archiving) and
// deliberately not exposed for bulk ranges since every caller today
// deletes exactly one located row at a time.
export async function deleteRow(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string,
  rowNumber: number,
): Promise<unknown> {
  const sheetId = await getSheetId(accessToken, spreadsheetId, sheetTitle);
  const url = `${SHEETS_BASE}/${spreadsheetId}:batchUpdate`;
  return authorizedFetchJson(accessToken, url, {
    method: "POST",
    body: JSON.stringify({
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: rowNumber - 1,
              endIndex: rowNumber,
            },
          },
        },
      ],
    }),
  });
}
