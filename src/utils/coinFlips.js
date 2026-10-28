import seedrandom from 'seedrandom';
import { logCheckpoints } from './stats';

// Flip `flips` coins per run and record the running share of heads at log-spaced points.
export function simulateRuns({ flips, p, runs, seed }) {
  const rng = seedrandom(seed ?? '');
  const checkpoints = logCheckpoints(flips);
  const results = [];

  for (let r = 0; r < runs; r += 1) {
    const points = [];
    let heads = 0;
    let streak = 0;
    let longest = 0;
    let next = 0;

    for (let n = 1; n <= flips; n += 1) {
      if (rng() < p) {
        heads += 1;
        streak += 1;
        if (streak > longest) longest = streak;
      } else {
        streak = 0;
      }
      if (n === checkpoints[next]) {
        points.push([n, heads / n]);
        next += 1;
      }
    }

    results.push({ points, heads, longestHeadsStreak: longest });
  }

  return results;
}

// Expected longest run of heads in n flips (Schilling's approximation).
export const typicalLongestStreak = (n, p) =>
  (Math.log(n * (1 - p)) + 0.5772) / Math.log(1 / p) - 0.5;
