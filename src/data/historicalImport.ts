import type { Building } from "../types/building";
import type { Category } from "../types/category";
import type { Property } from "../types/property";
import type { CreateExpenseInput } from "./expenses";
import { createExpenses } from "./expenses";
import type { CreateIncomeInput } from "./income";
import { createIncomes } from "./income";

const SPANISH_MONTHS: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
};

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

function parseMonthNumber(monthLabel: string): number {
  const match = monthLabel.trim().match(/^([A-Za-zÀ-ÿ]+)/);
  const monthNumber = match ? SPANISH_MONTHS[normalize(match[1])] : undefined;
  if (!monthNumber) {
    throw new Error(`Unrecognized month label: "${monthLabel}"`);
  }
  return monthNumber;
}

// read-excel-file constructs Date cells in UTC, so UTC getters (not local
// ones) are what actually reproduce the calendar date shown in Excel —
// local getters silently shift by a day in timezones east of UTC.
function toIsoDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// This source file stores its Date column as plain text (e.g.
// "2026-01-02"), not real Excel date-formatted cells — confirmed via a
// direct read during issue #5's Step 0. read-excel-file only returns a
// `Date` object for the latter, so a text cell arrives here as a string.
// Handle both, without ever routing an ISO string through Date's
// timezone-sensitive parsing.
function resolveDate(rawDate: unknown): string | undefined {
  if (rawDate instanceof Date) {
    return toIsoDate(rawDate);
  }
  if (typeof rawDate === "string") {
    const match = rawDate.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
  }
  return undefined;
}

export interface RawImportRow {
  date: string;
  dateWasAssumed: boolean;
  type: "income" | "expense";
  scope: "unit" | "building";
  unit: string;
  category: string;
  amount: number;
  notes?: string;
  needsReview: boolean;
}

// The "Transactions" sheet is already a single, pre-cleaned table (not raw
// per-month tabs) — see issue #5's Step 0. Two things this still has to
// handle itself: a handful of rows with no Date at all (defaulted to the
// 1st of their stated Month, since the app's Income/Expense schemas both
// require a date), and $0 "Desocupado" (vacant-unit) Income rows, which
// aren't real transactions and are dropped outright rather than imported
// as a zero-amount entry (which the app's own amount>0 validation would
// reject anyway).
export function parseTransactionsSheet(sheetRows: unknown[][]): RawImportRow[] {
  const dataRows = sheetRows.slice(1);

  function inferYear(monthLabel: string): number {
    for (const row of dataRows) {
      const [date, month] = row;
      if (month === monthLabel) {
        const resolved = resolveDate(date);
        if (resolved) return Number(resolved.slice(0, 4));
      }
    }
    throw new Error(
      `Cannot infer a year for month "${monthLabel}" — no row in this month has a real date`,
    );
  }

  const result: RawImportRow[] = [];
  for (const row of dataRows) {
    const [rawDate, month, rawType, scope, unit, category, amount, notes, needsReview] =
      row as [
        unknown,
        string,
        string,
        "unit" | "building",
        string,
        string,
        number,
        string | undefined,
        string | undefined,
      ];

    const type = rawType.toLowerCase() as "income" | "expense";
    if (type === "income" && (!amount || amount <= 0)) {
      // Vacant-unit placeholder ("Desocupado") — not a transaction.
      continue;
    }

    const resolvedDate = resolveDate(rawDate);
    const dateWasAssumed = resolvedDate === undefined;
    const date = dateWasAssumed
      ? `${inferYear(month)}-${String(parseMonthNumber(month)).padStart(2, "0")}-01`
      : resolvedDate;

    result.push({
      date,
      dateWasAssumed,
      type,
      scope,
      unit: String(unit).trim(),
      category: String(category).trim(),
      amount,
      notes: notes || undefined,
      needsReview: normalize(needsReview ?? "") === "yes",
    });
  }
  return result;
}

