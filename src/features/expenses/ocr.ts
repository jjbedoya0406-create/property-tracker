import { createWorker } from "tesseract.js";
import type { Currency, Language } from "../../types";

export interface OcrGuess {
  vendor?: string;
  amount?: number;
  date?: string;
}

const TESSERACT_LANGUAGE: Record<Language, string> = {
  en: "eng",
  es: "spa",
};

// On-device OCR (PRD §5) — no API keys, but lower accuracy than a cloud
// service. Acceptable because every field here is user-editable before
// saving (§6: "OCR is a shortcut, never a gate"). Language picks the
// Tesseract traineddata to use (Outcome 5, Story 5.3) — accuracy on
// Spanish receipts is unverified, same accepted-risk framing as English.
export async function recognizeReceiptText(
  image: Blob,
  language: Language,
): Promise<string> {
  const worker = await createWorker(TESSERACT_LANGUAGE[language]);
  try {
    const {
      data: { text },
    } = await worker.recognize(image);
    return text;
  } finally {
    await worker.terminate();
  }
}

// USD receipts print "$1,234.56" (comma thousands, 2 decimals). COP
// receipts print "$430.000" (period thousands, no decimals) — a
// structurally different number, not just a different symbol. Reusing the
// USD pattern on a COP receipt would land squarely in the 1000x misread
// risk flagged in PRD §10.
const AMOUNT_PATTERN_USD = /\$?\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2}))/g;
const AMOUNT_PATTERN_COP = /\$?\s?(\d{1,3}(?:\.\d{3})+)/g;
const DATE_PATTERN = /(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/;

// Best-effort heuristics only — receipts vary wildly in layout, so these are
// starting guesses for the confirm screen, not a reliable parser. `currency`
// selects both the amount number format (see above) and the date field
// order — US receipts print MM/DD, Colombian receipts print DD/MM.
export function extractGuessesFromText(
  text: string,
  currency: Currency,
): OcrGuess {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const vendor = lines[0];

  // Prefer the last line mentioning "total" as its own word (usually the
  // grand total, at the bottom) while explicitly excluding "subtotal" —
  // /total/i alone would match inside "SUBTOTAL" too, and since subtotal
  // prints above the real total on most receipts, a naive first-match search
  // grabs the wrong (smaller) number. Fall back to the largest dollar-looking
  // number anywhere in the text if no such line is found.
  const totalLine = [...lines]
    .reverse()
    .find((line) => /\btotal\b/i.test(line) && !/sub[\s-]?total/i.test(line));
  const amountSource = totalLine ?? text;
  const amountPattern =
    currency === "COP" ? AMOUNT_PATTERN_COP : AMOUNT_PATTERN_USD;
  const amounts = Array.from(amountSource.matchAll(amountPattern)).map(
    (match) =>
      currency === "COP"
        ? Number(match[1].replace(/\./g, ""))
        : Number(match[1].replace(/,/g, "")),
  );
  const amount = amounts.length > 0 ? Math.max(...amounts) : undefined;

  const dateMatch = text.match(DATE_PATTERN);
  const date = dateMatch
    ? normalizeDate(dateMatch, currency === "COP" ? "DMY" : "MDY")
    : undefined;

  return { vendor, amount, date };
}

// `order` picks which field is the month vs the day — a guess the user can
// correct either way.
function normalizeDate(
  match: RegExpMatchArray,
  order: "MDY" | "DMY",
): string | undefined {
  const first = Number(match[1]);
  const second = Number(match[2]);
  let year = Number(match[3]);
  if (year < 100) {
    year += 2000;
  }
  const month = order === "MDY" ? first : second;
  const day = order === "MDY" ? second : first;
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return undefined;
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
