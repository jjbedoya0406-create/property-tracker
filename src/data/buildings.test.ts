import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFolder, moveFile } from "../api/drive/client";
import { appendValues } from "../api/sheets/client";
import { createProperty, updateProperty } from "./properties";
import { ensureReceiptsFolder } from "./receipts";
import {
  addUnitToBuilding,
  promotePropertyToBuilding,
} from "./buildings";
import type { Building, Property } from "../types";

vi.mock("../api/drive/client", () => ({
  createFolder: vi.fn(),
  moveFile: vi.fn(),
}));
vi.mock("../api/sheets/client", () => ({
  appendValues: vi.fn(),
  getValues: vi.fn(),
}));
vi.mock("./properties", () => ({
  createProperty: vi.fn(),
  updateProperty: vi.fn(),
}));
vi.mock("./receipts", () => ({
  ensureReceiptsFolder: vi.fn(),
}));

function property(overrides: Partial<Property> = {}): Property {
  return {
    propertyId: "prop-1",
    name: "302",
    address: "Cra 94 # 4D-45",
    status: "active",
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

// Regression coverage for issue #7's promote/add-unit operations, which
// both relocate or create real Drive folders — same test-first rigor as
// issue #2's driveMigration.
describe("promotePropertyToBuilding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureReceiptsFolder).mockResolvedValue("top-level-folder-id");
    vi.mocked(createFolder).mockImplementation(
      async (_token, name) =>
        ({ id: `folder-for-${name}`, name, webViewLink: undefined }) as never,
    );
    vi.mocked(createProperty).mockImplementation(
      async (_token, _sheetId, input) =>
        ({
          propertyId: "new-unit-id",
          name: input.name,
          status: "active",
          createdAt: "2026-01-02T00:00:00Z",
          driveFolderId: input.driveFolderId,
          buildingId: input.buildingId,
        }) as Property,
    );
  });

  it("moves the property's existing folder under the new building folder", async () => {
    const result = await promotePropertyToBuilding("token", "sheet-id", {
      property: property({ driveFolderId: "existing-folder-302" }),
      buildingName: "Cra 94 4D-45",
      newUnitName: "301",
    });

    expect(createFolder).toHaveBeenCalledWith(
      "token",
      "Cra 94 4D-45",
      "top-level-folder-id",
    );
    expect(moveFile).toHaveBeenCalledWith(
      "token",
      "existing-folder-302",
      "folder-for-Cra 94 4D-45",
      "top-level-folder-id",
    );
    // The property's own folder should NOT be recreated when it already
    // has one — only moved.
    expect(createFolder).not.toHaveBeenCalledWith(
      "token",
      "302",
      expect.anything(),
    );
    expect(updateProperty).toHaveBeenCalledWith(
      "token",
      "sheet-id",
      expect.objectContaining({
        propertyId: "prop-1",
        driveFolderId: "existing-folder-302",
        buildingId: result.building.buildingId,
      }),
    );
    expect(result.newUnit.driveFolderId).toBe("folder-for-301");
    expect(result.newUnit.buildingId).toBe(result.building.buildingId);
    expect(appendValues).toHaveBeenCalledTimes(1); // the Buildings row
  });

  it("creates a fresh folder for the property when it doesn't have one yet", async () => {
    await promotePropertyToBuilding("token", "sheet-id", {
      property: property({ driveFolderId: undefined }),
      buildingName: "Cra 94 4D-45",
      newUnitName: "301",
    });

    expect(moveFile).not.toHaveBeenCalled();
    expect(createFolder).toHaveBeenCalledWith(
      "token",
      "302",
      "folder-for-Cra 94 4D-45",
    );
    expect(updateProperty).toHaveBeenCalledWith(
      "token",
      "sheet-id",
      expect.objectContaining({ driveFolderId: "folder-for-302" }),
    );
  });
});

describe("addUnitToBuilding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createFolder).mockImplementation(
      async (_token, name) => ({ id: `folder-for-${name}`, name }) as never,
    );
    vi.mocked(createProperty).mockImplementation(
      async (_token, _sheetId, input) =>
        ({
          propertyId: "new-unit-id",
          name: input.name,
          status: "active",
          createdAt: "2026-01-02T00:00:00Z",
          driveFolderId: input.driveFolderId,
          buildingId: input.buildingId,
        }) as Property,
    );
  });

  function building(overrides: Partial<Building> = {}): Building {
    return {
      buildingId: "building-1",
      name: "Cra 94 4D-45",
      createdAt: "2026-01-01T00:00:00Z",
      driveFolderId: "building-folder-id",
      ...overrides,
    };
  }

  it("creates the new unit's folder nested under the building's folder", async () => {
    const unit = await addUnitToBuilding(
      "token",
      "sheet-id",
      building(),
      "303",
    );

    expect(createFolder).toHaveBeenCalledWith(
      "token",
      "303",
      "building-folder-id",
    );
    expect(createProperty).toHaveBeenCalledWith(
      "token",
      "sheet-id",
      expect.objectContaining({
        name: "303",
        buildingId: "building-1",
        driveFolderId: "folder-for-303",
      }),
    );
    expect(unit.buildingId).toBe("building-1");
  });

  it("throws if the building has no Drive folder", async () => {
    await expect(
      addUnitToBuilding(
        "token",
        "sheet-id",
        building({ driveFolderId: undefined }),
        "303",
      ),
    ).rejects.toThrow();
    expect(createFolder).not.toHaveBeenCalled();
  });
});
