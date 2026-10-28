import seedrandom from 'seedrandom';
import { normalCdf, normalSample } from './stats';

export const STEPS_PER_YEAR = 252; // trading days

// Geometric Brownian motion: each trading day the log price moves by a normal step.
export function simulatePaths({ s0, mu, sigma, years, paths, seed }) {
  const rng = seedrandom(seed ?? '');
  const steps = Math.round(years * STEPS_PER_YEAR);
  const dt = 1 / STEPS_PER_YEAR;
  const drift = (mu - (sigma * sigma) / 2) * dt;
  const vol = sigma * Math.sqrt(dt);

  const results = [];
  for (let p = 0; p < paths; p += 1) {
    const prices = new Float64Array(steps + 1);
    let s = s0;
    prices[0] = s;
    for (let i = 1; i <= steps; i += 1) {
      s *= Math.exp(drift + vol * normalSample(rng));
      prices[i] = s;
    }
    results.push(prices);
  }
  return results;
}

export function gbmTheory(s0, mu, sigma, years) {
  const logDrift = mu - (sigma * sigma) / 2;
  return {
    mean: s0 * Math.exp(mu * years),
    median: s0 * Math.exp(logDrift * years),
    probBelowStart: normalCdf((-logDrift * Math.sqrt(years)) / sigma),
  };
}
