import type { ClosedYear } from "../types";

// The one guarantee the year-close feature (issue #10) exists to make:
// once a year is closed, nothing dated within it can be added, edited, or
// deleted. `date` is a normalized "YYYY-MM-DD" sheet date (see
// lib/sheetDate.ts) — the year is just its first 4 characters, same
// extraction SummarySection's own year list already uses.
export function isYearClosed(closedYears: ClosedYear[], date: string): boolean {
  const year = Number(date.slice(0, 4));
  return closedYears.some((closedYear) => closedYear.year === year);
}
