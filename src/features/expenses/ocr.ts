import { createWorker } from "tesseract.js";

export interface OcrGuess {
  vendor?: string;
  amount?: number;
  date?: string;
}

// On-device OCR (PRD §5) — no API keys, but lower accuracy than a cloud
// service. Acceptable because every field here is user-editable before
// saving (§6: "OCR is a shortcut, never a gate").
export async function recognizeReceiptText(image: Blob): Promise<string> {
  const worker = await createWorker("eng");
  try {
    const {
      data: { text },
    } = await worker.recognize(image);
    return text;
  } finally {
    await worker.terminate();
  }
}

const AMOUNT_PATTERN = /\$?\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2}))/g;
const DATE_PATTERN = /(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/;

// Best-effort heuristics only — receipts vary wildly in layout, so these are
// starting guesses for the confirm screen, not a reliable parser.
export function extractGuessesFromText(text: string): OcrGuess {
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
  const amounts = Array.from(amountSource.matchAll(AMOUNT_PATTERN)).map(
    (match) => Number(match[1].replace(/,/g, "")),
  );
  const amount = amounts.length > 0 ? Math.max(...amounts) : undefined;

  const dateMatch = text.match(DATE_PATTERN);
  const date = dateMatch ? normalizeDate(dateMatch) : undefined;

  return { vendor, amount, date };
}

// Assumes MM/DD/YYYY (common on US receipts) — a guess the user can correct.
function normalizeDate(match: RegExpMatchArray): string | undefined {
  const month = Number(match[1]);
  const day = Number(match[2]);
  let year = Number(match[3]);
  if (year < 100) {
    year += 2000;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return undefined;
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
