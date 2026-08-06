import { describe, expect, it } from "vitest";
import { formatCurrency, parseCurrencyAmount } from "./currency";

describe("formatCurrency", () => {
  it("formats USD with comma-thousands and 2 decimals", () => {
    expect(formatCurrency(1234.5, "USD")).toBe("$1,234.50");
  });

  it("formats COP with period-thousands and no decimals", () => {
    // es-CO's Intl.NumberFormat inserts a non-breaking space ( )
    // between the symbol and amount — standard Colombian convention.
    expect(formatCurrency(430000, "COP")).toBe("$ 430.000");
  });
});

describe("parseCurrencyAmount", () => {
  it("parses a plain USD decimal amount", () => {
    expect(parseCurrencyAmount("1234.56", "USD")).toBe(1234.56);
  });

  it("parses a USD amount with comma thousands separators", () => {
    expect(parseCurrencyAmount("1,234.56", "USD")).toBe(1234.56);
  });

  it("parses a COP amount with period thousands separators as whole pesos, not decimals", () => {
    // The critical regression case (PRD §10): "430.000" must read as
    // 430,000 pesos, never as 430.
    expect(parseCurrencyAmount("430.000", "COP")).toBe(430000);
  });

  it("parses a plain COP digit string with no separators", () => {
    expect(parseCurrencyAmount("430000", "COP")).toBe(430000);
  });
});
