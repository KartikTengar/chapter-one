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
export function calculateTrailScore(position, startingScore = 100, scoreFloor = 30) {
    const n = Math.max(1, Math.floor(position));
    return Math.max(scoreFloor, startingScore - n * (n - 1));
}
/**
 * Normalize an answer before comparison.
 * Trims whitespace and lowercases unless the level is case-sensitive.
 */
export function normalizeAnswer(answer, caseSensitive = false) {
    const trimmed = answer.trim();
    return caseSensitive ? trimmed : trimmed.toLowerCase();
}
/**
 * Current + best streak from a chronological event sequence.
 * A success increments; a wrong answer resets to 0.
 */
export function calculateStreak(events) {
    let current = 0;
    let best = 0;
    for (const event of events) {
        if (event.kind === "success") {
            current += 1;
            best = Math.max(best, current);
        }
        else {
            current = 0;
        }
    }
    return { current, best };
}
/**
 * Derive the public display name for a participant profile under a
 * configured leaderboard name mode. Falls back safely.
 */
export function deriveDisplayName(fullName, mode = "FIRST_NAME", participantNumber) {
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
//# sourceMappingURL=trail.js.map