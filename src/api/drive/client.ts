import { authorizedFetch, authorizedFetchJson } from "../http";

const DRIVE_UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3/files";
const DRIVE_BASE = "https://www.googleapis.com/drive/v3/files";

export interface DriveFile {
  id: string;
  name: string;
  webViewLink?: string;
  parents?: string[];
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

// Looks up a file this app previously created (drive.file scope only sees
// app-created files, so this is inherently scoped to "our" files, not the
// user's whole Drive).
export async function findFileByName(
  accessToken: string,
  name: string,
  mimeType: string,
): Promise<DriveFile | null> {
  const escapedName = name.replace(/'/g, "\\'");
  const q = `name='${escapedName}' and mimeType='${mimeType}' and trashed=false`;
  const url = `${DRIVE_BASE}?q=${encodeURIComponent(q)}&fields=files(id,name,webViewLink)&spaces=drive`;
  const { files } = await authorizedFetchJson<{ files: DriveFile[] }>(
    accessToken,
    url,
  );
  return files[0] ?? null;
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
// `parentFolderId` nests it under another app folder (e.g. a per-property
// folder under the top-level app folder) — omit for a top-level folder.
export function createFolder(
  accessToken: string,
  name: string,
  parentFolderId?: string,
): Promise<DriveFile> {
  return authorizedFetchJson<DriveFile>(accessToken, DRIVE_BASE, {
    method: "POST",
    body: JSON.stringify({
      name,
      mimeType: "application/vnd.google-apps.folder",
      ...(parentFolderId ? { parents: [parentFolderId] } : {}),
    }),
  });
}

// Renames a file or folder in place (issue #2 Story 3: a property rename
// keeps its Drive folder name in sync).
export function renameFile(
  accessToken: string,
  fileId: string,
  name: string,
): Promise<DriveFile> {
  const url = `${DRIVE_BASE}/${fileId}?fields=id,name,webViewLink`;
  return authorizedFetchJson<DriveFile>(accessToken, url, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

// Moves a file between folders — Drive's API models this as adding the new
// parent and removing the old one, rather than a single "move" call.
export function moveFile(
  accessToken: string,
  fileId: string,
  newParentFolderId: string,
  oldParentFolderId: string,
): Promise<DriveFile> {
  const url = `${DRIVE_BASE}/${fileId}?addParents=${encodeURIComponent(newParentFolderId)}&removeParents=${encodeURIComponent(oldParentFolderId)}&fields=id,name,webViewLink,parents`;
  return authorizedFetchJson<DriveFile>(accessToken, url, {
    method: "PATCH",
    body: JSON.stringify({}),
  });
}

// Lists the (non-trashed) non-folder files directly inside a folder — used
// by the Drive-organization migration (issue #2) to enumerate what's
// currently in the flat receipts folder before planning where each file
// should move. Excludes subfolders (e.g. property folders already living
// inside the top-level folder) since those aren't receipts to migrate.
export async function listFilesInFolder(
  accessToken: string,
  folderId: string,
): Promise<DriveFile[]> {
  const q = `'${folderId}' in parents and trashed=false and mimeType != 'application/vnd.google-apps.folder'`;
  const url = `${DRIVE_BASE}?q=${encodeURIComponent(q)}&fields=files(id,name,webViewLink,parents)&spaces=drive&pageSize=1000`;
  const { files } = await authorizedFetchJson<{ files: DriveFile[] }>(
    accessToken,
    url,
  );
  return files;
}
