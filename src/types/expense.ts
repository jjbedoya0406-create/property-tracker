export type ExpenseSource = "ocr" | "manual";

export interface Expense {
  expenseId: string;
  propertyId: string;
  amount: number;
  date: string;
  vendor: string;
  // References a Categories row (Category.categoryId) rather than storing
  // the name directly — renaming a category then updates everywhere it's
  // used without touching past expense rows (PRD §8, Story 1.6).
  categoryId: string;
  receiptDriveUrl?: string;
  source: ExpenseSource;
  createdAt: string;
  editedAt?: string;
}
