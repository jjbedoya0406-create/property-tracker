import { describe, expect, it } from "vitest";
import { extractGuessesFromText } from "./ocr";

describe("extractGuessesFromText", () => {
  it("picks the grand total, not the subtotal", () => {
    // Regression case: a receipt with a SUBTOTAL line above the TOTAL line
    // was picking 40.74 (subtotal) instead of 44.10 (total) because /total/i
    // also matches inside "SUBTOTAL".
    const text = [
      "HOME DEPOT",
      "1234 Oak Lane, Austin TX 78701",
      "#0482",
      "DATE: 05/02/2026    CASHIER: MIKE R.",
      "DESCRIPTION           AMOUNT",
      "Drywall Patch Kit      $12.47",
      "Paint Roller Set       $18.99",
      "Spackling Compound      $9.28",
      "SUBTOTAL               $40.74",
      "TAX                     $3.38",
      "TOTAL                  $44.10",
      "PAYMENT METHOD: VISA ****4521",
      "APPROVED  AUTH: 84729A",
      "THANK YOU FOR YOUR BUSINESS!",
    ].join("\n");

    const guess = extractGuessesFromText(text);

    expect(guess.amount).toBe(44.1);
    expect(guess.vendor).toBe("HOME DEPOT");
    expect(guess.date).toBe("2026-05-02");
  });
});
