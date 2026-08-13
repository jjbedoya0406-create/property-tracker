import { appendValues, getValues, updateValues } from "../api/sheets/client";
import type { Property, PropertyStatus } from "../types";

// Matches the Properties tab shape in PRD §8 plus drive_folder_id (issue
// #2): property_id, name, address, status, created_at, drive_folder_id.
// Row 1 is the header (written once in data/portfolio.ts), data starts at
// row 2.
const SHEET_NAME = "Properties";
const DATA_RANGE = `${SHEET_NAME}!A2:F`;

function rowToProperty(row: unknown[]): Property {
  const [propertyId, name, address, status, createdAt, driveFolderId] =
    row as string[];
  return {
    propertyId,
    name,
    address: address || undefined,
    status: status === "archived" ? "archived" : "active",
    createdAt,
    driveFolderId: driveFolderId || undefined,
  };
}

function propertyToRow(property: Property): unknown[] {
  return [
    property.propertyId,
    property.name,
    property.address ?? "",
    property.status,
    property.createdAt,
    property.driveFolderId ?? "",
  ];
}

export async function listProperties(
  accessToken: string,
  spreadsheetId: string,
): Promise<Property[]> {
  const { values } = await getValues(accessToken, spreadsheetId, DATA_RANGE);
  return (values ?? [])
    .filter((row) => Array.isArray(row) && row[0])
    .map(rowToProperty);
}

export async function createProperty(
  accessToken: string,
  spreadsheetId: string,
  input: { name: string; address?: string; driveFolderId?: string },
): Promise<Property> {
  const property: Property = {
    propertyId: crypto.randomUUID(),
    name: input.name,
    address: input.address,
    status: "active",
    createdAt: new Date().toISOString(),
    driveFolderId: input.driveFolderId,
  };
  await appendValues(accessToken, spreadsheetId, DATA_RANGE, [
    propertyToRow(property),
  ]);
  return property;
}

// Sheets edits target a row number, not an ID, so every write first locates
// the property's current row. Fine at this scale (a handful of properties
// per user) — see PRD §5 on the accepted tradeoffs of using Sheets at all.
async function findPropertyRowNumber(
  accessToken: string,
  spreadsheetId: string,
  propertyId: string,
): Promise<number> {
  const { values } = await getValues(accessToken, spreadsheetId, DATA_RANGE);
  const index = (values ?? []).findIndex((row) => row[0] === propertyId);
  if (index === -1) {
    throw new Error(`Property ${propertyId} not found`);
  }
  return index + 2; // +1 for 1-indexing, +1 for the header row
}

export async function updateProperty(
  accessToken: string,
  spreadsheetId: string,
  property: Property,
): Promise<void> {
  const rowNumber = await findPropertyRowNumber(
    accessToken,
    spreadsheetId,
    property.propertyId,
  );
  await updateValues(
    accessToken,
    spreadsheetId,
    `${SHEET_NAME}!A${rowNumber}:F${rowNumber}`,
    [propertyToRow(property)],
  );
}

export async function setPropertyStatus(
  accessToken: string,
  spreadsheetId: string,
  property: Property,
  status: PropertyStatus,
): Promise<void> {
  await updateProperty(accessToken, spreadsheetId, { ...property, status });
}
