import { describe, it, expect } from "vitest";

// Unit test for credit color logic (extracted from CreditCounter)
function getCreditColorClass(credits: number): string {
  return credits > 50
    ? "text-green-500"
    : credits > 10
      ? "text-yellow-500"
      : "text-red-500";
}

describe("CreditCounter color logic", () => {
  it("returns green for credits > 50", () => {
    expect(getCreditColorClass(51)).toBe("text-green-500");
    expect(getCreditColorClass(100)).toBe("text-green-500");
  });

  it("returns yellow for credits between 11 and 50", () => {
    expect(getCreditColorClass(11)).toBe("text-yellow-500");
    expect(getCreditColorClass(50)).toBe("text-yellow-500");
    expect(getCreditColorClass(30)).toBe("text-yellow-500");
  });

  it("returns red for credits <= 10", () => {
    expect(getCreditColorClass(10)).toBe("text-red-500");
    expect(getCreditColorClass(0)).toBe("text-red-500");
    expect(getCreditColorClass(1)).toBe("text-red-500");
  });
});
