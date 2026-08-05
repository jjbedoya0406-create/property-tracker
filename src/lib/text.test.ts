import { describe, expect, it } from "vitest";
import { toDisplayCase } from "./text";

describe("toDisplayCase", () => {
  it("converts all-caps strings to Title Case", () => {
    expect(toDisplayCase("HOME DEPOT")).toBe("Home Depot");
  });

  it("leaves already mixed-case strings untouched", () => {
    expect(toDisplayCase("Trader Joe's")).toBe("Trader Joe's");
  });
});
