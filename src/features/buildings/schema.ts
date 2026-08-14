import { z } from "zod";
import type { TranslateFn } from "../../i18n/useTranslation";

export function createPromotePropertyInputSchema(t: TranslateFn) {
  return z.object({
    buildingName: z.string().trim().min(1, t("validation.buildingNameRequired")),
    newUnitName: z.string().trim().min(1, t("validation.unitNameRequired")),
  });
}

export function createAddUnitInputSchema(t: TranslateFn) {
  return z.object({
    unitName: z.string().trim().min(1, t("validation.unitNameRequired")),
  });
}
