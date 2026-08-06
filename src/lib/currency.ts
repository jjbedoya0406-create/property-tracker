import type { Currency } from "../types";

// USD: standard comma-thousands, 2-decimal format (unchanged v1 behavior).
const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

// COP: no decimal places, period as the thousands separator (e.g.
// "$430.000") — the conventional Colombian format, per PRD §5/§16.
const copFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number, currency: Currency): string {
  return currency === "COP"
    ? copFormatter.format(amount)
    : usdFormatter.format(amount);
}

// Parses raw user-typed text into a numeric amount, respecting the
// currency's conventions. Critically, for COP this never treats "." as a
// decimal point — COP uses it as a thousands separator, and naively
// running USD-style parsing on "430.000" would silently misread 430,000
// pesos as 430 (PRD §10's 1000x misread risk). COP also has no decimal
// places in practice, so any non-digit character is just stripped.
export function parseCurrencyAmount(raw: string, currency: Currency): number {
  if (currency === "COP") {
    const digitsOnly = raw.replace(/[^\d]/g, "");
    return digitsOnly ? Number(digitsOnly) : NaN;
  }
  return Number(raw.replace(/,/g, ""));
}
