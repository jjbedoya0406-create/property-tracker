// Normalizes all-caps strings (a common OCR artifact) into Title Case, e.g.
// "HOME DEPOT" -> "Home Depot" (UI_Polish_Handoff_v1.md: "sentence case,
// never all-caps"). Leaves already-mixed-case input untouched — forcing a
// transform there would mangle intentional casing like "McDonald's".
export function toDisplayCase(value: string): string {
  if (/[a-z]/.test(value)) {
    return value;
  }
  return value
    .toLowerCase()
    .replace(
      /(^|\s)([a-z])/g,
      (_match, boundary: string, letter: string) =>
        boundary + letter.toUpperCase(),
    );
}
