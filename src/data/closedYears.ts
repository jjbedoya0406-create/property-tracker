import { appendValues, getValues } from "../api/sheets/client";
import type { ClosedYear } from "../types";

// Matches the ClosedYears tab shape (issue #10): year, closed_at. Row 1 is
// the header (written once in data/portfolio.ts), data starts at row 2.
// Append/read only — closing is permanent, no reopen/rename/remove for v1.
const SHEET_NAME = "ClosedYears";
const DATA_RANGE = `${SHEET_NAME}!A2:B`;

function rowToClosedYear(row: unknown[]): ClosedYear {
  const [year, closedAt] = row as [number, string];
  return { year: Number(year), closedAt };
}

function closedYearToRow(closedYear: ClosedYear): unknown[] {
  return [closedYear.year, closedYear.closedAt];
}

export async function listClosedYears(
  accessToken: string,
  spreadsheetId: string,
): Promise<ClosedYear[]> {
  const { values } = await getValues(accessToken, spreadsheetId, DATA_RANGE);
  return (values ?? [])
    .filter((row) => Array.isArray(row) && row[0])
    .map(rowToClosedYear);
}

export async function closeYear(
  accessToken: string,
  spreadsheetId: string,
  year: number,
): Promise<ClosedYear> {
  const closedYear: ClosedYear = { year, closedAt: new Date().toISOString() };
  await appendValues(accessToken, spreadsheetId, DATA_RANGE, [
    closedYearToRow(closedYear),
  ]);
  return closedYear;
}
