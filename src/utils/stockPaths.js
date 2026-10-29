import { mulberry32 } from './prng';
import { normalCdf } from './stats';

export const STEPS_PER_YEAR = 252; // trading days
const SAMPLES = 300; // points kept per path for drawing and bands

// Pairs of standard normal draws (Box–Muller), using both halves to save work.
function normalSource(rand) {
  let spare = null;
  return () => {
    if (spare !== null) {
      const v = spare;
      spare = null;
      return v;
    }
    let u = 0;
    while (u === 0) u = rand();
    const r = Math.sqrt(-2 * Math.log(u));
    const angle = 2 * Math.PI * rand();
    spare = r * Math.sin(angle);
    return r * Math.cos(angle);
  };
}

// Student-t shocks with 4 degrees of freedom, rescaled to variance 1: same volatility, fatter tails.
function fatTailSource(normal) {
  const df = 4;
  return () => {
    let chi = 0;
    for (let i = 0; i < df; i += 1) chi += normal() ** 2;
    return (normal() / Math.sqrt(chi / df)) * Math.sqrt((df - 2) / df);
  };
}

/**
 * Geometric Brownian motion with daily steps. Each path is stored at ~300 evenly spaced times for
 * drawing; the final price and the path's lowest and highest prices are tracked at full resolution.
 */
export function simulatePaths({ s0, mu, sigma, years, paths, seed, fatTails = false }) {
  const rand = mulberry32(`${seed ?? ''}-gbm`);
  const normal = normalSource(rand);
  const shock = fatTails ? fatTailSource(normal) : normal;
  const steps = Math.round(years * STEPS_PER_YEAR);
  const stride = Math.max(1, Math.ceil(steps / SAMPLES));
  const kept = Math.floor(steps / stride) + 1;
  const dt = 1 / STEPS_PER_YEAR;
  const drift = (mu - (sigma * sigma) / 2) * dt;
  const vol = sigma * Math.sqrt(dt);

  const samples = new Float32Array(paths * kept);
  const finals = new Float64Array(paths);
  const highs = new Float64Array(paths);
  const lows = new Float64Array(paths);
  for (let p = 0; p < paths; p += 1) {
    let s = s0;
    let high = s0;
    let low = s0;
    samples[p * kept] = s0;
    for (let i = 1; i <= steps; i += 1) {
      s *= Math.exp(drift + vol * shock());
      if (s > high) high = s;
      if (s < low) low = s;
      if (i % stride === 0) samples[p * kept + i / stride] = s;
    }
    finals[p] = s;
    highs[p] = high;
    lows[p] = low;
  }
  return { samples, kept, stride, steps, finals, highs, lows, paths };
}

/** Cross-sectional percentiles at each kept time: [{ q, values: Float64Array(kept) }]. */
export function percentileBands(sim, quantiles = [0.05, 0.25, 0.5, 0.75, 0.95]) {
  const { samples, kept, paths } = sim;
  const column = new Float64Array(paths);
  const bands = quantiles.map((q) => ({ q, values: new Float64Array(kept) }));
  for (let t = 0; t < kept; t += 1) {
    for (let p = 0; p < paths; p += 1) column[p] = samples[p * kept + t];
    column.sort();
    for (const band of bands) band.values[t] = column[Math.min(paths - 1, Math.floor(band.q * (paths - 1)))];
  }
  return bands;
}

export function gbmTheory(s0, mu, sigma, years) {
  const logDrift = mu - (sigma * sigma) / 2;
  return {
    mean: s0 * Math.exp(mu * years),
    median: s0 * Math.exp(logDrift * years),
    probBelowStart: normalCdf((-logDrift * Math.sqrt(years)) / sigma),
    medianCagr: Math.exp(logDrift) - 1,
  };
}

// Lognormal density of the final price
export function finalDensity(x, s0, mu, sigma, years) {
  if (x <= 0) return 0;
  const m = Math.log(s0) + (mu - (sigma * sigma) / 2) * years;
  const s = sigma * Math.sqrt(years);
  return Math.exp(-((Math.log(x) - m) ** 2) / (2 * s * s)) / (x * s * Math.sqrt(2 * Math.PI));
}

/** P(final ≥ K) and P(the price touches K at some point), for continuous GBM. */
export function targetProbabilities(s0, k, mu, sigma, years) {
  const nu = mu - (sigma * sigma) / 2;
  const sT = sigma * Math.sqrt(years);
  const b = Math.log(k / s0);
  const endAbove = normalCdf((nu * years - b) / sT);
  // Reflection principle for Brownian motion with drift
  let touch;
  if (b >= 0) touch = normalCdf((-b + nu * years) / sT) + Math.exp((2 * nu * b) / (sigma * sigma)) * normalCdf((-b - nu * years) / sT);
  else touch = normalCdf((b - nu * years) / sT) + Math.exp((2 * nu * b) / (sigma * sigma)) * normalCdf((b + nu * years) / sT);
  return { endAbove, touch: Math.min(1, touch) };
}

/** European call: Black–Scholes price and a Monte Carlo estimate under the risk-neutral drift. */
export function callOption({ s0, strike, rate, sigma, years, seed, samples = 20000 }) {
  const sT = sigma * Math.sqrt(years);
  const d1 = (Math.log(s0 / strike) + (rate + (sigma * sigma) / 2) * years) / sT;
  const d2 = d1 - sT;
  const blackScholes = s0 * normalCdf(d1) - strike * Math.exp(-rate * years) * normalCdf(d2);
  const normal = normalSource(mulberry32(`${seed ?? ''}-option`));
  let sum = 0;
  let sumSq = 0;
  for (let i = 0; i < samples; i += 1) {
    const final = s0 * Math.exp((rate - (sigma * sigma) / 2) * years + sT * normal());
    const payoff = Math.exp(-rate * years) * Math.max(0, final - strike);
    sum += payoff;
    sumSq += payoff * payoff;
  }
  const mean = sum / samples;
  const se = Math.sqrt((sumSq / samples - mean * mean) / samples);
  return { blackScholes, monteCarlo: mean, se };
}
