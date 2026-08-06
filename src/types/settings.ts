export type Language = "en" | "es";
export type Currency = "USD" | "COP";

// One row per spreadsheet (PRD §8) — drives Outcome 5's per-account
// language/currency/OCR/category-defaults behavior. In practice the two
// known accounts always pair en+USD or es+COP, but the two settings are
// independent values (PRD §16 Story 5.2), not derived from each other.
export interface Settings {
  language: Language;
  currency: Currency;
}
