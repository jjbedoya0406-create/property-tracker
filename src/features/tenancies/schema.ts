import { z } from "zod";
import type { TranslateFn } from "../../i18n/useTranslation";

export function createTenancyInputSchema(t: TranslateFn) {
  return z.object({
    contractStart: z.string().min(1, t("validation.dateRequired")),
    expectedEndDate: z.string().trim().optional(),
    rentRate: z.coerce.number().refine((n) => !Number.isNaN(n) && n > 0, {
      message: t("validation.amountInvalid"),
    }),
  });
}

export type TenancyInput = z.infer<
  ReturnType<typeof createTenancyInputSchema>
>;
