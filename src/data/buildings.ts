import { createFolder, moveFile } from "../api/drive/client";
import { appendValues, getValues } from "../api/sheets/client";
import type { Building, Property } from "../types";
import { createProperty, updateProperty } from "./properties";
import { ensureReceiptsFolder } from "./receipts";

// Matches the Buildings tab shape (issue #7): building_id, name, address,
// created_at, drive_folder_id. Row 1 is the header (written once in
// data/portfolio.ts), data starts at row 2.
const SHEET_NAME = "Buildings";
const DATA_RANGE = `${SHEET_NAME}!A2:E`;

function rowToBuilding(row: unknown[]): Building {
  const [buildingId, name, address, createdAt, driveFolderId] =
    row as string[];
  return {
    buildingId,
    name,
    address: address || undefined,
    createdAt,
    driveFolderId: driveFolderId || undefined,
  };
}

function buildingToRow(building: Building): unknown[] {
  return [
    building.buildingId,
    building.name,
    building.address ?? "",
    building.createdAt,
    building.driveFolderId ?? "",
  ];
}

export async function listBuildings(
  accessToken: string,
  spreadsheetId: string,
): Promise<Building[]> {
  const { values } = await getValues(accessToken, spreadsheetId, DATA_RANGE);
  return (values ?? [])
    .filter((row) => Array.isArray(row) && row[0])
    .map(rowToBuilding);
}

async function createBuildingRow(
  accessToken: string,
  spreadsheetId: string,
  input: { name: string; address?: string; driveFolderId?: string },
): Promise<Building> {
  const building: Building = {
    buildingId: crypto.randomUUID(),
    name: input.name,
    address: input.address,
    createdAt: new Date().toISOString(),
    driveFolderId: input.driveFolderId,
  };
  await appendValues(accessToken, spreadsheetId, DATA_RANGE, [
    buildingToRow(building),
  ]);
  return building;
}

export interface PromotePropertyToBuildingInput {
  property: Property;
  buildingName: string;
  newUnitName: string;
}

export interface PromotePropertyToBuildingResult {
  building: Building;
  updatedProperty: Property;
  newUnit: Property;
}

// Promotes a standalone property into the first two units of a new
// multi-unit building (issue #7): creates the Buildings row and its Drive
// folder (nested under the top-level app folder — see
// docs/google-cloud-setup.md / data/receipts.ts), relocates the original
// property's existing Drive folder to live nested under the new building
// folder (or creates a fresh one if it didn't have one yet), and creates
// the second unit alongside it with its own folder in the same place.
export async function promotePropertyToBuilding(
  accessToken: string,
  spreadsheetId: string,
  input: PromotePropertyToBuildingInput,
): Promise<PromotePropertyToBuildingResult> {
  const topLevelFolderId = await ensureReceiptsFolder(accessToken);
  const buildingFolder = await createFolder(
    accessToken,
    input.buildingName,
    topLevelFolderId,
  );

  const building = await createBuildingRow(accessToken, spreadsheetId, {
    name: input.buildingName,
    address: input.property.address,
    driveFolderId: buildingFolder.id,
  });

  let propertyFolderId = input.property.driveFolderId;
  if (propertyFolderId) {
    await moveFile(
      accessToken,
      propertyFolderId,
      buildingFolder.id,
      topLevelFolderId,
    );
  } else {
    const created = await createFolder(
      accessToken,
      input.property.name,
      buildingFolder.id,
    );
    propertyFolderId = created.id;
  }

  const updatedProperty: Property = {
    ...input.property,
    buildingId: building.buildingId,
    driveFolderId: propertyFolderId,
  };
  await updateProperty(accessToken, spreadsheetId, updatedProperty);

  const newUnitFolder = await createFolder(
    accessToken,
    input.newUnitName,
    buildingFolder.id,
  );
  const newUnit = await createProperty(accessToken, spreadsheetId, {
    name: input.newUnitName,
    buildingId: building.buildingId,
    driveFolderId: newUnitFolder.id,
  });

  return { building, updatedProperty, newUnit };
}

// Adds a further unit (3rd+) to an already-multi-unit building — the
// Buildings row and its folder already exist, so this just creates the
// new unit's own folder nested under it and the Property row.
export async function addUnitToBuilding(
  accessToken: string,
  spreadsheetId: string,
  building: Building,
  unitName: string,
): Promise<Property> {
  if (!building.driveFolderId) {
    throw new Error(`Building ${building.buildingId} has no Drive folder`);
  }
  const folder = await createFolder(
    accessToken,
    unitName,
    building.driveFolderId,
  );
  return createProperty(accessToken, spreadsheetId, {
    name: unitName,
    buildingId: building.buildingId,
    driveFolderId: folder.id,
  });
}
