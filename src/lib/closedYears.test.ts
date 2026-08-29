import { describe, expect, it } from "vitest";
import { isYearClosed } from "./closedYears";

describe("isYearClosed", () => {
  it("returns false when no years are closed", () => {
    expect(isYearClosed([], "2026-06-15")).toBe(false);
  });

  it("returns true for a date within a closed year", () => {
    const closedYears = [{ year: 2025, closedAt: "2026-01-05T00:00:00.000Z" }];
    expect(isYearClosed(closedYears, "2025-06-15")).toBe(true);
  });

  it("returns false for a date in a different year than any closed one", () => {
    const closedYears = [{ year: 2025, closedAt: "2026-01-05T00:00:00.000Z" }];
    expect(isYearClosed(closedYears, "2026-06-15")).toBe(false);
  });

  it("treats the boundary dates of a closed year correctly", () => {
    const closedYears = [{ year: 2025, closedAt: "2026-01-05T00:00:00.000Z" }];
    expect(isYearClosed(closedYears, "2025-01-01")).toBe(true);
    expect(isYearClosed(closedYears, "2025-12-31")).toBe(true);
    expect(isYearClosed(closedYears, "2024-12-31")).toBe(false);
    expect(isYearClosed(closedYears, "2026-01-01")).toBe(false);
  });

  it("checks against every closed year, not just the first", () => {
    const closedYears = [
      { year: 2023, closedAt: "2024-01-01T00:00:00.000Z" },
      { year: 2024, closedAt: "2025-01-01T00:00:00.000Z" },
    ];
    expect(isYearClosed(closedYears, "2024-03-01")).toBe(true);
    expect(isYearClosed(closedYears, "2025-03-01")).toBe(false);
  });
});
