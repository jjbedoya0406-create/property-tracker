export type PropertyStatus = "active" | "archived";

export interface Property {
  propertyId: string;
  name: string;
  address?: string;
  status: PropertyStatus;
  createdAt: string;
  // Drive folder this property's receipts are organized into (issue #2).
  // Missing on properties created before that shipped — created lazily on
  // first receipt capture rather than requiring the migration to run first.
  driveFolderId?: string;
}
