import type { Category } from "./category";

export type ExpenseSource = "ocr" | "manual";

export interface Expense {
  expenseId: string;
  propertyId: string;
  amount: number;
  date: string;
  vendor: string;
  category: Category;
  receiptDriveUrl?: string;
  source: ExpenseSource;
  createdAt: string;
  editedAt?: string;
}
