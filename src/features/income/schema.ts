import { z } from "zod";
import type { TranslateFn } from "../../i18n/useTranslation";

export function createIncomeInputSchema(t: TranslateFn) {
  return z.object({
    amount: z.coerce.number().refine((n) => !Number.isNaN(n) && n > 0, {
      message: t("validation.amountInvalid"),
    }),
    date: z.string().min(1, t("validation.dateRequired")),
    notes: z.string().trim().optional(),
  });
}

export type IncomeInput = z.infer<ReturnType<typeof createIncomeInputSchema>>;
