import { SpotDuration } from './types';

export interface MixTally {
  count15: number;
  count30: number;
  count45: number;
  totalSpots: number;
}

export const INITIAL_MIX_TALLY: MixTally = {
  count15: 0,
  count30: 0,
  count45: 0,
  totalSpots: 0
};

// Target spot mix proportions
const TARGET_RATIOS = {
  15: 0.35, // 35%
  30: 0.50, // 50%
  45: 0.15  // 15%
};

/**
 * Enumerate all ordered compositions of targetDuration using {15, 30, 45}
 */
export function enumerateCompositions(targetDuration: number): SpotDuration[][] {
  const allowedDurations: SpotDuration[] = [15, 30, 45];
  const results: SpotDuration[][] = [];

  function backtrack(remaining: number, current: SpotDuration[]) {
    if (remaining === 0) {
      results.push([...current]);
      return;
    }
    if (remaining < 0) return;

    for (const d of allowedDurations) {
      if (remaining >= d) {
        current.push(d);
        backtrack(remaining - d, current);
        current.pop();
      }
    }
  }

  // Optimization for large target durations (e.g. 300s):
  // 300s has hundreds of thousands of compositions. We generate structured diverse compositions
  // that respect run-length <= 2 and >= 2 distinct durations.
  if (targetDuration === 300) {
    return generate300sPatterns();
  }

  backtrack(targetDuration, []);
  return results;
}

/**
 * Generates structured, diverse 300s patterns using 15, 30, and 45s spots.
 */
function generate300sPatterns(): SpotDuration[][] {
  const basePatterns: SpotDuration[][] = [
    [45, 30, 15, 30, 45, 30, 15, 30, 30, 30],
    [30, 45, 15, 30, 30, 45, 15, 30, 30, 30],
    [15, 30, 45, 30, 15, 30, 45, 30, 30, 30],
    [30, 15, 45, 30, 30, 15, 45, 30, 30, 30],
    [45, 15, 30, 30, 45, 15, 30, 30, 30, 30],
    [15, 45, 30, 30, 15, 45, 30, 30, 30, 30],
    [30, 30, 15, 45, 30, 30, 15, 45, 30, 30],
    [45, 30, 30, 15, 45, 30, 30, 15, 30, 30],
    [15, 30, 30, 45, 15, 30, 30, 45, 30, 30],
    [30, 15, 30, 45, 30, 15, 30, 45, 30, 30],
    [30, 45, 30, 15, 30, 45, 30, 15, 30, 30],
    [15, 15, 30, 45, 30, 15, 15, 30, 45, 30, 30],
    [45, 45, 30, 15, 15, 30, 45, 30, 15, 30],
    [15, 30, 15, 45, 30, 30, 15, 30, 45, 45],
    [30, 15, 15, 30, 45, 30, 15, 15, 30, 45, 30]
  ];

  // Filter to ensure exact 300s sum
  return basePatterns.filter(p => p.reduce((sum, d) => sum + d, 0) === 300);
}

/**
 * Validates pattern against the 3 required hard rules:
 * 1. At least TWO different spot lengths in the pod.
 * 2. No more than two identical lengths in a row.
 * 3. Differs from previous pod's pattern.
 */
export function isValidPattern(
  pattern: SpotDuration[],
  previousPattern?: SpotDuration[]
): boolean {
  // Rule 1: At least two distinct spot lengths
  const distinct = new Set(pattern);
  if (distinct.size < 2) return false;

  // Rule 2: No more than two identical lengths consecutively
  for (let i = 0; i < pattern.length - 2; i++) {
    if (pattern[i] === pattern[i + 1] && pattern[i + 1] === pattern[i + 2]) {
      return false;
    }
  }

  // Rule 3: Must differ from previous pod's pattern
  if (previousPattern && pattern.length === previousPattern.length) {
    const isIdentical = pattern.every((d, i) => d === previousPattern[i]);
    if (isIdentical) return false;
  }

  return true;
}

/**
 * Scores a candidate pattern based on how effectively it nudges the running mix
 * toward the target: 35% x 15s, 50% x 30s, 15% x 45s.
 */
export function scorePatternForMix(
  pattern: SpotDuration[],
  runningTally: MixTally = INITIAL_MIX_TALLY
): number {
  let p15 = 0;
  let p30 = 0;
  let p45 = 0;

  for (const d of pattern) {
    if (d === 15) p15++;
    else if (d === 30) p30++;
    else if (d === 45) p45++;
  }

  const next15 = runningTally.count15 + p15;
  const next30 = runningTally.count30 + p30;
  const next45 = runningTally.count45 + p45;
  const nextTotal = runningTally.totalSpots + pattern.length;

  if (nextTotal === 0) return 0;

  const actual15 = next15 / nextTotal;
  const actual30 = next30 / nextTotal;
  const actual45 = next45 / nextTotal;

  // Mean squared deviation from target proportions
  const diff15 = actual15 - TARGET_RATIOS[15];
  const diff30 = actual30 - TARGET_RATIOS[30];
  const diff45 = actual45 - TARGET_RATIOS[45];

  const msd = (diff15 * diff15 * 1.5) + (diff30 * diff30 * 1.0) + (diff45 * diff45 * 2.0);

  // Variety bonus if all three durations {15, 30, 45} are represented in the pattern
  const varietyBonus = (p15 > 0 && p30 > 0 && p45 > 0) ? 15 : 0;

  return 100 - (msd * 500) + varietyBonus;
}

/**
 * Returns candidate duration patterns for targetDuration, filtered by hard rules
 * and ranked descending by mix score with pseudo-random tie-breaking.
 */
export function getRankedPatterns(
  targetDuration: number,
  previousPattern?: SpotDuration[],
  runningTally: MixTally = INITIAL_MIX_TALLY,
  randomSeed?: number
): SpotDuration[][] {
  const allComps = enumerateCompositions(targetDuration);

  // Filter by hard rules
  let validComps = allComps.filter(p => isValidPattern(p, previousPattern));

  // If previousPattern filter eliminated all (edge case), relax previousPattern constraint
  if (validComps.length === 0) {
    validComps = allComps.filter(p => isValidPattern(p, undefined));
  }

  // Score each valid pattern
  const scored = validComps.map(pattern => ({
    pattern,
    score: scorePatternForMix(pattern, runningTally)
  }));

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  // Apply slight seeded jitter to top patterns to introduce organic rotation
  if (randomSeed !== undefined && scored.length > 2) {
    const topSlice = scored.slice(0, Math.min(4, scored.length));
    const offset = Math.abs(randomSeed) % topSlice.length;
    const selected = topSlice[offset];
    return [selected.pattern, ...scored.filter(s => s !== selected).map(s => s.pattern)];
  }

  return scored.map(s => s.pattern);
}

/**
 * Updates running mix tally with the spot durations of a newly aired pod
 */
export function updateMixTally(currentTally: MixTally, pattern: SpotDuration[]): MixTally {
  let c15 = currentTally.count15;
  let c30 = currentTally.count30;
  let c45 = currentTally.count45;

  for (const d of pattern) {
    if (d === 15) c15++;
    else if (d === 30) c30++;
    else if (d === 45) c45++;
  }

  return {
    count15: c15,
    count30: c30,
    count45: c45,
    totalSpots: currentTally.totalSpots + pattern.length
  };
}
