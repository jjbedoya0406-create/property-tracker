import { appendValues, deleteRow, getValues, updateValues } from "../api/sheets/client";
import { normalizeSheetDate } from "../lib/sheetDate";
import type { Expense, ExpenseSource } from "../types";

// Matches the Expenses tab shape in PRD §8. Row 1 is the header (written
// once in data/portfolio.ts), data starts at row 2.
const SHEET_NAME = "Expenses";
const DATA_RANGE = `${SHEET_NAME}!A2:L`;

function rowToExpense(row: unknown[]): Expense {
  const [
    expenseId,
    propertyId,
    amount,
    date,
    // Column E (vendor) is skipped — kept in the sheet only to avoid
    // shifting every later column, but its data is purged (issue #6, see
    // purgeExpenseVendorData in data/portfolio.ts) and the app no longer
    // reads or shows it.
    ,
    categoryId,
    receiptDriveUrl,
    source,
    createdAt,
    editedAt,
    notes,
    buildingId,
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
    string,
  ];
  return {
    expenseId,
    // Exactly one of these is ever populated (issue #7) — a unit-scoped
    // row has propertyId and a blank building_id cell, a building-scoped
    // row has buildingId and a blank property_id cell.
    propertyId: propertyId || undefined,
    buildingId: buildingId || undefined,
    amount: Number(amount) || 0,
    date: normalizeSheetDate(date),
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
    expense.propertyId ?? "",
    expense.amount,
    expense.date,
    "", // vendor column — kept for layout, no longer written (issue #6)
    expense.categoryId,
    expense.receiptDriveUrl ?? "",
    expense.source,
    expense.createdAt,
    expense.editedAt ?? "",
    expense.notes ?? "",
    expense.buildingId ?? "",
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
  // Exactly one of these must be set — see Expense's own comment.
  propertyId?: string;
  buildingId?: string;
  amount: number;
  date: string;
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

// Sheets edits target a row number, not an ID, so every write first locates
// the expense's current row — same tradeoff as categories.ts/properties.ts.
async function findExpenseRowNumber(
  accessToken: string,
  spreadsheetId: string,
  expenseId: string,
): Promise<number> {
  const { values } = await getValues(accessToken, spreadsheetId, DATA_RANGE);
  const index = (values ?? []).findIndex((row) => row[0] === expenseId);
  if (index === -1) {
    throw new Error(`Expense ${expenseId} not found`);
  }
  return index + 2; // +1 for 1-indexing, +1 for the header row
}

export async function updateExpense(
  accessToken: string,
  spreadsheetId: string,
  expense: Expense,
): Promise<void> {
  const rowNumber = await findExpenseRowNumber(
    accessToken,
    spreadsheetId,
    expense.expenseId,
  );
  await updateValues(
    accessToken,
    spreadsheetId,
    `${SHEET_NAME}!A${rowNumber}:L${rowNumber}`,
    [expenseToRow({ ...expense, editedAt: new Date().toISOString() })],
  );
}

// Hard delete, not archive — unlike categories/properties, nothing else
// ever references an expense by ID, so there's no dangling-reference
// reason to keep a hidden row around (confirmed with Jason for issue #10).
export async function deleteExpense(
  accessToken: string,
  spreadsheetId: string,
  expenseId: string,
): Promise<void> {
  const rowNumber = await findExpenseRowNumber(
    accessToken,
    spreadsheetId,
    expenseId,
  );
  await deleteRow(accessToken, spreadsheetId, SHEET_NAME, rowNumber);
}
