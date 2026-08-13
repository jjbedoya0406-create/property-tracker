import {
  createFolder,
  findFileByName,
  renameFile,
  uploadFile,
} from "../api/drive/client";

// The one top-level app folder in Drive (issue #2's "e.g. 'Property
// Expense Tracker'" container) — each property gets its own subfolder
// inside this, rather than receipts sitting loose at Drive root. Predates
// per-property folders (was originally the flat receipts folder), so the
// name stays as-is rather than renaming something already established in
// users' Drives.
const RECEIPTS_FOLDER_NAME = "Property Expense Tracker Receipts";
const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

export async function ensureReceiptsFolder(accessToken: string): Promise<string> {
  const existing = await findFileByName(
    accessToken,
    RECEIPTS_FOLDER_NAME,
    FOLDER_MIME_TYPE,
  );
  if (existing) {
    return existing.id;
  }
  const folder = await createFolder(accessToken, RECEIPTS_FOLDER_NAME);
  return folder.id;
}

// Creates a property's Drive subfolder, nested under the top-level app
// folder — called both at property-creation time and lazily on first
// capture for properties that predate this feature.
export async function createPropertyFolder(
  accessToken: string,
  propertyName: string,
): Promise<string> {
  const parentFolderId = await ensureReceiptsFolder(accessToken);
  const folder = await createFolder(accessToken, propertyName, parentFolderId);
  return folder.id;
}

// Keeps a property's Drive folder name in sync with its name in the app
// (issue #2 Story 3) — a no-op from Drive's perspective if the name hasn't
// actually changed.
export function renamePropertyFolder(
  accessToken: string,
  driveFolderId: string,
  newName: string,
): Promise<void> {
  return renameFile(accessToken, driveFolderId, newName).then(() => undefined);
}

// Returns a durable link to the uploaded image (PRD's "still retrievable
// years later for a tax audit" bar — Drive's webViewLink outlives this app).
// `folderId` is the destination property's own folder — callers resolve
// this (creating one lazily if the property predates issue #2) rather than
// this module defaulting to the flat top-level folder.
export async function uploadReceiptImage(
  accessToken: string,
  file: Blob,
  filename: string,
  folderId: string,
): Promise<string> {
  const uploaded = await uploadFile(accessToken, file, filename, folderId);
  return (
    uploaded.webViewLink ??
    `https://drive.google.com/file/d/${uploaded.id}/view`
  );
}
