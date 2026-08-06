import { z } from "zod";
import type { TranslateFn } from "../../i18n/useTranslation";

// A function rather than a module-level constant since the validation
// message needs the account's current language (Outcome 5) — zod schemas
// can't be React components, so the owning component calls this each
// render instead.
export function createPropertyInputSchema(t: TranslateFn) {
  return z.object({
    name: z.string().trim().min(1, t("validation.propertyNameRequired")),
    address: z.string().trim().optional(),
  });
}

export type PropertyInput = z.infer<
  ReturnType<typeof createPropertyInputSchema>
>;