export interface MonthlySummaryRow {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export function parseMonthlySummarySheet(
  sheetRows: unknown[][],
): MonthlySummaryRow[] {
  return sheetRows
    .slice(1)
    .filter((row) => row[0] && row[0] !== "Total")
    .map((row) => {
      const [month, income, expenses, net] = row as [
        string,
        number,
        number,
        number,
      ];
      return { month, income, expenses, net };
    });
}

export interface ResolvedRow extends RawImportRow {
  matchedPropertyId?: string;
  matchedBuildingId?: string;
  // Only set for expense rows — Income has no categoryId in this app's
  // data model, so an income row (e.g. "Rent") never needs a category
  // match at all.
  matchedCategoryId?: string;
}

export interface UnresolvedIdentifier {
  kind: "unit" | "building" | "category";
  sourceValue: string;
  rowCount: number;
}

export interface IdentifierOverrides {
  units?: Record<string, string>;
  building?: string;
  categories?: Record<string, string>;
}

export interface MatchResult {
  resolved: ResolvedRow[];
  unresolved: UnresolvedIdentifier[];
}

function matchUnit(
  unit: string,
  properties: Property[],
  override?: string,
): string | undefined {
  if (override) return override;
  const wordBoundary = new RegExp(`\\b${unit}\\b`);
  const matches = properties.filter((p) => wordBoundary.test(p.name));
  return matches.length === 1 ? matches[0].propertyId : undefined;
}

function matchBuilding(
  buildings: Building[],
  override?: string,
): string | undefined {
  if (override) return override;
  return buildings.length === 1 ? buildings[0].buildingId : undefined;
}

function matchCategory(
  categoryName: string,
  categories: Category[],
  override?: string,
): string | undefined {
  if (override) return override;
  const target = normalize(categoryName);
  const match = categories.find((c) => normalize(c.name) === target);
  return match?.categoryId;
}

// Never auto-creates a Property/Category/Building — every source
// identifier either resolves to exactly one existing record or is
// reported as unresolved for the caller to map manually (or explicitly
// skip). Silently guessing a match is the duplicate-data risk issue #5
// itself calls out.
export function matchIdentifiers(
  rows: RawImportRow[],
  properties: Property[],
  categories: Category[],
  buildings: Building[],
  overrides: IdentifierOverrides = {},
): MatchResult {
  const resolved: ResolvedRow[] = [];
  const unresolvedCounts = new Map<string, UnresolvedIdentifier>();

  function flagUnresolved(kind: UnresolvedIdentifier["kind"], sourceValue: string) {
    const key = `${kind}:${sourceValue}`;
    const existing = unresolvedCounts.get(key);
    if (existing) {
      existing.rowCount += 1;
    } else {
      unresolvedCounts.set(key, { kind, sourceValue, rowCount: 1 });
    }
  }

  for (const row of rows) {
    // Income has no categoryId in this app's data model — only expense
    // rows need a category match at all.
    const matchedCategoryId =
      row.type === "expense"
        ? matchCategory(row.category, categories, overrides.categories?.[row.category])
        : undefined;

    let matchedPropertyId: string | undefined;
    let matchedBuildingId: string | undefined;
    if (row.scope === "unit") {
      matchedPropertyId = matchUnit(
        row.unit,
        properties,
        overrides.units?.[row.unit],
      );
    } else {
      matchedBuildingId = matchBuilding(buildings, overrides.building);
    }

    const identifierUnresolved =
      (row.scope === "unit" && !matchedPropertyId) ||
      (row.scope === "building" && !matchedBuildingId);
    const categoryUnresolved = row.type === "expense" && !matchedCategoryId;

    if (identifierUnresolved) {
      flagUnresolved(row.scope === "unit" ? "unit" : "building", row.unit);
    }
    if (categoryUnresolved) {
      flagUnresolved("category", row.category);
    }
    if (identifierUnresolved || categoryUnresolved) {
      continue;
    }

    resolved.push({
      ...row,
      matchedPropertyId,
      matchedBuildingId,
      matchedCategoryId,
    });
  }

  return { resolved, unresolved: [...unresolvedCounts.values()] };
}

export function buildImportRows(resolved: ResolvedRow[]): {
  expenseInputs: CreateExpenseInput[];
  incomeInputs: CreateIncomeInput[];
} {
  const expenseInputs: CreateExpenseInput[] = [];
  const incomeInputs: CreateIncomeInput[] = [];

  for (const row of resolved) {
    if (row.type === "income") {
      incomeInputs.push({
        propertyId: row.matchedPropertyId!,
        amount: row.amount,
        date: row.date,
        notes: row.notes,
      });
    } else {
      expenseInputs.push({
        propertyId: row.matchedPropertyId,
        buildingId: row.matchedBuildingId,
        amount: row.amount,
        date: row.date,
        categoryId: row.matchedCategoryId!,
        source: "manual",
        notes: row.notes,
      });
    }
  }

  return { expenseInputs, incomeInputs };
}

export interface ReconciliationRow {
  month: string;
  expectedIncome: number;
  expectedExpenses: number;
  expectedNet: number;
  computedIncome: number;
  computedExpenses: number;
  computedNet: number;
  incomeDelta: number;
  expensesDelta: number;
  netDelta: number;
}

const SPANISH_MONTH_NAMES = Object.keys(SPANISH_MONTHS);

function monthNameFromIsoDate(isoDate: string): string {
  const monthNumber = Number(isoDate.slice(5, 7));
  const name = SPANISH_MONTH_NAMES.find((n) => SPANISH_MONTHS[n] === monthNumber)!;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function computeReconciliation(
  expenseInputs: CreateExpenseInput[],
  incomeInputs: CreateIncomeInput[],
  summary: MonthlySummaryRow[],
): ReconciliationRow[] {
  const computedIncomeByMonth = new Map<string, number>();
  const computedExpensesByMonth = new Map<string, number>();

  for (const income of incomeInputs) {
    const month = monthNameFromIsoDate(income.date);
    computedIncomeByMonth.set(
      month,
      (computedIncomeByMonth.get(month) ?? 0) + income.amount,
    );
  }
  for (const expense of expenseInputs) {
    const month = monthNameFromIsoDate(expense.date);
    computedExpensesByMonth.set(
      month,
      (computedExpensesByMonth.get(month) ?? 0) + expense.amount,
    );
  }

  return summary.map((row) => {
    const monthKey = normalize(row.month);
    const matchedMonthName =
      [...computedIncomeByMonth.keys(), ...computedExpensesByMonth.keys()].find(
        (m) => normalize(m) === monthKey,
      ) ?? row.month;
    const computedIncome = computedIncomeByMonth.get(matchedMonthName) ?? 0;
    const computedExpenses = computedExpensesByMonth.get(matchedMonthName) ?? 0;
    const computedNet = computedIncome - computedExpenses;
    return {
      month: row.month,
      expectedIncome: row.income,
      expectedExpenses: row.expenses,
      expectedNet: row.net,
      computedIncome,
      computedExpenses,
      computedNet,
      incomeDelta: computedIncome - row.income,
      expensesDelta: computedExpenses - row.expenses,
      netDelta: computedNet - row.net,
    };
  });
}

export interface HistoricalImportPlan {
  resolved: ResolvedRow[];
  unresolved: UnresolvedIdentifier[];
  reconciliation: ReconciliationRow[];
  needsReviewCount: number;
}

const TRANSACTIONS_SHEET = "Transactions";
const MONTHLY_SUMMARY_SHEET = "Monthly Summary";

export async function planHistoricalImport(
  file: File,
  properties: Property[],
  categories: Category[],
  buildings: Building[],
  overrides: IdentifierOverrides = {},
): Promise<HistoricalImportPlan> {
  const { readSheet } = await import("read-excel-file/browser");
  const [transactionRows, summaryRows] = await Promise.all([
    readSheet(file, TRANSACTIONS_SHEET),
    readSheet(file, MONTHLY_SUMMARY_SHEET),
  ]);

  const rows = parseTransactionsSheet(transactionRows);
  const summary = parseMonthlySummarySheet(summaryRows);
  const { resolved, unresolved } = matchIdentifiers(
    rows,
    properties,
    categories,
    buildings,
    overrides,
  );
  const { expenseInputs, incomeInputs } = buildImportRows(resolved);
  const reconciliation = computeReconciliation(expenseInputs, incomeInputs, summary);
  const needsReviewCount = resolved.filter((r) => r.needsReview).length;

  return { resolved, unresolved, reconciliation, needsReviewCount };
}

export async function runHistoricalImport(
  accessToken: string,
  spreadsheetId: string,
  plan: HistoricalImportPlan,
): Promise<void> {
  const { expenseInputs, incomeInputs } = buildImportRows(plan.resolved);
  await Promise.all([
    expenseInputs.length > 0
      ? createExpenses(accessToken, spreadsheetId, expenseInputs)
      : Promise.resolve([]),
    incomeInputs.length > 0
      ? createIncomes(accessToken, spreadsheetId, incomeInputs)
      : Promise.resolve([]),
  ]);
}
