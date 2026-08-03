// Fixed starter list per PRD Section 7 (Story 1.5). Custom categories are
// explicitly out of scope for v1 (PRD Section 11).
export const STARTER_CATEGORIES = [
  "Repairs & Maintenance",
  "Insurance",
  "Utilities",
  "Property Management Fees",
  "Cleaning",
] as const;

export type Category = (typeof STARTER_CATEGORIES)[number];
