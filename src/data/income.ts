import { appendValues, deleteRow, getValues, updateValues } from "../api/sheets/client";
import { normalizeSheetDate } from "../lib/sheetDate";
import type { Income } from "../types";

// Matches the Income tab shape (PRD §7, Outcome 6; edited_at added for
// issue #10): income_id, property_id, amount, date, notes, created_at,
// edited_at. Row 1 is the header (written once in data/portfolio.ts),
// data starts at row 2.
const SHEET_NAME = "Income";
const DATA_RANGE = `${SHEET_NAME}!A2:G`;

function rowToIncome(row: unknown[]): Income {
  const [incomeId, propertyId, amount, date, notes, createdAt, editedAt] =
    row as [string, string, number, string, string, string, string];
  return {
    incomeId,
    propertyId,
    amount: Number(amount) || 0,
    date: normalizeSheetDate(date),
    notes: notes || undefined,
    createdAt,
    editedAt: editedAt || undefined,
  };
}

function incomeToRow(income: Income): unknown[] {
  return [
    income.incomeId,
    income.propertyId,
    income.amount,
    income.date,
    income.notes ?? "",
    income.createdAt,
    income.editedAt ?? "",
  ];
}

export async function listIncome(
  accessToken: string,
  spreadsheetId: string,
): Promise<Income[]> {
  const { values } = await getValues(accessToken, spreadsheetId, DATA_RANGE);
  return (values ?? [])
    .filter((row) => Array.isArray(row) && row[0])
    .map(rowToIncome);
}

export interface CreateIncomeInput {
  propertyId: string;
  amount: number;
  date: string;
  notes?: string;
}

export async function createIncome(
  accessToken: string,
  spreadsheetId: string,
  input: CreateIncomeInput,
): Promise<Income> {
  const income: Income = {
    incomeId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  };
  await appendValues(accessToken, spreadsheetId, DATA_RANGE, [
    incomeToRow(income),
  ]);
  return income;
}

// Bulk variant for the historical-data importer (issue #5) — dozens of
// rows land in one append call instead of one API call per row.
export async function createIncomes(
  accessToken: string,
  spreadsheetId: string,
  inputs: CreateIncomeInput[],
): Promise<Income[]> {
  const createdAt = new Date().toISOString();
  const incomeEntries: Income[] = inputs.map((input) => ({
    incomeId: crypto.randomUUID(),
    createdAt,
    ...input,
  }));
  await appendValues(
    accessToken,
    spreadsheetId,
    DATA_RANGE,
    incomeEntries.map(incomeToRow),
  );
  return incomeEntries;
}

// Sheets edits target a row number, not an ID, so every write first locates
// the entry's current row — same tradeoff as expenses.ts/categories.ts.
async function findIncomeRowNumber(
  accessToken: string,
  spreadsheetId: string,
  incomeId: string,
): Promise<number> {
  const { values } = await getValues(accessToken, spreadsheetId, DATA_RANGE);
  const index = (values ?? []).findIndex((row) => row[0] === incomeId);
  if (index === -1) {
    throw new Error(`Income entry ${incomeId} not found`);
  }
  return index + 2; // +1 for 1-indexing, +1 for the header row
}

export async function updateIncome(
  accessToken: string,
  spreadsheetId: string,
  income: Income,
): Promise<void> {
  const rowNumber = await findIncomeRowNumber(
    accessToken,
    spreadsheetId,
    income.incomeId,
  );
  await updateValues(
    accessToken,
    spreadsheetId,
    `${SHEET_NAME}!A${rowNumber}:G${rowNumber}`,
    [incomeToRow({ ...income, editedAt: new Date().toISOString() })],
  );
}

// Hard delete, not archive — same reasoning as expenses.ts: nothing else
// references an income entry by ID.
export async function deleteIncome(
  accessToken: string,
  spreadsheetId: string,
  incomeId: string,
): Promise<void> {
  const rowNumber = await findIncomeRowNumber(
    accessToken,
    spreadsheetId,
    incomeId,
  );
  await deleteRow(accessToken, spreadsheetId, SHEET_NAME, rowNumber);
}
