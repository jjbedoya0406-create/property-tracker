import { appendValues, getValues } from "../api/sheets/client";
import { normalizeSheetDate } from "../lib/sheetDate";
import type { Income } from "../types";

// Matches the Income tab shape (PRD §7, Outcome 6): income_id, property_id,
// amount, date, notes, created_at. Row 1 is the header (written once in
// data/portfolio.ts), data starts at row 2. Append/read only for v1, same
// as expenses.ts — no edit/delete of a logged payment yet.
const SHEET_NAME = "Income";
const DATA_RANGE = `${SHEET_NAME}!A2:F`;

function rowToIncome(row: unknown[]): Income {
  const [incomeId, propertyId, amount, date, notes, createdAt] = row as [
    string,
    string,
    number,
    string,
    string,
    string,
  ];
  return {
    incomeId,
    propertyId,
    amount: Number(amount) || 0,
    date: normalizeSheetDate(date),
    notes: notes || undefined,
    createdAt,
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
