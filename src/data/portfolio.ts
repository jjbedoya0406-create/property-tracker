import { findFileByName } from "../api/drive/client";
import {
  addSheet,
  appendValues,
  createSpreadsheet,
  getSheetTitles,
  getValues,
  updateValues,
} from "../api/sheets/client";
import {
  SPANISH_STARTER_CATEGORIES,
  STARTER_CATEGORIES,
  type Settings,
} from "../types";

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
  "drive_folder_id",
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
  "notes",
];
const CATEGORIES_HEADER = ["category_id", "name", "status", "created_at"];
const SETTINGS_HEADER = ["language", "currency"];
const INCOME_HEADER = [
  "income_id",
  "property_id",
  "amount",
  "date",
  "notes",
  "created_at",
];
const TENANCIES_HEADER = [
  "tenancy_id",
  "property_id",
  "contract_start",
  "expected_end_date",
  "actual_move_out_date",
  "rent_rate",
  "created_at",
];
const EXPENSES_COLUMN_COUNT = EXPENSES_HEADER.length;
const EXPENSES_CATEGORY_COLUMN_INDEX = EXPENSES_HEADER.indexOf("category");
const EXPENSES_NOTES_COLUMN_INDEX = EXPENSES_HEADER.indexOf("notes");
const EXPENSES_VENDOR_COLUMN_INDEX = EXPENSES_HEADER.indexOf("vendor");
const PROPERTIES_DRIVE_FOLDER_COLUMN_INDEX =
  PROPERTIES_HEADER.indexOf("drive_folder_id");

// Resolves (or creates) the base spreadsheet — Properties + Expenses only.
// Categories and Settings are deliberately NOT ensured here: seeding the
// right starter category list depends on the account's language (Outcome
// 5), which isn't known until either an existing account's onboarding
// picker resolves it or a new signup completes it — see applyOnboarding.
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

  // Income/Tenancies (Outcome 6) don't depend on the account's language
  // (unlike Categories), so they're safe to ensure unconditionally here on
  // every sign-in, same idempotent add-if-missing pattern as elsewhere.
  await Promise.all([
    ensureIncomeTab(accessToken, spreadsheetId),
    ensureTenanciesTab(accessToken, spreadsheetId),
    ensureExpensesNotesColumn(accessToken, spreadsheetId),
    purgeExpenseVendorData(accessToken, spreadsheetId),
    ensurePropertiesDriveFolderColumn(accessToken, spreadsheetId),
  ]);

  return spreadsheetId;
}

async function createNewSpreadsheet(accessToken: string): Promise<string> {
  const spreadsheet = await createSpreadsheet(accessToken, SPREADSHEET_NAME, [
    "Properties",
    "Expenses",
  ]);

  await Promise.all([
    updateValues(accessToken, spreadsheet.spreadsheetId, "Properties!A1:F1", [
      PROPERTIES_HEADER,
    ]),
    updateValues(accessToken, spreadsheet.spreadsheetId, "Expenses!A1:K1", [
      EXPENSES_HEADER,
    ]),
  ]);

  return spreadsheet.spreadsheetId;
}

async function ensureIncomeTab(
  accessToken: string,
  spreadsheetId: string,
): Promise<void> {
  const titles = await getSheetTitles(accessToken, spreadsheetId);
  if (titles.includes("Income")) {
    return;
  }
  await addSheet(accessToken, spreadsheetId, "Income");
  await updateValues(accessToken, spreadsheetId, "Income!A1:F1", [
    INCOME_HEADER,
  ]);
}

async function ensureTenanciesTab(
  accessToken: string,
  spreadsheetId: string,
): Promise<void> {
  const titles = await getSheetTitles(accessToken, spreadsheetId);
  if (titles.includes("Tenancies")) {
    return;
  }
  await addSheet(accessToken, spreadsheetId, "Tenancies");
  await updateValues(accessToken, spreadsheetId, "Tenancies!A1:G1", [
    TENANCIES_HEADER,
  ]);
}

// Spreadsheets created before Outcome 6 have a 10-column Expenses header
// (no notes). Adds the 11th column header only — existing rows simply read
// back with an empty notes cell, no row rewrite needed.
async function ensureExpensesNotesColumn(
  accessToken: string,
  spreadsheetId: string,
): Promise<void> {
  const { values } = await getValues(
    accessToken,
    spreadsheetId,
    "Expenses!A1:K1",
  );
  const header = values?.[0] ?? [];
  if (header[EXPENSES_NOTES_COLUMN_INDEX] === "notes") {
    return;
  }
  await updateValues(accessToken, spreadsheetId, "Expenses!K1:K1", [
    ["notes"],
  ]);
}

