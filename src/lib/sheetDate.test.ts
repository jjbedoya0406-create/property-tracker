import { describe, expect, it } from "vitest";
import { normalizeSheetDate } from "./sheetDate";

describe("normalizeSheetDate", () => {
  it("passes through a plain YYYY-MM-DD string unchanged", () => {
    expect(normalizeSheetDate("2026-04-15")).toBe("2026-04-15");
  });

  it("converts a Sheets serial day number back to YYYY-MM-DD", () => {
    // Sheets serial date for 2026-04-15, confirmed against Sheets' own
    // epoch (1899-12-30) — this is the case UNFORMATTED_VALUE returns when
    // a date cell got auto-formatted as an actual Date by Sheets.
    expect(normalizeSheetDate(46127)).toBe("2026-04-15");
  });

  it("returns an empty string for missing/blank values", () => {
    expect(normalizeSheetDate("")).toBe("");
    expect(normalizeSheetDate(undefined)).toBe("");
  });
});
