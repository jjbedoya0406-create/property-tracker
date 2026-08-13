import type { DriveFile } from "../api/drive/client";
import { listFilesInFolder, moveFile } from "../api/drive/client";
import type { Expense, Property } from "../types";
import { listExpenses } from "./expenses";
import { listProperties, updateProperty } from "./properties";
import { createPropertyFolder, ensureReceiptsFolder } from "./receipts";

export interface MigrationMove {
  fileId: string;
  fileName: string;
  propertyId: string;
  propertyName: string;
}

export interface MigrationOrphan {
  fileId: string;
  fileName: string;
}

export interface MigrationPlan {
  moves: MigrationMove[];
  orphans: MigrationOrphan[];
}

// Matches files currently sitting flat in the top-level receipts folder to
// the property they belong to, via the expense row that references each
// file (by Drive file ID, extracted from receiptDriveUrl — both the real
// webViewLink and the constructed fallback URL share the same
// `/file/d/{id}/` shape). A file with no matching expense, or whose
// expense points at a property that no longer resolves, is flagged as an
// orphan rather than guessed at (issue #2: "left alone... flagged for
// manual review"). Pure — no I/O — so the matching logic itself is
// directly testable without mocking Drive or Sheets.
export function buildMigrationPlan(
  properties: Property[],
  expenses: Expense[],
  files: DriveFile[],
): MigrationPlan {
  const propertyById = new Map(properties.map((p) => [p.propertyId, p]));
  const moves: MigrationMove[] = [];
  const orphans: MigrationOrphan[] = [];

  for (const file of files) {
    const matchingExpense = expenses.find(
      (expense) =>
        expense.receiptDriveUrl?.includes(`/d/${file.id}/`) ?? false,
    );
    const property = matchingExpense
      ? propertyById.get(matchingExpense.propertyId)
      : undefined;

    if (matchingExpense && property) {
      moves.push({
        fileId: file.id,
        fileName: file.name,
        propertyId: property.propertyId,
        propertyName: property.name,
      });
    } else {
      orphans.push({ fileId: file.id, fileName: file.name });
    }
  }

  return { moves, orphans };
}

// The dry-run: fetches current Properties, Expenses, and the flat
// receipts folder's contents, and returns the plan without moving or
// changing anything.
export async function planDriveMigration(
  accessToken: string,
  spreadsheetId: string,
): Promise<MigrationPlan> {
  const topLevelFolderId = await ensureReceiptsFolder(accessToken);
  const [properties, expenses, files] = await Promise.all([
    listProperties(accessToken, spreadsheetId),
    listExpenses(accessToken, spreadsheetId),
    listFilesInFolder(accessToken, topLevelFolderId),
  ]);
  return buildMigrationPlan(properties, expenses, files);
}

// Executes a previously-computed plan: creates+persists a folder for any
// touched property that doesn't have one yet (once per property, not once
// per file), then moves each planned file into its property's folder.
// Orphans are never passed here — they're left untouched by construction.
export async function runDriveMigration(
  accessToken: string,
  spreadsheetId: string,
  plan: MigrationPlan,
): Promise<void> {
  const topLevelFolderId = await ensureReceiptsFolder(accessToken);
  const properties = await listProperties(accessToken, spreadsheetId);
  const propertyById = new Map(properties.map((p) => [p.propertyId, p]));

  const folderIdByPropertyId = new Map<string, string>();
  for (const move of plan.moves) {
    if (folderIdByPropertyId.has(move.propertyId)) {
      continue;
    }
    const property = propertyById.get(move.propertyId);
    if (!property) {
      continue;
    }
    let folderId = property.driveFolderId;
    if (!folderId) {
      folderId = await createPropertyFolder(accessToken, property.name);
      await updateProperty(accessToken, spreadsheetId, {
        ...property,
        driveFolderId: folderId,
      });
    }
    folderIdByPropertyId.set(move.propertyId, folderId);
  }

  for (const move of plan.moves) {
    const folderId = folderIdByPropertyId.get(move.propertyId);
    if (!folderId) {
      continue;
    }
    await moveFile(accessToken, move.fileId, folderId, topLevelFolderId);
  }
}
