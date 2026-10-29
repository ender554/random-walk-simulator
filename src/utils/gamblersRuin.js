import { mulberry32 } from './prng';

export const STRATEGIES = {
  flat: { label: 'Flat bets', short: 'bet the same amount every time' },
  bold: { label: 'Bold play', short: 'bet just enough to reach the target in one win (or everything)' },
  martingale: { label: 'Martingale (double after a loss)', short: 'double the bet after each loss, back to the base bet after a win' },
  dalembert: { label: "D'Alembert", short: 'raise the bet by one unit after a loss, lower it by one after a win' },
  fibonacci: { label: 'Fibonacci', short: 'move one step up the Fibonacci sequence after a loss, two steps back after a win' },
  kelly: { label: 'Kelly (bet a fraction of bankroll)', short: 'bet the Kelly fraction of your current bankroll; only sensible when you have the edge' },
};

const FIB = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765];
const EPS = 1e-9;

/**
 * Play one game: bet until the bankroll reaches the target or runs out (or maxBets).
 * Wins pay `payout` to 1. Returns the outcome, bets placed, total wagered, final bankroll and,
 * if `keepPath`, the bankroll after every bet.
 */
export function playGame({ start, target, p, payout, strategy, unit, tableLimit, maxBets, rand, keepPath }) {
  const kellyFraction = (payout * p - (1 - p)) / payout;
  let bankroll = start;
  let bets = 0;
  let wagered = 0;
  let lastBet = unit;
  let lastWon = true;
  let fib = 0;
  let peak = start;
  const path = keepPath ? [start] : null;

  while (bankroll > EPS && bankroll < target - EPS && bets < maxBets) {
    let bet;
    switch (strategy) {
      case 'bold':
        bet = Number.isFinite(target) ? (target - bankroll) / payout : bankroll;
        break;
      case 'martingale':
        bet = lastWon ? unit : Math.min(lastBet * 2, tableLimit);
        break;
      case 'dalembert':
        bet = lastWon ? Math.max(unit, lastBet - unit) : lastBet + unit;
        break;
      case 'fibonacci':
        bet = unit * FIB[fib];
        break;
      case 'kelly':
        bet = kellyFraction > 0 ? kellyFraction * bankroll : unit;
        break;
      default:
        bet = unit;
    }
    bet = Math.min(bet, bankroll);
    const won = rand() < p;
    bankroll += won ? bet * payout : -bet;
    wagered += bet;
    bets += 1;
    if (strategy === 'fibonacci') fib = won ? Math.max(0, fib - 2) : Math.min(FIB.length - 1, fib + 1);
    lastBet = bet;
    lastWon = won;
    if (bankroll > peak) peak = bankroll;
    if (path) path.push(bankroll);
  }

  const outcome = bankroll <= EPS ? 'ruin' : bankroll >= target - EPS ? 'target' : 'unfinished';
  return { outcome, bets, wagered, final: Math.max(0, bankroll), peak, path };
}

/**
 * Many games. Each game has its own seeded coin, so different strategies face the same flips.
 * Paths are kept for the first `keepPaths` games. Stops early if the step budget runs out.
 */
export function simulateGames({ games, keepPaths = 200, stepBudget = 40e6, seed, ...rules }) {
  const results = [];
  let steps = 0;
  for (let g = 0; g < games; g += 1) {
    const rand = mulberry32(`${seed ?? ''}-game${g}`);
    const result = playGame({ ...rules, rand, keepPath: g < keepPaths });
    results.push(result);
    steps += result.bets;
    if (steps > stepBudget) break;
  }
  return results;
}

/** Exact answers for flat $1-unit bets at even money; null when the rules don't fit the formula. */
export function gamblersRuinTheory(start, target, p) {
  if (!Number.isFinite(target)) {
    // No target: against a casino, a fair or unfavorable game ends in ruin with certainty
    return p <= 0.5 ? { ruinProbability: 1, expectedBets: p === 0.5 ? Infinity : start / (1 - 2 * p) } : { ruinProbability: ((1 - p) / p) ** start, expectedBets: Infinity };
  }
  const q = 1 - p;
  if (Math.abs(p - 0.5) < 1e-9) {
    return { ruinProbability: 1 - start / target, expectedBets: start * (target - start) };
  }
  const r = q / p;
  const rStart = r ** start;
  const rTarget = r ** target;
  return {
    ruinProbability: (rStart - rTarget) / (1 - rTarget),
    expectedBets: start / (q - p) - (target / (q - p)) * ((1 - rStart) / (1 - rTarget)),
  };
}

export function summarize(results) {
  const count = results.length;
  const by = (o) => results.filter((r) => r.outcome === o).length;
  const mean = (f) => results.reduce((s, r) => s + f(r), 0) / count;
  return {
    count,
    ruined: by('ruin'),
    reached: by('target'),
    unfinished: by('unfinished'),
    meanBets: mean((r) => r.bets),
    meanWagered: mean((r) => r.wagered),
    meanFinal: mean((r) => r.final),
  };
}
