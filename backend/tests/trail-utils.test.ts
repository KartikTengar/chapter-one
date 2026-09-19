import { describe, it, expect } from "vitest";
import { calculateTrailScore, normalizeAnswer, calculateStreak, deriveDisplayName } from "../src/utils/trail";

describe("calculateTrailScore", () => {
  it("awards the exact CHAPTER ONE table", () => {
    const expected: Record<number, number> = {
      1: 100, 2: 98, 3: 94, 4: 88, 5: 80,
      6: 70, 7: 58, 8: 44, 9: 30, 10: 30,
      11: 30, 100: 30,
    };
    for (const [position, points] of Object.entries(expected)) {
      expect(calculateTrailScore(Number(position))).toBe(points);
    }
  });

  it("never goes below the score floor", () => {
    expect(calculateTrailScore(500)).toBe(30);
    expect(calculateTrailScore(1, 100, 10)).toBe(100);
    expect(calculateTrailScore(50, 100, 10)).toBe(10);
  });

  it("clamps invalid positions to at least 1", () => {
    expect(calculateTrailScore(0)).toBe(100);
    expect(calculateTrailScore(-3)).toBe(100);
  });
});

describe("normalizeAnswer", () => {
  it("trims whitespace and lowercases when not case-sensitive", () => {
    expect(normalizeAnswer("  KEYBOARD ")).toBe("keyboard");
    expect(normalizeAnswer("keyboard")).toBe("keyboard");
    expect(normalizeAnswer(" Keyboard ")).toBe("keyboard");
  });

  it("preserves case when case-sensitive", () => {
    expect(normalizeAnswer("  KEYBOARD ", true)).toBe("KEYBOARD");
  });

  it("does not fuzzy-match near answers", () => {
    expect(normalizeAnswer("keybord")).not.toBe("keyboard");
  });
});

describe("calculateStreak", () => {
  it("counts consecutive successes", () => {
    const streak = calculateStreak([
      { kind: "success" }, { kind: "success" }, { kind: "success" },
    ]);
    expect(streak.current).toBe(3);
    expect(streak.best).toBe(3);
  });

  it("resets on a wrong answer and tracks best", () => {
    const streak = calculateStreak([
      { kind: "success" },
      { kind: "success" },
      { kind: "wrong" },
      { kind: "success" },
    ]);
    expect(streak.current).toBe(1);
    expect(streak.best).toBe(2);
  });
});

describe("deriveDisplayName", () => {
  it("respects FULL_NAME, FIRST_NAME, INITIALS modes", () => {
    expect(deriveDisplayName("Aarav Sharma", "FULL_NAME")).toBe("Aarav Sharma");
    expect(deriveDisplayName("Aarav Sharma", "FIRST_NAME")).toBe("Aarav");
    expect(deriveDisplayName("Aarav Sharma", "INITIALS")).toBe("AS");
  });

  it("falls back safely", () => {
    expect(deriveDisplayName(null, "FIRST_NAME")).toBe("Student");
    expect(deriveDisplayName("  ", "FULL_NAME")).toBe("Student");
  });
});