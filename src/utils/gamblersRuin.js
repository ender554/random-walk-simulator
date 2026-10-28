import seedrandom from 'seedrandom';

// Safety cap per game; fair games from the largest bankrolls average ~10,000 bets.
export const MAX_BETS = 200000;

// Each game is a 1D random walk: bet $1, win with probability p, stop at $0 or the target.
export function simulateGames({ start, target, p, games, seed }) {
  const rng = seedrandom(seed ?? '');
  const results = [];

  for (let g = 0; g < games; g += 1) {
    let bankroll = start;
    const path = [bankroll];

    while (bankroll > 0 && bankroll < target && path.length <= MAX_BETS) {
      bankroll += rng() < p ? 1 : -1;
      path.push(bankroll);
    }

    const outcome = bankroll <= 0 ? 'ruin' : bankroll >= target ? 'target' : 'unfinished';
    results.push({ path, outcome });
  }

  return results;
}

// Classic closed-form answers for a $1 bet from bankroll `start` to `target`.
export function gamblersRuinTheory(start, target, p) {
  const q = 1 - p;

  if (Math.abs(p - 0.5) < 1e-9) {
    return {
      ruinProbability: 1 - start / target,
      expectedBets: start * (target - start),
    };
  }

  const r = q / p;
  const rStart = r ** start;
  const rTarget = r ** target;

  return {
    ruinProbability: (rStart - rTarget) / (1 - rTarget),
    expectedBets: start / (q - p) - (target / (q - p)) * ((1 - rStart) / (1 - rTarget)),
  };
}
