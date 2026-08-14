export interface Building {
  buildingId: string;
  name: string;
  address?: string;
  createdAt: string;
  // Drive folder containing this building's own shared-expense receipts
  // plus each unit's subfolder (issue #7 — nested under the top-level app
  // folder, mirroring the property-folder pattern from issue #2).
  driveFolderId?: string;
}