// Spreadsheets created before issue #2 (Organize Drive Storage) have a
// 5-column Properties header (no drive_folder_id). Adds the 6th column
// header only — existing property rows simply read back with an empty
// folder ID until one is created for them (lazily on next capture, or via
// the Drive-organization migration).
async function ensurePropertiesDriveFolderColumn(
  accessToken: string,
  spreadsheetId: string,
): Promise<void> {
  const { values } = await getValues(
    accessToken,
    spreadsheetId,
    "Properties!A1:F1",
  );
  const header = values?.[0] ?? [];
  if (header[PROPERTIES_DRIVE_FOLDER_COLUMN_INDEX] === "drive_folder_id") {
    return;
  }
  await updateValues(accessToken, spreadsheetId, "Properties!F1:F1", [
    ["drive_folder_id"],
  ]);
}

// Issue #6 (remove Vendor from the app): the vendor column is kept in the
// sheet — dropping it would shift every later column — but its data is
// actually purged from existing rows (the user's explicit choice, not the
// non-destructive default used elsewhere in this file). Idempotent: safe
// to run every sign-in, no-op once every row's vendor cell is already
// blank.
export async function purgeExpenseVendorData(
  accessToken: string,
  spreadsheetId: string,
): Promise<void> {
  const { values } = await getValues(
    accessToken,
    spreadsheetId,
    "Expenses!A2:K",
  );
  const rows = values ?? [];
  if (rows.length === 0) {
    return;
  }

  let changed = false;
  const purgedRows = rows.map((row) => {
    const normalized = Array.from(
      { length: EXPENSES_COLUMN_COUNT },
      (_, i) => row[i] ?? "",
    );
    if (normalized[EXPENSES_VENDOR_COLUMN_INDEX] !== "") {
      normalized[EXPENSES_VENDOR_COLUMN_INDEX] = "";
      changed = true;
    }
    return normalized;
  });

  if (changed) {
    await updateValues(
      accessToken,
      spreadsheetId,
      `Expenses!A2:K${rows.length + 1}`,
      purgedRows,
    );
  }
}

// Called once, when the onboarding language/currency picker is submitted —
// by a brand-new account completing first-time setup, or an existing
// (including already-Categories-migrated) account seeing Settings for the
// first time after Outcome 5 shipped. Writes the Settings row and, only if
// Categories doesn't already exist, seeds it with the chosen language's
// starter list.
export async function applyOnboarding(
  accessToken: string,
  spreadsheetId: string,
  settings: Settings,
): Promise<void> {
  await ensureSettingsTab(accessToken, spreadsheetId, settings);
  await ensureCategoriesTab(accessToken, spreadsheetId, settings.language);
}

async function ensureSettingsTab(
  accessToken: string,
  spreadsheetId: string,
  settings: Settings,
): Promise<void> {
  const titles = await getSheetTitles(accessToken, spreadsheetId);
  if (!titles.includes("Settings")) {
    await addSheet(accessToken, spreadsheetId, "Settings");
    await updateValues(accessToken, spreadsheetId, "Settings!A1:B1", [
      SETTINGS_HEADER,
    ]);
  }
  await updateValues(accessToken, spreadsheetId, "Settings!A2:B2", [
    [settings.language, settings.currency],
  ]);
}

interface SeededCategory {
  categoryId: string;
  name: string;
  status: "active";
  createdAt: string;
}

// Adds the Categories tab to spreadsheets that don't have it yet, seeds it
// with the language-appropriate starter list (PRD §11: mom's own eight,
// not a translation of Jason's five), and migrates any existing Expense
// rows from storing the category NAME directly to a category_id reference
// — matching the Expenses.category column meaning (PRD §8: "renaming a
// category updates everywhere it's used"). No-op if the tab already exists
// (e.g. an account that went through the pre-Outcome-5 Categories
// migration already — its existing categories are left untouched).
async function ensureCategoriesTab(
  accessToken: string,
  spreadsheetId: string,
  language: Settings["language"],
): Promise<void> {
  const titles = await getSheetTitles(accessToken, spreadsheetId);
  if (titles.includes("Categories")) {
    return;
  }

  await addSheet(accessToken, spreadsheetId, "Categories");
  await updateValues(accessToken, spreadsheetId, "Categories!A1:D1", [
    CATEGORIES_HEADER,
  ]);

  const starterNames =
    language === "es" ? SPANISH_STARTER_CATEGORIES : STARTER_CATEGORIES;
  const now = new Date().toISOString();
  const seeded: SeededCategory[] = starterNames.map((name) => ({
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
