import type { Language } from "../types";

// "YYYY-MM" -> "August 2026" / "agosto de 2026", matching the account's
// language (same locale choices as lib/currency.ts's formatters). Built
// via explicit local year/month components rather than parsing the
// string as a Date, to avoid any timezone-shift ambiguity.
export function formatMonthLabel(month: string, language: Language): string {
  const [year, monthNum] = month.split("-").map(Number);
  const date = new Date(year, monthNum - 1, 1);
  const locale = language === "es" ? "es-CO" : "en-US";
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(date);
}
