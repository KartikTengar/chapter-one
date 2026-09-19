/**
 * Pure simulation utilities — demonstrate game mechanics without any
 * production writes. Always clearly labelled as simulation.
 */
import { calculateTrailScore, calculateStreak } from './trail.js';

export function simulateScores(count: number) {
  const rows = [];
  for (let position = 1; position <= count; position++) {
    rows.push({ position, points: calculateTrailScore(position) });
  }
  return rows;
}

/** Simulate 10 simultaneous successful submissions → unique positions 1..10. */
export function simulateConcurrentPositions(count = 10) {
  const positions = [];
  for (let i = 1; i <= count; i++) {
    positions.push({ request: i, allocated_position: i, points: calculateTrailScore(i) });
  }
  return {
    requests: count,
    allocated: positions,
    unique: new Set(positions.map((p) => p.allocated_position)).size === count,
  };
}

export function simulateWrongAnswer() {
  return {
    result: "rejected",
    points: 0,
    position: null,
    progression: "none",
  };
}

export function simulateWrongTrail() {
  return {
    result: "wrong trail",
    points: 0,
    position: null,
    progression: "none",
    disclosure: "none",
  };
}

export function simulateDuplicate() {
  return {
    submissions: 2,
    completions: 1,
    score_grants: 1,
    positions: 1,
  };
}

export function simulateEngagement() {
  const streak = calculateStreak([
    { kind: "success" },
    { kind: "success" },
    { kind: "success" },
    { kind: "wrong" },
    { kind: "success" },
  ]);
  return {
    streak_current: streak.current,
    streak_best: streak.best,
    achievements: [
      { code: "FINISHER", eligible: true },
      { code: "PERFECT_TRAIL", eligible: false, reason: "wrong answer present" },
      { code: "PHOTO_HUNTER", eligible: true },
    ],
  };
}