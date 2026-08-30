import { describe, expect, it } from "vitest";
import {
  computePortfolioNet,
  computePortfolioTotals,
  computePropertyPreview,
} from "./portfolioSummary";

describe("computePortfolioTotals", () => {
  it("returns income and expenses separately for the given month", () => {
    const income = [
      { date: "2026-08-01", amount: 1000 },
      { date: "2026-07-01", amount: 9999 }, // different month, ignored
    ];
    const expenses = [{ date: "2026-08-15", amount: 300 }];
    expect(computePortfolioTotals(income, expenses, "2026-08")).toEqual({
      income: 1000,
      expenses: 300,
    });
  });

  it("returns zeros with no activity", () => {
    expect(computePortfolioTotals([], [], "2026-08")).toEqual({
      income: 0,
      expenses: 0,
    });
  });
});

describe("computePortfolioNet", () => {
  it("nets income minus expenses for the given month only", () => {
    const income = [
      { date: "2026-08-01", amount: 1000 },
      { date: "2026-07-01", amount: 9999 }, // different month, ignored
    ];
    const expenses = [{ date: "2026-08-15", amount: 300 }];
    expect(computePortfolioNet(income, expenses, "2026-08")).toBe(700);
  });

  it("goes negative when expenses exceed income", () => {
    const income = [{ date: "2026-08-01", amount: 100 }];
    const expenses = [{ date: "2026-08-01", amount: 500 }];
    expect(computePortfolioNet(income, expenses, "2026-08")).toBe(-400);
  });

  it("returns 0 with no activity", () => {
    expect(computePortfolioNet([], [], "2026-08")).toBe(0);
  });
});

describe("computePropertyPreview", () => {
  it("returns noActivity when nothing happened this month", () => {
    const result = computePropertyPreview([], [], true, "2026-08");
    expect(result).toEqual({ kind: "noActivity" });
  });

  it("previews expenses only for a property that's never had income", () => {
    const expenses = [{ date: "2026-08-01", amount: 200 }];
    const result = computePropertyPreview([], expenses, false, "2026-08");
    expect(result).toEqual({ kind: "expensesOnly", amount: 200 });
  });

  it("previews a real net for a property that has had income before", () => {
    const income = [{ date: "2026-08-01", amount: 1000 }];
    const expenses = [{ date: "2026-08-01", amount: 300 }];
    const result = computePropertyPreview(income, expenses, true, "2026-08");
    expect(result).toEqual({ kind: "net", amount: 700 });
  });

  it("still previews expensesOnly if a non-rental property somehow has $0 income logged this month but expenses exist", () => {
    const expenses = [{ date: "2026-08-01", amount: 150 }];
    const result = computePropertyPreview([], expenses, false, "2026-08");
    expect(result.kind).toBe("expensesOnly");
  });

  it("ignores activity outside the selected month when deciding noActivity", () => {
    const income = [{ date: "2026-07-01", amount: 1000 }];
    const result = computePropertyPreview(income, [], true, "2026-08");
    expect(result).toEqual({ kind: "noActivity" });
  });
});
