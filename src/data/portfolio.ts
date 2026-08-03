import { findFileByName } from "../api/drive/client";
import { createSpreadsheet, updateValues } from "../api/sheets/client";

// One spreadsheet per Google account, found-or-created on sign-in — this is
// what gives per-user data isolation without a database (PRD §8).
const SPREADSHEET_NAME = "Property Expense Tracker Data";
const SPREADSHEET_MIME_TYPE = "application/vnd.google-apps.spreadsheet";

const PROPERTIES_HEADER = [
  "property_id",
  "name",
  "address",
  "status",
  "created_at",
];
const EXPENSES_HEADER = [
  "expense_id",
  "property_id",
  "amount",
  "date",
  "vendor",
  "category",
  "receipt_drive_url",
  "source",
  "created_at",
  "edited_at",
];

export async function ensurePortfolioSpreadsheet(
  accessToken: string,
): Promise<string> {
  const existing = await findFileByName(
    accessToken,
    SPREADSHEET_NAME,
    SPREADSHEET_MIME_TYPE,
  );
  if (existing) {
    return existing.id;
  }

  const spreadsheet = await createSpreadsheet(accessToken, SPREADSHEET_NAME, [
    "Properties",
    "Expenses",
  ]);

  await Promise.all([
    updateValues(accessToken, spreadsheet.spreadsheetId, "Properties!A1:E1", [
      PROPERTIES_HEADER,
    ]),
    updateValues(accessToken, spreadsheet.spreadsheetId, "Expenses!A1:J1", [
      EXPENSES_HEADER,
    ]),
  ]);

  return spreadsheet.spreadsheetId;
}
