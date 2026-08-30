interface DatedAmount {
  date: string;
  amount: number;
}

function sumInMonth(entries: DatedAmount[], month: string): number {
  return entries
    .filter((entry) => entry.date.startsWith(month))
    .reduce((sum, entry) => sum + entry.amount, 0);
}

export interface PortfolioTotals {
  income: number;
  expenses: number;
}

// The income/expenses sub-totals behind the hero number's muted
// supporting line (issue #13 follow-up) — same scope/period as
// computePortfolioNet, just not netted together.
export function computePortfolioTotals(
  income: DatedAmount[],
  expenses: DatedAmount[],
  month: string,
): PortfolioTotals {
  return {
    income: sumInMonth(income, month),
    expenses: sumInMonth(expenses, month),
  };
}

// Portfolio-wide hero number (issue #13): income minus expenses across
// everything passed in — the caller decides scope (e.g. active
// properties' income plus every expense, including building-shared
// bills, which aren't tied to a single property).
export function computePortfolioNet(
  income: DatedAmount[],
  expenses: DatedAmount[],
  month: string,
): number {
  const totals = computePortfolioTotals(income, expenses, month);
  return totals.income - totals.expenses;
}

export type PropertyPreview =
  | { kind: "noActivity" }
  | { kind: "expensesOnly"; amount: number }
  | { kind: "net"; amount: number };

// Per-row preview (issue #13): a property/building with no income record
// at all (ever, not just this month — e.g. an owner-occupied primary
// residence) previews its expenses alone rather than a net that would
// always just equal negative expenses. Only actual rental
// properties/buildings preview a real net.
export function computePropertyPreview(
  income: DatedAmount[],
  expenses: DatedAmount[],
  hasEverHadIncome: boolean,
  month: string,
): PropertyPreview {
  const monthIncome = sumInMonth(income, month);
  const monthExpenses = sumInMonth(expenses, month);

  if (monthIncome === 0 && monthExpenses === 0) {
    return { kind: "noActivity" };
  }
  if (!hasEverHadIncome) {
    return { kind: "expensesOnly", amount: monthExpenses };
  }
  return { kind: "net", amount: monthIncome - monthExpenses };
}
