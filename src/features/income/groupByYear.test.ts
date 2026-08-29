import { describe, expect, it } from "vitest";
import type { Income } from "../../types";
import { groupIncomeByYear } from "./groupByYear";

function makeIncome(overrides: Partial<Income> & { date: string }): Income {
  return {
    incomeId: `income-${overrides.date}-${Math.random()}`,
    propertyId: "property-1",
    amount: 1000,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("groupIncomeByYear", () => {
  it("returns an empty list for no income", () => {
    expect(groupIncomeByYear([])).toEqual([]);
  });

  it("groups entries by year, most recent year first", () => {
    const income = [
      makeIncome({ date: "2024-03-01", amount: 100 }),
      makeIncome({ date: "2026-01-15", amount: 200 }),
      makeIncome({ date: "2025-06-10", amount: 300 }),
    ];
    const years = groupIncomeByYear(income).map((g) => g.year);
    expect(years).toEqual([2026, 2025, 2024]);
  });

  it("computes each year's total and count", () => {
    const income = [
      makeIncome({ date: "2026-01-15", amount: 100 }),
      makeIncome({ date: "2026-02-15", amount: 250 }),
    ];
    const [year2026] = groupIncomeByYear(income);
    expect(year2026.total).toBe(350);
    expect(year2026.count).toBe(2);
  });

  it("groups a year's entries by month, most recent month first", () => {
    const income = [
      makeIncome({ date: "2026-01-01", amount: 100 }),
      makeIncome({ date: "2026-03-01", amount: 100 }),
      makeIncome({ date: "2026-02-01", amount: 100 }),
    ];
    const [year2026] = groupIncomeByYear(income);
    expect(year2026.months.map((m) => m.month)).toEqual([
      "2026-03",
      "2026-02",
      "2026-01",
    ]);
  });

  it("combines multiple payments in the same month into one MonthGroup", () => {
    const income = [
      makeIncome({ date: "2026-02-05", amount: 500 }),
      makeIncome({ date: "2026-02-20", amount: 500 }),
    ];
    const [year2026] = groupIncomeByYear(income);
    expect(year2026.months).toHaveLength(1);
    const [febGroup] = year2026.months;
    expect(febGroup.total).toBe(1000);
    expect(febGroup.entries).toHaveLength(2);
    // Newest first within the month.
    expect(febGroup.entries[0].date).toBe("2026-02-20");
  });

  it("keeps a single-payment month as a MonthGroup of one entry", () => {
    const income = [makeIncome({ date: "2026-05-15", amount: 750 })];
    const [year2026] = groupIncomeByYear(income);
    expect(year2026.months[0].entries).toHaveLength(1);
    expect(year2026.months[0].total).toBe(750);
  });
});
