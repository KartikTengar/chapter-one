/**
 * Pure Hidden Trail utilities — unit-testable, no I/O.
 */

/**
 * Exact CHAPTER ONE scoring formula.
 *
 * points = max(scoreFloor, startingScore - n(n-1))
 *
 * n = successful completion position.
 * Default: startingScore = 100, scoreFloor = 30.
 *
 * n=1 -> 100, 2 -> 98, 3 -> 94, 4 -> 88, 5 -> 80,
 * 6 -> 70, 7 -> 58, 8 -> 44, 9 -> 30, 10+ -> 30
 */
export function calculateTrailScore(position: number, startingScore = 100, scoreFloor = 30): number {
  const n = Math.max(1, Math.floor(position));
  return Math.max(scoreFloor, startingScore - n * (n - 1));
}

/**
 * Normalize an answer before comparison.
 * Trims whitespace and lowercases unless the level is case-sensitive.
 */
export function normalizeAnswer(answer: string, caseSensitive = false): string {
  const trimmed = answer.trim();
  return caseSensitive ? trimmed : trimmed.toLowerCase();
}

export type StreakEvent = { kind: "success" } | { kind: "wrong" };

/**
 * Current + best streak from a chronological event sequence.
 * A success increments; a wrong answer resets to 0.
 */
export function calculateStreak(events: StreakEvent[]): { current: number; best: number } {
  let current = 0;
  let best = 0;
  for (const event of events) {
    if (event.kind === "success") {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return { current, best };
}

export type DisplayNameMode = "FULL_NAME" | "FIRST_NAME" | "INITIALS" | "PARTICIPANT_NUMBER";

/**
 * Derive the public display name for a participant profile under a
 * configured leaderboard name mode. Falls back safely.
 */
export function deriveDisplayName(
  fullName: string | null | undefined,
  mode: DisplayNameMode = "FIRST_NAME",
  participantNumber?: string | null
): string {
  const full = fullName?.trim() || "Student";
  switch (mode) {
    case "FULL_NAME":
      return full;
    case "INITIALS": {
      const initials = full
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 3);
      return initials || "S";
    }
    case "PARTICIPANT_NUMBER":
      return participantNumber ? `P${participantNumber}` : "Student";
    case "FIRST_NAME":
    default:
      return full.split(/\s+/)[0] || "Student";
  }
}