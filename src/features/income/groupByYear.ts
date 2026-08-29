import type { Income } from "../../types";

export interface MonthGroup {
  month: string; // "YYYY-MM"
  total: number;
  entries: Income[]; // newest first within the month
}

export interface YearGroup {
  year: number;
  total: number;
  count: number;
  months: MonthGroup[]; // newest month first
}

// Pure display-grouping for the Income screen (issue #11): year, then
// month within year, most-recent first at both levels. A month with more
// than one payment stays a single MonthGroup so the UI can collapse it
// into one summary line ("(N payments)") rather than listing each
// separately — see ClosedYearsSection-style totals, this is the one piece
// of the grouping that computes real money sums, so it gets its own tests.
export function groupIncomeByYear(income: Income[]): YearGroup[] {
  const byYear = new Map<number, Income[]>();
  for (const entry of income) {
    const year = Number(entry.date.slice(0, 4));
    const existing = byYear.get(year);
    if (existing) {
      existing.push(entry);
    } else {
      byYear.set(year, [entry]);
    }
  }

  const years = Array.from(byYear.entries()).map(([year, entries]) => {
    const byMonth = new Map<string, Income[]>();
    for (const entry of entries) {
      const month = entry.date.slice(0, 7);
      const existing = byMonth.get(month);
      if (existing) {
        existing.push(entry);
      } else {
        byMonth.set(month, [entry]);
      }
    }

    const months: MonthGroup[] = Array.from(byMonth.entries())
      .map(([month, monthEntries]) => ({
        month,
        total: monthEntries.reduce((sum, entry) => sum + entry.amount, 0),
        entries: [...monthEntries].sort((a, b) => (a.date < b.date ? 1 : -1)),
      }))
      .sort((a, b) => (a.month < b.month ? 1 : -1));

    const yearGroup: YearGroup = {
      year,
      total: entries.reduce((sum, entry) => sum + entry.amount, 0),
      count: entries.length,
      months,
    };
    return yearGroup;
  });

  return years.sort((a, b) => b.year - a.year);
}
