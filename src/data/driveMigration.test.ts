import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPropertyFolder, ensureReceiptsFolder } from "./receipts";
import { listProperties, updateProperty } from "./properties";
import { moveFile } from "../api/drive/client";
import { buildMigrationPlan, runDriveMigration } from "./driveMigration";
import type { DriveFile } from "../api/drive/client";
import type { Expense } from "../types/expense";
import type { Property } from "../types/property";

vi.mock("./receipts", () => ({
  ensureReceiptsFolder: vi.fn(),
  createPropertyFolder: vi.fn(),
}));
vi.mock("./properties", () => ({
  listProperties: vi.fn(),
  updateProperty: vi.fn(),
}));
vi.mock("../api/drive/client", () => ({
  moveFile: vi.fn(),
}));

function property(overrides: Partial<Property> = {}): Property {
  return {
    propertyId: "prop-1",
    name: "123 Oak St",
    status: "active",
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function expense(overrides: Partial<Expense> = {}): Expense {
  return {
    expenseId: "exp-1",
    propertyId: "prop-1",
    amount: 50,
    date: "2026-01-15",
    categoryId: "cat-1",
    source: "manual",
    createdAt: "2026-01-15T00:00:00Z",
    ...overrides,
  };
}

// buildMigrationPlan is pure (no I/O) so it gets direct, unmocked coverage —
// this is the actual matching logic the migration's dry-run preview and
// real run both depend on.
describe("buildMigrationPlan", () => {
  it("matches a file to its property via the expense's receiptDriveUrl", () => {
    const file: DriveFile = {
      id: "file-1",
      name: "2026-01-15-abc.jpg",
      webViewLink: "https://drive.google.com/file/d/file-1/view?usp=drivesdk",
    };
    const plan = buildMigrationPlan(
      [property()],
      [expense({ receiptDriveUrl: file.webViewLink })],
      [file],
    );

    expect(plan.orphans).toEqual([]);
    expect(plan.moves).toEqual([
      {
        fileId: "file-1",
        fileName: "2026-01-15-abc.jpg",
        propertyId: "prop-1",
        propertyName: "123 Oak St",
      },
    ]);
  });

  it("matches via the fallback URL format (no webViewLink on the expense)", () => {
    const file: DriveFile = { id: "file-2", name: "receipt.jpg" };
    const plan = buildMigrationPlan(
      [property()],
      [
        expense({
          receiptDriveUrl: "https://drive.google.com/file/d/file-2/view",
        }),
      ],
      [file],
    );

    expect(plan.moves).toHaveLength(1);
    expect(plan.moves[0].fileId).toBe("file-2");
  });

  it("flags a file with no matching expense row as an orphan", () => {
    const file: DriveFile = { id: "file-3", name: "mystery.jpg" };
    const plan = buildMigrationPlan([property()], [], [file]);

    expect(plan.moves).toEqual([]);
    expect(plan.orphans).toEqual([{ fileId: "file-3", fileName: "mystery.jpg" }]);
  });

  it("flags a file as an orphan if its expense references an unknown property", () => {
    const file: DriveFile = { id: "file-4", name: "orphaned.jpg" };
    const plan = buildMigrationPlan(
      [], // no properties at all
      [
        expense({
          propertyId: "does-not-exist",
          receiptDriveUrl: "https://drive.google.com/file/d/file-4/view",
        }),
      ],
      [file],
    );

    expect(plan.moves).toEqual([]);
    expect(plan.orphans).toEqual([{ fileId: "file-4", fileName: "orphaned.jpg" }]);
  });
});

describe("runDriveMigration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureReceiptsFolder).mockResolvedValue("top-level-folder-id");
  });

  it("moves files into an existing property folder without creating a new one", async () => {
    vi.mocked(listProperties).mockResolvedValue([
      property({ propertyId: "prop-1", driveFolderId: "existing-folder" }),
    ]);

    await runDriveMigration("token", "sheet-id", {
      moves: [
        {
          fileId: "file-1",
          fileName: "a.jpg",
          propertyId: "prop-1",
          propertyName: "123 Oak St",
        },
      ],
      orphans: [],
    });

    expect(createPropertyFolder).not.toHaveBeenCalled();
    expect(updateProperty).not.toHaveBeenCalled();
    expect(moveFile).toHaveBeenCalledWith(
      "token",
      "file-1",
      "existing-folder",
      "top-level-folder-id",
    );
  });

  it("creates and persists a folder for a property that doesn't have one yet, once, then moves its files", async () => {
    vi.mocked(listProperties).mockResolvedValue([
      property({ propertyId: "prop-2", name: "456 Elm St" }),
    ]);
    vi.mocked(createPropertyFolder).mockResolvedValue("new-folder-id");

    await runDriveMigration("token", "sheet-id", {
      moves: [
        {
          fileId: "file-1",
          fileName: "a.jpg",
          propertyId: "prop-2",
          propertyName: "456 Elm St",
        },
        {
          fileId: "file-2",
          fileName: "b.jpg",
          propertyId: "prop-2",
          propertyName: "456 Elm St",
        },
      ],
      orphans: [],
    });

    expect(createPropertyFolder).toHaveBeenCalledTimes(1);
    expect(updateProperty).toHaveBeenCalledTimes(1);
    expect(moveFile).toHaveBeenCalledTimes(2);
    expect(moveFile).toHaveBeenNthCalledWith(
      1,
      "token",
      "file-1",
      "new-folder-id",
      "top-level-folder-id",
    );
    expect(moveFile).toHaveBeenNthCalledWith(
      2,
      "token",
      "file-2",
      "new-folder-id",
      "top-level-folder-id",
    );
  });

  it("never touches orphans", async () => {
    vi.mocked(listProperties).mockResolvedValue([]);

    await runDriveMigration("token", "sheet-id", {
      moves: [],
      orphans: [{ fileId: "orphan-1", fileName: "mystery.jpg" }],
    });

    expect(moveFile).not.toHaveBeenCalled();
  });
});
