import { appendValues, getValues } from "../api/sheets/client";
import { normalizeSheetDate } from "../lib/sheetDate";
import type { Expense, ExpenseSource } from "../types";

// Matches the Expenses tab shape in PRD §8. Row 1 is the header (written
// once in data/portfolio.ts), data starts at row 2. Unlike Properties, rows
// are never rewritten in place for v1 (no edit/delete of saved expenses yet
// — PRD §7 "should-have"), so this module is append/read only. (The
// category-name-to-ID migration in data/portfolio.ts is the one exception
// that does rewrite existing rows, but that's a one-time migration, not
// part of this module's normal read/write path.)
const SHEET_NAME = "Expenses";
const DATA_RANGE = `${SHEET_NAME}!A2:K`;

function rowToExpense(row: unknown[]): Expense {
  const [
    expenseId,
    propertyId,
    amount,
    date,
    vendor,
    categoryId,
    receiptDriveUrl,
    source,
    createdAt,
    editedAt,
    notes,
  ] = row as [
    string,
    string,
    number,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
  ];
  return {
    expenseId,
    propertyId,
    amount: Number(amount) || 0,
    date: normalizeSheetDate(date),
    vendor,
    categoryId,
    receiptDriveUrl: receiptDriveUrl || undefined,
    source: source === "manual" ? "manual" : "ocr",
    createdAt,
    editedAt: editedAt || undefined,
    notes: notes || undefined,
  };
}

function expenseToRow(expense: Expense): unknown[] {
  return [
    expense.expenseId,
    expense.propertyId,
    expense.amount,
    expense.date,
    expense.vendor,
    expense.categoryId,
    expense.receiptDriveUrl ?? "",
    expense.source,
    expense.createdAt,
    expense.editedAt ?? "",
    expense.notes ?? "",
  ];
}

export async function listExpenses(
  accessToken: string,
  spreadsheetId: string,
): Promise<Expense[]> {
  const { values } = await getValues(accessToken, spreadsheetId, DATA_RANGE);
  return (values ?? [])
    .filter((row) => Array.isArray(row) && row[0])
    .map(rowToExpense);
}

export interface CreateExpenseInput {
  propertyId: string;
  amount: number;
  date: string;
  vendor: string;
  categoryId: string;
  receiptDriveUrl?: string;
  source: ExpenseSource;
  notes?: string;
}

export async function createExpense(
  accessToken: string,
  spreadsheetId: string,
  input: CreateExpenseInput,
): Promise<Expense> {
  const expense: Expense = {
    expenseId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  };
  await appendValues(accessToken, spreadsheetId, DATA_RANGE, [
    expenseToRow(expense),
  ]);
  return expense;
}
