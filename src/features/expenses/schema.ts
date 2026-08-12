import { z } from "zod";
import type { TranslateFn } from "../../i18n/useTranslation";

export function createExpenseInputSchema(t: TranslateFn) {
  return z.object({
    propertyId: z.string().min(1, t("validation.selectProperty")),
    amount: z.coerce.number().refine((n) => !Number.isNaN(n) && n > 0, {
      message: t("validation.amountInvalid"),
    }),
    date: z.string().min(1, t("validation.dateRequired")),
    categoryId: z.string().min(1, t("validation.selectCategory")),
    notes: z.string().trim().optional(),
  });
}

export type ExpenseInput = z.infer<ReturnType<typeof createExpenseInputSchema>>;
