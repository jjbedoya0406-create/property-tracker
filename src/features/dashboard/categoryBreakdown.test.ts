import { describe, expect, it } from "vitest";
import { computeCategoryBreakdown } from "./categoryBreakdown";

describe("computeCategoryBreakdown", () => {
  it("returns nothing for a month with no expenses", () => {
    expect(computeCategoryBreakdown([], "2026-08")).toEqual([]);
  });

  it("keeps every category with no 'Other' when there are 4 or fewer", () => {
    const expenses = [
      { categoryId: "repairs", amount: 100, date: "2026-08-01" },
      { categoryId: "utilities", amount: 200, date: "2026-08-02" },
      { categoryId: "cleaning", amount: 50, date: "2026-08-03" },
    ];
    const result = computeCategoryBreakdown(expenses, "2026-08");
    expect(result).toHaveLength(3);
    expect(result.every((entry) => entry.categoryId !== null)).toBe(true);
  });

  it("keeps exactly 4 categories with no 'Other' when there are exactly 4", () => {
    const expenses = [
      { categoryId: "a", amount: 400, date: "2026-08-01" },
      { categoryId: "b", amount: 300, date: "2026-08-01" },
      { categoryId: "c", amount: 200, date: "2026-08-01" },
      { categoryId: "d", amount: 100, date: "2026-08-01" },
    ];
    const result = computeCategoryBreakdown(expenses, "2026-08");
    expect(result).toHaveLength(4);
    expect(result.some((entry) => entry.categoryId === null)).toBe(false);
  });

  it("folds everything past the top 4 into a single 'Other' entry", () => {
    const expenses = [
      { categoryId: "a", amount: 500, date: "2026-08-01" },
      { categoryId: "b", amount: 400, date: "2026-08-01" },
      { categoryId: "c", amount: 300, date: "2026-08-01" },
      { categoryId: "d", amount: 200, date: "2026-08-01" },
      { categoryId: "e", amount: 100, date: "2026-08-01" },
      { categoryId: "f", amount: 50, date: "2026-08-01" },
    ];
    const result = computeCategoryBreakdown(expenses, "2026-08");
    expect(result).toHaveLength(5);
    const other = result.find((entry) => entry.categoryId === null);
    expect(other?.amount).toBe(150); // e (100) + f (50)
    // Top 4 are the largest by amount, sorted descending.
    expect(result.slice(0, 4).map((e) => e.categoryId)).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
  });

  it("combines multiple expenses in the same category before ranking", () => {
    const expenses = [
      { categoryId: "repairs", amount: 100, date: "2026-08-01" },
      { categoryId: "repairs", amount: 150, date: "2026-08-15" },
      { categoryId: "utilities", amount: 200, date: "2026-08-02" },
    ];
    const result = computeCategoryBreakdown(expenses, "2026-08");
    const repairs = result.find((e) => e.categoryId === "repairs");
    expect(repairs?.amount).toBe(250);
  });

  it("ignores expenses outside the selected month", () => {
    const expenses = [
      { categoryId: "repairs", amount: 100, date: "2026-08-01" },
      { categoryId: "repairs", amount: 999, date: "2026-07-01" },
    ];
    const result = computeCategoryBreakdown(expenses, "2026-08");
    expect(result).toEqual([{ categoryId: "repairs", amount: 100, percent: 100 }]);
  });

  it("rounds percents to approximately 100 total", () => {
    const expenses = [
      { categoryId: "a", amount: 1, date: "2026-08-01" },
      { categoryId: "b", amount: 1, date: "2026-08-01" },
      { categoryId: "c", amount: 1, date: "2026-08-01" },
    ];
    const result = computeCategoryBreakdown(expenses, "2026-08");
    const totalPercent = result.reduce((sum, e) => sum + e.percent, 0);
    expect(totalPercent).toBeGreaterThanOrEqual(98);
    expect(totalPercent).toBeLessThanOrEqual(102);
  });
});
