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
  // Set only once this property has been promoted to a unit of a
  // multi-unit building (issue #7) — absent means a standalone property,
  // which renders and behaves exactly as it always has. Never set eagerly.
  buildingId?: string;
}
