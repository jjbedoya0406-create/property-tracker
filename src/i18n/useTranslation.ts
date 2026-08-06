import { useSettings } from "../portfolio/context";
import { translations, type TranslationKey } from "./translations";

export type TranslateFn = (
  key: TranslationKey,
  params?: Record<string, string>,
) => string;

function interpolate(
  template: string,
  params?: Record<string, string>,
): string {
  if (!params) {
    return template;
  }
  return Object.entries(params).reduce(
    (result, [name, value]) => result.replaceAll(`{${name}}`, value),
    template,
  );
}

// Only usable inside RequirePortfolio's tree (needs the account's Settings
// to know which language) — the sign-in screen and onboarding picker
// render before that's known and stay in fixed/bilingual copy instead.
export function useTranslation(): { t: TranslateFn } {
  const { language } = useSettings();
  const dictionary = translations[language];

  function t(key: TranslationKey, params?: Record<string, string>): string {
    return interpolate(dictionary[key], params);
  }

  return { t };
}
