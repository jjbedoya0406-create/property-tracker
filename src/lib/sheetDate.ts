// Google Sheets' UNFORMATTED_VALUE returns a serial day number (days since
// the Sheets epoch, 1899-12-30) for any cell Sheets auto-formatted as a
// Date — even when the app wrote a plain "YYYY-MM-DD" string, USER_ENTERED
// write mode lets Sheets reinterpret date-looking text on write. Normalize
// every date read back through this so date fields are always a plain
// "YYYY-MM-DD" string, never a number, regardless of how a given row's
// cell happens to be formatted.
const SHEETS_EPOCH_UTC_MS = Date.UTC(1899, 11, 30);
const MS_PER_DAY = 86400000;

export function normalizeSheetDate(value: unknown): string {
  if (typeof value === "number") {
    return new Date(SHEETS_EPOCH_UTC_MS + value * MS_PER_DAY)
      .toISOString()
      .slice(0, 10);
  }
  return typeof value === "string" ? value : "";
}
