import { describe, expect, it } from "vitest";
import { formatMonthLabel } from "./monthLabel";

describe("formatMonthLabel", () => {
  it("formats in English", () => {
    expect(formatMonthLabel("2026-08", "en")).toBe("August 2026");
  });

  it("formats in Spanish", () => {
    expect(formatMonthLabel("2026-08", "es")).toBe("agosto de 2026");
  });

  it("handles January correctly (month index off-by-one risk)", () => {
    expect(formatMonthLabel("2026-01", "en")).toBe("January 2026");
  });
});
