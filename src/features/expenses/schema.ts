import { z } from "zod";
import { STARTER_CATEGORIES } from "../../types";

export const expenseInputSchema = z.object({
  propertyId: z.string().min(1, "Select a property"),
  vendor: z.string().trim().min(1, "Vendor is required"),
  amount: z.coerce.number().refine((n) => !Number.isNaN(n) && n > 0, {
    message: "Enter an amount greater than zero",
  }),
  date: z.string().min(1, "Date is required"),
  category: z.enum(STARTER_CATEGORIES),
});

export type ExpenseInput = z.infer<typeof expenseInputSchema>;
