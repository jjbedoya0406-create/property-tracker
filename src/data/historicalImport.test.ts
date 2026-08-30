import { describe, expect, it } from "vitest";
import {
  buildImportRows,
  computeReconciliation,
  matchIdentifiers,
  parseMonthlySummarySheet,
  parseTransactionsSheet,
} from "./historicalImport";
import type { Building } from "../types/building";
import type { Category } from "../types/category";
import type { Property } from "../types/property";

const HEADER = [
  "Date",
  "Month",
  "Type",
  "Scope",
  "Unit",
  "Category",
  "Amount",
  "Notes",
  "Needs Review",
];

function property(overrides: Partial<Property> = {}): Property {
  return {
    propertyId: "prop-301",
    name: "301 Meléndez",
    status: "active",
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function category(overrides: Partial<Category> = {}): Category {
  return {
    categoryId: "cat-emcali",
    name: "EMCALI",
    status: "active",
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function building(overrides: Partial<Building> = {}): Building {
  return {
    buildingId: "bldg-1",
    name: "Meléndez",
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("parseTransactionsSheet", () => {
  it("parses a well-formed row as-is", () => {
    const rows = [
      HEADER,
      [
        "2026-01-05",
        "Enero 2026",
        "Income",
        "unit",
        "301",
        "Rent",
        430000,
        undefined,
        undefined,
      ],
    ];
    const result = parseTransactionsSheet(rows);
    expect(result).toEqual([
      {
        date: "2026-01-05",
        dateWasAssumed: false,
        type: "income",
        scope: "unit",
        unit: "301",
        category: "Rent",
        amount: 430000,
        notes: undefined,
        needsReview: false,
      },
    ]);
  });

  it("defaults a missing date to the 1st of the stated month, inferring the year from a sibling row", () => {
    const rows = [
      HEADER,
      [
        "2026-02-04",
        "Febrero",
        "Income",
        "unit",
        "301",
        "Rent",
        430000,
        undefined,
        undefined,
      ],
      [
        undefined,
        "Febrero",
        "Income",
        "unit",
        "301",
        "Rent",
        450000,
        undefined,
        "YES",
      ],
    ];
    const result = parseTransactionsSheet(rows);
    expect(result[1].date).toBe("2026-02-01");
    expect(result[1].dateWasAssumed).toBe(true);
    expect(result[1].needsReview).toBe(true);
  });

  it("drops $0 income rows entirely (vacant-unit placeholders, not real transactions)", () => {
    const rows = [
      HEADER,
      [
        undefined,
        "Abril",
        "Income",
        "unit",
        "301",
        "Rent",
        0,
        "Desocupado",
        "YES",
      ],
      [
        "2026-04-08",
        "Abril",
        "Income",
        "unit",
        "302",
        "Rent",
        570000,
        undefined,
        undefined,
      ],
    ];
    const result = parseTransactionsSheet(rows);
    expect(result).toHaveLength(1);
    expect(result[0].unit).toBe("302");
  });

  it("preserves the Needs Review flag on rows that already have a date", () => {
    const rows = [
      HEADER,
      [
        "2026-01-02",
        "Enero 2026",
        "Expense",
        "building",
        "(building)",
        "EMCALI",
        255129,
        undefined,
        "YES",
      ],
    ];
    const result = parseTransactionsSheet(rows);
    expect(result[0].needsReview).toBe(true);
    expect(result[0].dateWasAssumed).toBe(false);
  });
});

describe("parseMonthlySummarySheet", () => {
  it("parses per-month rows and excludes the trailing Total row", () => {
    const rows = [
      ["Month", "Income", "Expenses", "Net"],
      ["Enero", 2199000, 1571533, 627467],
      ["Febrero", 2239000, 1379627, 859373],
      ["Total", 16161000, 7734546, 8426454],
    ];
    const result = parseMonthlySummarySheet(rows);
    expect(result).toEqual([
      { month: "Enero", income: 2199000, expenses: 1571533, net: 627467 },
      { month: "Febrero", income: 2239000, expenses: 1379627, net: 859373 },
    ]);
  });
});

describe("matchIdentifiers", () => {
  it("auto-matches a unit by digits appearing as a whole word in the property name", () => {
    const rows = parseTransactionsSheet([
      HEADER,
      [
        "2026-01-05",
        "Enero 2026",
        "Income",
        "unit",
        "301",
        "Rent",
        430000,
        undefined,
        undefined,
      ],
    ]);
    const { resolved, unresolved } = matchIdentifiers(
      rows,
      [property()],
      [],
      [],
    );
    expect(unresolved).toEqual([]);
    expect(resolved[0].matchedPropertyId).toBe("prop-301");
  });

  it("never requires a category match for Income rows (e.g. Rent) — Income has no categoryId in this app", () => {
    const rows = parseTransactionsSheet([
      HEADER,
      [
        "2026-01-05",
        "Enero 2026",
        "Income",
        "unit",
        "301",
        "Rent",
        430000,
        undefined,
        undefined,
      ],
    ]);
    // No categories passed at all — "Rent" must still resolve cleanly.
    const { resolved, unresolved } = matchIdentifiers(rows, [property()], [], []);
    expect(unresolved).toEqual([]);
    expect(resolved[0].matchedCategoryId).toBeUndefined();
  });

  it("matches categories case/accent-insensitively", () => {
    const rows = parseTransactionsSheet([
      HEADER,
      [
        "2026-01-02",
        "Enero 2026",
        "Expense",
        "unit",
        "301",
        "administración 10%",
        219900,
        undefined,
        undefined,
      ],
    ]);
    const { resolved, unresolved } = matchIdentifiers(
      rows,
      [property()],
      [category({ categoryId: "cat-admin", name: "Administración 10%" })],
      [],
    );
    expect(unresolved).toEqual([]);
    expect(resolved[0].matchedCategoryId).toBe("cat-admin");
  });

  it("leaves an unmatched unit unresolved rather than guessing", () => {
    const rows = parseTransactionsSheet([
      HEADER,
      [
        "2026-01-05",
        "Enero 2026",
        "Income",
        "unit",
        "999",
        "Rent",
        430000,
        undefined,
        undefined,
      ],
    ]);
    const { resolved, unresolved } = matchIdentifiers(
      rows,
      [property()],
      [category({ name: "Rent" })],
      [],
    );
    expect(resolved).toEqual([]);
    expect(unresolved).toEqual([
      { kind: "unit", sourceValue: "999", rowCount: 1 },
    ]);
  });

  it("auto-selects the building for building-scoped rows only when exactly one building exists", () => {
    const rows = parseTransactionsSheet([
      HEADER,
      [
        "2026-01-02",
        "Enero 2026",
        "Expense",
        "building",
        "(building)",
        "EMCALI",
        255129,
        undefined,
        undefined,
      ],
    ]);
    const { resolved, unresolved } = matchIdentifiers(
      rows,
      [],
      [category()],
      [building()],
    );
    expect(unresolved).toEqual([]);
    expect(resolved[0].matchedBuildingId).toBe("bldg-1");
  });

  it("leaves building-scoped rows unresolved when there are multiple buildings to choose from", () => {
    const rows = parseTransactionsSheet([
      HEADER,
      [
        "2026-01-02",
        "Enero 2026",
        "Expense",
        "building",
        "(building)",
        "EMCALI",
        255129,
        undefined,
        undefined,
      ],
    ]);
    const { resolved, unresolved } = matchIdentifiers(
      rows,
      [],
      [category()],
      [building(), building({ buildingId: "bldg-2", name: "Other" })],
    );
    expect(resolved).toEqual([]);
    expect(unresolved).toEqual([
      { kind: "building", sourceValue: "(building)", rowCount: 1 },
    ]);
  });

  it("applies manual overrides in preference to auto-matching", () => {
    const rows = parseTransactionsSheet([
      HEADER,
      [
        "2026-01-05",
        "Enero 2026",
        "Income",
        "unit",
        "999",
        "Rent",
        430000,
        undefined,
        undefined,
      ],
    ]);
    const { resolved, unresolved } = matchIdentifiers(
      rows,
      [property()],
      [category({ name: "Rent" })],
      [],
      { units: { "999": "prop-301" } },
    );
    expect(unresolved).toEqual([]);
    expect(resolved[0].matchedPropertyId).toBe("prop-301");
  });
});

describe("buildImportRows", () => {
  it("builds a unit-scoped income input", () => {
    const rows = parseTransactionsSheet([
      HEADER,
      [
        "2026-01-05",
        "Enero 2026",
        "Income",
        "unit",
        "301",
        "Rent",
        430000,
        undefined,
        undefined,
      ],
    ]);
    const { resolved } = matchIdentifiers(
      rows,
      [property()],
      [category({ name: "Rent" })],
      [],
    );
    const { expenseInputs, incomeInputs } = buildImportRows(resolved);
    expect(expenseInputs).toEqual([]);
    expect(incomeInputs).toEqual([
      { propertyId: "prop-301", amount: 430000, date: "2026-01-05", notes: undefined },
    ]);
  });

  it("builds a building-scoped expense input tagged source: manual", () => {
    const rows = parseTransactionsSheet([
      HEADER,
      [
        "2026-01-02",
        "Enero 2026",
        "Expense",
        "building",
        "(building)",
        "EMCALI",
        255129,
        undefined,
        undefined,
      ],
    ]);
    const { resolved } = matchIdentifiers(rows, [], [category()], [building()]);
    const { expenseInputs, incomeInputs } = buildImportRows(resolved);
    expect(incomeInputs).toEqual([]);
    expect(expenseInputs).toEqual([
      {
        buildingId: "bldg-1",
        propertyId: undefined,
        amount: 255129,
        date: "2026-01-02",
        categoryId: "cat-emcali",
        source: "manual",
        notes: undefined,
      },
    ]);
  });
});

describe("computeReconciliation", () => {
  it("matches known-good totals from the real source file with zero delta", () => {
    const summary = [
      { month: "Enero", income: 2199000, expenses: 1571533, net: 627467 },
    ];
    const incomeInputs = [
      { propertyId: "p1", amount: 430000, date: "2026-01-05" },
      { propertyId: "p2", amount: 550000, date: "2026-01-05" },
      { propertyId: "p3", amount: 430000, date: "2026-01-08" },
      { propertyId: "p4", amount: 789000, date: "2026-01-19" },
    ];
    const expenseInputs = [
      {
        buildingId: "b1",
        amount: 255129,
        date: "2026-01-02",
        categoryId: "c1",
        source: "manual" as const,
      },
      {
        propertyId: "p4",
        amount: 300000,
        date: "2026-01-02",
        categoryId: "c2",
        source: "manual" as const,
      },
      {
        propertyId: "p4",
        amount: 120000,
        date: "2026-01-02",
        categoryId: "c3",
        source: "manual" as const,
      },
      {
        buildingId: "b1",
        amount: 172506,
        date: "2026-01-11",
        categoryId: "c4",
        source: "manual" as const,
      },
      {
        buildingId: "b1",
        amount: 23998,
        date: "2026-01-12",
        categoryId: "c5",
        source: "manual" as const,
      },
      {
        buildingId: "b1",
        amount: 180000,
        date: "2026-01-23",
        categoryId: "c6",
        source: "manual" as const,
      },
      {
        propertyId: "p4",
        amount: 150000,
        date: "2026-01-23",
        categoryId: "c2",
        source: "manual" as const,
      },
      {
        propertyId: "p4",
        amount: 150000,
        date: "2026-01-23",
        categoryId: "c3",
        source: "manual" as const,
      },
      {
        buildingId: "b1",
        amount: 219900,
        date: "2026-01-31",
        categoryId: "c7",
        source: "manual" as const,
      },
    ];
    const result = computeReconciliation(expenseInputs, incomeInputs, summary);
    expect(result).toEqual([
      {
        month: "Enero",
        expectedIncome: 2199000,
        expectedExpenses: 1571533,
        expectedNet: 627467,
        computedIncome: 2199000,
        computedExpenses: 1571533,
        computedNet: 627467,
        incomeDelta: 0,
        expensesDelta: 0,
        netDelta: 0,
      },
    ]);
  });

  it("surfaces a nonzero delta when computed totals don't match the sheet", () => {
    const summary = [
      { month: "Enero", income: 2199000, expenses: 1571533, net: 627467 },
    ];
    const incomeInputs = [
      { propertyId: "p1", amount: 100000, date: "2026-01-05" },
    ];
    const result = computeReconciliation([], incomeInputs, summary);
    expect(result[0].incomeDelta).toBe(100000 - 2199000);
  });
});
