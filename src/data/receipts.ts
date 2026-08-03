import { createFolder, findFileByName, uploadFile } from "../api/drive/client";

// Keeps receipt images organized under one app-created folder instead of
// loose in Drive root. Found-or-created the same way as the portfolio
// spreadsheet (data/portfolio.ts).
const RECEIPTS_FOLDER_NAME = "Property Expense Tracker Receipts";
const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

async function ensureReceiptsFolder(accessToken: string): Promise<string> {
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

// Returns a durable link to the uploaded image (PRD's "still retrievable
// years later for a tax audit" bar — Drive's webViewLink outlives this app).
export async function uploadReceiptImage(
  accessToken: string,
  file: Blob,
  filename: string,
): Promise<string> {
  const folderId = await ensureReceiptsFolder(accessToken);
  const uploaded = await uploadFile(accessToken, file, filename, folderId);
  return (
    uploaded.webViewLink ??
    `https://drive.google.com/file/d/${uploaded.id}/view`
  );
}
