export type CategoryStatus = "active" | "archived";

// Categories are full account-owned records now, not a fixed literal union
// — Story 1.6 (PRD §12) makes them fully editable per account: add, rename,
// archive. Mirrors the Property shape.
export interface Category {
  categoryId: string;
  name: string;
  status: CategoryStatus;
  createdAt: string;
}

// Seed data only — written once into a new (or migrated) account's
// Categories tab, then never referenced again as a type constraint. See
// PRD §11 for the Spanish-account starter set, added when Outcome 5 lands.
export const STARTER_CATEGORIES = [
  "Repairs & Maintenance",
  "Insurance",
  "Utilities",
  "Property Management Fees",
  "Cleaning",
] as const;
