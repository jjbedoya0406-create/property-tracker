import { appendValues, getValues, updateValues } from "../api/sheets/client";
import type { Category, CategoryStatus } from "../types";

// Matches the Categories tab shape in PRD §8: category_id, name, status,
// created_at. Row 1 is the header (written once in data/portfolio.ts),
// data starts at row 2. Mirrors data/properties.ts's pattern closely.
const SHEET_NAME = "Categories";
const DATA_RANGE = `${SHEET_NAME}!A2:D`;

function rowToCategory(row: unknown[]): Category {
  const [categoryId, name, status, createdAt] = row as string[];
  return {
    categoryId,
    name,
    status: status === "archived" ? "archived" : "active",
    createdAt,
  };
}

function categoryToRow(category: Category): unknown[] {
  return [
    category.categoryId,
    category.name,
    category.status,
    category.createdAt,
  ];
}

export async function listCategories(
  accessToken: string,
  spreadsheetId: string,
): Promise<Category[]> {
  const { values } = await getValues(accessToken, spreadsheetId, DATA_RANGE);
  return (values ?? [])
    .filter((row) => Array.isArray(row) && row[0])
    .map(rowToCategory);
}

export async function createCategory(
  accessToken: string,
  spreadsheetId: string,
  input: { name: string },
): Promise<Category> {
  const category: Category = {
    categoryId: crypto.randomUUID(),
    name: input.name,
    status: "active",
    createdAt: new Date().toISOString(),
  };
  await appendValues(accessToken, spreadsheetId, DATA_RANGE, [
    categoryToRow(category),
  ]);
  return category;
}

// Sheets edits target a row number, not an ID, so every write first locates
// the category's current row — same tradeoff as properties.ts at this scale.
async function findCategoryRowNumber(
  accessToken: string,
  spreadsheetId: string,
  categoryId: string,
): Promise<number> {
  const { values } = await getValues(accessToken, spreadsheetId, DATA_RANGE);
  const index = (values ?? []).findIndex((row) => row[0] === categoryId);
  if (index === -1) {
    throw new Error(`Category ${categoryId} not found`);
  }
  return index + 2; // +1 for 1-indexing, +1 for the header row
}

// Used for both renaming (Story 1.6) and archiving/unarchiving.
export async function updateCategory(
  accessToken: string,
  spreadsheetId: string,
  category: Category,
): Promise<void> {
  const rowNumber = await findCategoryRowNumber(
    accessToken,
    spreadsheetId,
    category.categoryId,
  );
  await updateValues(
    accessToken,
    spreadsheetId,
    `${SHEET_NAME}!A${rowNumber}:D${rowNumber}`,
    [categoryToRow(category)],
  );
}

export async function setCategoryStatus(
  accessToken: string,
  spreadsheetId: string,
  category: Category,
  status: CategoryStatus,
): Promise<void> {
  await updateCategory(accessToken, spreadsheetId, { ...category, status });
}
