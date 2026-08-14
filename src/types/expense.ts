export type ExpenseSource = "ocr" | "manual";

export interface Expense {
  expenseId: string;
  // Exactly one of propertyId/buildingId is set — a unit-scoped expense
  // has propertyId, a building-scoped shared expense (issue #7, e.g. the
  // building's EMCALI bill) has buildingId instead. Enforced by the form,
  // not the sheet.
  propertyId?: string;
  buildingId?: string;
  amount: number;
  date: string;
  // References a Categories row (Category.categoryId) rather than storing
  // the name directly — renaming a category then updates everywhere it's
  // used without touching past expense rows (PRD §8, Story 1.6).
  categoryId: string;
  receiptDriveUrl?: string;
  source: ExpenseSource;
  createdAt: string;
  editedAt?: string;
  notes?: string;
}
