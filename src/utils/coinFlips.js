import seedrandom from 'seedrandom';
import { logCheckpoints } from './stats';

/**
 * Flip `flips` coins per run and record the running share of heads at log-spaced points.
 * Run 1's full sequence is kept (1 = heads) for the sequence strip, streaks and CSV.
 */
export function simulateRuns({ flips, p, runs, seed }) {
  const rng = seedrandom(seed ?? '');
  const checkpoints = logCheckpoints(flips);
  const results = [];
  let sequence = null;

  for (let r = 0; r < runs; r += 1) {
    const points = [];
    const keep = r === 0 ? new Uint8Array(flips) : null;
    let heads = 0;
    let streak = 0;
    let longest = 0;
    let next = 0;

    for (let n = 1; n <= flips; n += 1) {
      const isHeads = rng() < p;
      if (keep) keep[n - 1] = isHeads ? 1 : 0;
      if (isHeads) {
        heads += 1;
        streak += 1;
        if (streak > longest) longest = streak;
      } else {
        streak = 0;
      }
      if (n === checkpoints[next]) {
        points.push([n, heads / n, heads - (n - heads)]);
        next += 1;
      }
    }

    if (keep) sequence = keep;
    results.push({ points, heads, longestHeadsStreak: longest });
  }

  return { runs: results, sequence };
}

// Expected longest run of heads in n flips (Schilling's approximation).
export const typicalLongestStreak = (n, p) =>
  (Math.log(n * (1 - p)) + 0.5772) / Math.log(1 / p) - 0.5;

// Runs (streaks of the same face) in a sequence: lengths of every run, in order.
export function runLengths(seq, count = seq.length) {
  const lengths = [];
  let current = 1;
  for (let i = 1; i < count; i += 1) {
    if (seq[i] === seq[i - 1]) current += 1;
    else {
      lengths.push(current);
      current = 1;
    }
  }
  if (count > 0) lengths.push(current);
  return lengths;
}

/** Expected number of runs (of either face) of length exactly L in n flips. */
export function expectedRunsOfLength(n, L, p) {
  if (L > n) return 0;
  const q = 1 - p;
  if (L === n) return p ** n + q ** n;
  // Runs touching an end need one neighbor of the other face; interior runs need two.
  const atEnds = 2 * (p ** L * q + q ** L * p);
  const interior = (n - L - 1) * (p ** L * q * q + q ** L * p * p);
  return atEnds + interior;
}

/**
 * Score a typed sequence against random fair sequences of the same length:
 * how often does a random sequence have a streak at least this long, and this many switches or fewer?
 */
export function scoreSequence(seq, trials = 10000) {
  const n = seq.length;
  const lengths = runLengths(seq);
  const longest = Math.max(...lengths);
  const switches = lengths.length - 1;
  const rng = seedrandom('real-or-fake');
  let longerStreak = 0;
  let fewerSwitches = 0;
  const randomLongest = [];
  for (let t = 0; t < trials; t += 1) {
    let prev = rng() < 0.5;
    let run = 1;
    let best = 1;
    let sw = 0;
    for (let i = 1; i < n; i += 1) {
      const cur = rng() < 0.5;
      if (cur === prev) {
        run += 1;
        if (run > best) best = run;
      } else {
        run = 1;
        sw += 1;
      }
      prev = cur;
    }
    if (best >= longest) longerStreak += 1;
    if (sw <= switches) fewerSwitches += 1;
    randomLongest.push(best);
  }
  randomLongest.sort((a, b) => a - b);
  return {
    n,
    longest,
    switches,
    shareWithStreakAtLeast: longerStreak / trials,
    shareWithSwitchesAtMost: fewerSwitches / trials,
    typicalLongest: randomLongest[Math.floor(trials / 2)],
    expectedSwitches: (n - 1) / 2,
  };
}

// Repeat an n-flip experiment many times and count heads in each (for the binomial panel).
export function headsCounts({ flipsPerExperiment, experiments, p, seed }) {
  const rng = seedrandom(`${seed ?? ''}-binomial`);
  const counts = new Array(flipsPerExperiment + 1).fill(0);
  for (let e = 0; e < experiments; e += 1) {
    let heads = 0;
    for (let i = 0; i < flipsPerExperiment; i += 1) if (rng() < p) heads += 1;
    counts[heads] += 1;
  }
  return counts;
}
