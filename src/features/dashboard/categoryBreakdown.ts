const TOP_CATEGORIES_CAP = 4;

export interface CategoryBreakdownEntry {
  // null = the folded "Other" bucket — display-name/i18n resolution is
  // left to the caller, this stays free of any UI/translation concerns.
  categoryId: string | null;
  amount: number;
  // 0-100, rounded independently per entry — the set won't always sum to
  // exactly 100 (normal rounding behavior), only approximately.
  percent: number;
}

// The actual money math behind the Dashboard card (issue #4): sums this
// month's expenses per category, keeps the top 4 by amount, folds
// everything else into one "Other" entry. Pure — no i18n, no Category
// records, just categoryId/amount/date off each expense.
export function computeCategoryBreakdown(
  expenses: { categoryId: string; amount: number; date: string }[],
  month: string,
): CategoryBreakdownEntry[] {
  const monthExpenses = expenses.filter((e) => e.date.startsWith(month));
  const grandTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  if (grandTotal === 0) {
    return [];
  }

  const totalsByCategory = new Map<string, number>();
  for (const expense of monthExpenses) {
    totalsByCategory.set(
      expense.categoryId,
      (totalsByCategory.get(expense.categoryId) ?? 0) + expense.amount,
    );
  }

  const sorted = Array.from(totalsByCategory.entries())
    .map(([categoryId, amount]) => ({ categoryId, amount }))
    .sort((a, b) => b.amount - a.amount);

  const top = sorted.slice(0, TOP_CATEGORIES_CAP);
  const rest = sorted.slice(TOP_CATEGORIES_CAP);

  const entries: CategoryBreakdownEntry[] = top.map((c) => ({
    categoryId: c.categoryId,
    amount: c.amount,
    percent: Math.round((c.amount / grandTotal) * 100),
  }));

  if (rest.length > 0) {
    const otherAmount = rest.reduce((sum, c) => sum + c.amount, 0);
    entries.push({
      categoryId: null,
      amount: otherAmount,
      percent: Math.round((otherAmount / grandTotal) * 100),
    });
  }

  return entries;
}
