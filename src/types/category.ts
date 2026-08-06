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
// Categories tab, based on the account's chosen language (Outcome 5), then
// never referenced again as a type constraint.
export const STARTER_CATEGORIES = [
  "Repairs & Maintenance",
  "Insurance",
  "Utilities",
  "Property Management Fees",
  "Cleaning",
] as const;

// Confirmed from Jason's mom's existing Excel workflow (PRD §11) — a
// distinct starting point, not a translation of the English list above.
// Note EMCALI/Gases de Occidente/Claro Hogar are simultaneously vendor and
// category for her; that overlap is intentional, not an error.
export const SPANISH_STARTER_CATEGORIES = [
  "EMCALI",
  "Gases de Occidente",
  "Claro Hogar",
  "Limpieza Áreas Comunes",
  "Implementos de Limpieza",
  "Administración 10%",
  "Arreglos - Mano de Obra",
  "Arreglos - Materiales",
] as const;
