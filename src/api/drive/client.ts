import { authorizedFetch, authorizedFetchJson } from "../http";

const DRIVE_UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3/files";
const DRIVE_BASE = "https://www.googleapis.com/drive/v3/files";

export interface DriveFile {
  id: string;
  name: string;
  webViewLink?: string;
}

// Uploads a receipt image as a file the app owns (see docs/google-cloud-setup.md
// re: the drive.file scope). `parentFolderId` is optional — omit to upload to
// the user's Drive root.
export async function uploadFile(
  accessToken: string,
  file: Blob,
  name: string,
  parentFolderId?: string,
): Promise<DriveFile> {
  const metadata = {
    name,
    ...(parentFolderId ? { parents: [parentFolderId] } : {}),
  };

  const form = new FormData();
  form.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" }),
  );
  form.append("file", file);

  const response = await authorizedFetch(
    accessToken,
    `${DRIVE_UPLOAD_BASE}?uploadType=multipart&fields=id,name,webViewLink`,
    { method: "POST", body: form },
  );
  return response.json() as Promise<DriveFile>;
}

export function getFile(
  accessToken: string,
  fileId: string,
): Promise<DriveFile> {
  const url = `${DRIVE_BASE}/${fileId}?fields=id,name,webViewLink`;
  return authorizedFetchJson<DriveFile>(accessToken, url);
}

// Creates a dedicated app folder (e.g. "Property Expense Tracker Receipts")
// so receipt images stay organized instead of loose in Drive root.
export function createFolder(
  accessToken: string,
  name: string,
): Promise<DriveFile> {
  return authorizedFetchJson<DriveFile>(accessToken, DRIVE_BASE, {
    method: "POST",
    body: JSON.stringify({
      name,
      mimeType: "application/vnd.google-apps.folder",
    }),
  });
}
