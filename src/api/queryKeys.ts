// Central query-key factory so key shapes stay consistent across hooks and
// invalidations don't rely on hand-typed arrays drifting out of sync.
export const queryKeys = {
  properties: {
    all: ["properties"] as const,
    list: (status?: "active" | "archived") =>
      ["properties", "list", status ?? "all"] as const,
    detail: (propertyId: string) =>
      ["properties", "detail", propertyId] as const,
  },
  expenses: {
    all: ["expenses"] as const,
    byProperty: (propertyId: string) =>
      ["expenses", "byProperty", propertyId] as const,
  },
  categories: {
    all: ["categories"] as const,
    list: () => ["categories", "list"] as const,
  },
  income: {
    all: ["income"] as const,
    byProperty: (propertyId: string) =>
      ["income", "byProperty", propertyId] as const,
  },
  tenancies: {
    all: ["tenancies"] as const,
    byProperty: (propertyId: string) =>
      ["tenancies", "byProperty", propertyId] as const,
  },
  buildings: {
    all: ["buildings"] as const,
    list: () => ["buildings", "list"] as const,
  },
  connectedPortfolios: {
    all: ["connectedPortfolios"] as const,
    list: () => ["connectedPortfolios", "list"] as const,
  },
  closedYears: {
    all: ["closedYears"] as const,
    list: () => ["closedYears", "list"] as const,
  },
};
