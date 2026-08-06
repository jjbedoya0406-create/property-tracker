import { z } from "zod";
import type { TranslateFn } from "../../i18n/useTranslation";

export function createCategoryInputSchema(t: TranslateFn) {
  return z.object({
    name: z.string().trim().min(1, t("validation.categoryNameRequired")),
  });
}

export type CategoryInput = z.infer<
  ReturnType<typeof createCategoryInputSchema>
>;
