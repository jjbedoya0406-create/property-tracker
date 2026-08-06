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
};
