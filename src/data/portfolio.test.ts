import { beforeEach, describe, expect, it, vi } from "vitest";
import { getValues, updateValues } from "../api/sheets/client";
import { purgeExpenseVendorData } from "./portfolio";

vi.mock("../api/sheets/client", () => ({
  getValues: vi.fn(),
  updateValues: vi.fn(),
}));

// Regression coverage for issue #6 (remove Vendor from the app): the user
// chose to actually purge historical vendor data from existing expense
// rows, rather than leave it unused in place — a real migration touching
// existing user data, so it gets test-first coverage per CLAUDE.md.
describe("purgeExpenseVendorData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears the vendor column on rows that still have vendor data, preserving later columns", async () => {
    vi.mocked(getValues).mockResolvedValue({
      range: "Expenses!A2:L",
      values: [
        [
          "exp1",
          "prop1",
          100,
          "2026-01-01",
          "Home Depot",
          "cat1",
          "",
          "manual",
          "2026-01-01T00:00:00Z",
          "",
          "",
          "building1",
        ],
      ],
    });

    await purgeExpenseVendorData("token", "sheet-id");

    // Regression: a write range narrower than the full column width would
    // silently drop building_id (issue #7) even though only vendor was
    // meant to change.
    expect(updateValues).toHaveBeenCalledWith(
      "token",
      "sheet-id",
      "Expenses!A2:L2",
      [
        [
          "exp1",
          "prop1",
          100,
          "2026-01-01",
          "",
          "cat1",
          "",
          "manual",
          "2026-01-01T00:00:00Z",
          "",
          "",
          "building1",
        ],
      ],
    );
  });

  it("is a no-op when vendor is already blank on every row", async () => {
    vi.mocked(getValues).mockResolvedValue({
      range: "Expenses!A2:L",
      values: [
        [
          "exp1",
          "prop1",
          100,
          "2026-01-01",
          "",
          "cat1",
          "",
          "manual",
          "2026-01-01T00:00:00Z",
          "",
          "",
          "",
        ],
      ],
    });

    await purgeExpenseVendorData("token", "sheet-id");

    expect(updateValues).not.toHaveBeenCalled();
  });

  it("is a no-op when there are no expense rows", async () => {
    vi.mocked(getValues).mockResolvedValue({ range: "Expenses!A2:L" });

    await purgeExpenseVendorData("token", "sheet-id");

    expect(updateValues).not.toHaveBeenCalled();
  });
});
