import { appendValues, getValues, updateValues } from "../api/sheets/client";
import { normalizeSheetDate } from "../lib/sheetDate";
import type { Tenancy } from "../types";

// Matches the Tenancies tab shape (PRD §7, Outcome 6): tenancy_id,
// property_id, contract_start, expected_end_date, actual_move_out_date,
// rent_rate, created_at. Row 1 is the header (written once in
// data/portfolio.ts), data starts at row 2. Supports update (unlike
// income.ts/expenses.ts) because actual_move_out_date is deliberately
// recorded later, after the tenancy row already exists.
const SHEET_NAME = "Tenancies";
const DATA_RANGE = `${SHEET_NAME}!A2:G`;

function rowToTenancy(row: unknown[]): Tenancy {
  const [
    tenancyId,
    propertyId,
    contractStart,
    expectedEndDate,
    actualMoveOutDate,
    rentRate,
    createdAt,
  ] = row as [string, string, string, string, string, number, string];
  const normalizedExpectedEnd = normalizeSheetDate(expectedEndDate);
  const normalizedMoveOut = normalizeSheetDate(actualMoveOutDate);
  return {
    tenancyId,
    propertyId,
    contractStart: normalizeSheetDate(contractStart),
    expectedEndDate: normalizedExpectedEnd || undefined,
    actualMoveOutDate: normalizedMoveOut || undefined,
    rentRate: Number(rentRate) || 0,
    createdAt,
  };
}

function tenancyToRow(tenancy: Tenancy): unknown[] {
  return [
    tenancy.tenancyId,
    tenancy.propertyId,
    tenancy.contractStart,
    tenancy.expectedEndDate ?? "",
    tenancy.actualMoveOutDate ?? "",
    tenancy.rentRate,
    tenancy.createdAt,
  ];
}

export async function listTenancies(
  accessToken: string,
  spreadsheetId: string,
): Promise<Tenancy[]> {
  const { values } = await getValues(accessToken, spreadsheetId, DATA_RANGE);
  return (values ?? [])
    .filter((row) => Array.isArray(row) && row[0])
    .map(rowToTenancy);
}

export interface CreateTenancyInput {
  propertyId: string;
  contractStart: string;
  expectedEndDate?: string;
  rentRate: number;
}

export async function createTenancy(
  accessToken: string,
  spreadsheetId: string,
  input: CreateTenancyInput,
): Promise<Tenancy> {
  const tenancy: Tenancy = {
    tenancyId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  };
  await appendValues(accessToken, spreadsheetId, DATA_RANGE, [
    tenancyToRow(tenancy),
  ]);
  return tenancy;
}

// Sheets edits target a row number, not an ID, so every write first locates
// the tenancy's current row — same tradeoff as categories.ts at this scale.
async function findTenancyRowNumber(
  accessToken: string,
  spreadsheetId: string,
  tenancyId: string,
): Promise<number> {
  const { values } = await getValues(accessToken, spreadsheetId, DATA_RANGE);
  const index = (values ?? []).findIndex((row) => row[0] === tenancyId);
  if (index === -1) {
    throw new Error(`Tenancy ${tenancyId} not found`);
  }
  return index + 2; // +1 for 1-indexing, +1 for the header row
}

// Used to record the actual move-out date, or correct any other field.
export async function updateTenancy(
  accessToken: string,
  spreadsheetId: string,
  tenancy: Tenancy,
): Promise<void> {
  const rowNumber = await findTenancyRowNumber(
    accessToken,
    spreadsheetId,
    tenancy.tenancyId,
  );
  await updateValues(
    accessToken,
    spreadsheetId,
    `${SHEET_NAME}!A${rowNumber}:G${rowNumber}`,
    [tenancyToRow(tenancy)],
  );
}
