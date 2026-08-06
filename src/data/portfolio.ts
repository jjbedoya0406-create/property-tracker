import { findFileByName } from "../api/drive/client";
import {
  addSheet,
  appendValues,
  createSpreadsheet,
  getSheetTitles,
  getValues,
  updateValues,
} from "../api/sheets/client";
import { STARTER_CATEGORIES } from "../types";

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
const CATEGORIES_HEADER = ["category_id", "name", "status", "created_at"];
const EXPENSES_COLUMN_COUNT = EXPENSES_HEADER.length;
const EXPENSES_CATEGORY_COLUMN_INDEX = EXPENSES_HEADER.indexOf("category");

export async function ensurePortfolioSpreadsheet(
  accessToken: string,
): Promise<string> {
  const existing = await findFileByName(
    accessToken,
    SPREADSHEET_NAME,
    SPREADSHEET_MIME_TYPE,
  );

  const spreadsheetId = existing
    ? existing.id
    : await createNewSpreadsheet(accessToken);

  // Covers both brand-new accounts (no-ops, since createNewSpreadsheet
  // already added it) and accounts created before the Categories tab
  // existed (Story 1.6) — those get migrated in place here.
  await ensureCategoriesTab(accessToken, spreadsheetId);

  return spreadsheetId;
}

async function createNewSpreadsheet(accessToken: string): Promise<string> {
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

interface SeededCategory {
  categoryId: string;
  name: string;
  status: "active";
  createdAt: string;
}

// Adds the Categories tab to spreadsheets created before it existed, seeds
// it with the starter list, and migrates existing Expense rows from
// storing the category NAME directly to a category_id reference — matching
// the new Expenses.category column meaning (PRD §8: "renaming a category
// updates everywhere it's used"). No-op if the tab already exists.
async function ensureCategoriesTab(
  accessToken: string,
  spreadsheetId: string,
): Promise<void> {
  const titles = await getSheetTitles(accessToken, spreadsheetId);
  if (titles.includes("Categories")) {
    return;
  }

  await addSheet(accessToken, spreadsheetId, "Categories");
  await updateValues(accessToken, spreadsheetId, "Categories!A1:D1", [
    CATEGORIES_HEADER,
  ]);

  const now = new Date().toISOString();
  const seeded: SeededCategory[] = STARTER_CATEGORIES.map((name) => ({
    categoryId: crypto.randomUUID(),
    name,
    status: "active",
    createdAt: now,
  }));
  await appendValues(
    accessToken,
    spreadsheetId,
    "Categories!A2:D",
    seeded.map((category) => [
      category.categoryId,
      category.name,
      category.status,
      category.createdAt,
    ]),
  );

  await migrateExpenseCategoryNamesToIds(accessToken, spreadsheetId, seeded);
}

async function migrateExpenseCategoryNamesToIds(
  accessToken: string,
  spreadsheetId: string,
  categories: SeededCategory[],
): Promise<void> {
  const nameToId = new Map(categories.map((c) => [c.name, c.categoryId]));

  const { values } = await getValues(
    accessToken,
    spreadsheetId,
    "Expenses!A2:J",
  );
  const rows = values ?? [];
  if (rows.length === 0) {
    return;
  }

  let changed = false;
  const migratedRows = rows.map((row) => {
    // Normalize to a full-width row first — Sheets omits trailing blank
    // cells, and writing a short row back could otherwise leave those
    // columns ambiguous.
    const normalized = Array.from(
      { length: EXPENSES_COLUMN_COUNT },
      (_, i) => row[i] ?? "",
    );
    const mappedId = nameToId.get(
      normalized[EXPENSES_CATEGORY_COLUMN_INDEX] as string,
    );
    if (mappedId) {
      normalized[EXPENSES_CATEGORY_COLUMN_INDEX] = mappedId;
      changed = true;
    }
    return normalized;
  });

  if (changed) {
    await updateValues(
      accessToken,
      spreadsheetId,
      `Expenses!A2:J${rows.length + 1}`,
      migratedRows,
    );
  }
}
