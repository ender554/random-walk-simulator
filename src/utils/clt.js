import seedrandom from 'seedrandom';
import { normalCdf, normalSample } from './stats';

const factorial = (k) => {
  let f = 1;
  for (let i = 2; i <= k; i += 1) f *= i;
  return f;
};

// Source distributions. Each knows how to sample itself, its true mean and standard deviation,
// a display range, and its shape for drawing: `density` (continuous) or `values` + `prob` (discrete).
// `skew` only affects the adjustable lognormal.
export function makeDistribution(key, skew = 0.75) {
  switch (key) {
    case 'uniform':
      return {
        key, label: 'Uniform (flat)',
        sample: (rng) => rng(),
        mean: 0.5, sd: Math.sqrt(1 / 12), range: [0, 1],
        density: () => 1,
      };
    case 'exponential':
      return {
        key, label: 'Exponential (skewed)',
        sample: (rng) => -Math.log(1 - rng()),
        mean: 1, sd: 1, range: [0, 5],
        density: (x) => Math.exp(-x),
      };
    case 'lognormal': {
      const s = skew;
      const mean = Math.exp((s * s) / 2);
      const sd = Math.sqrt((Math.exp(s * s) - 1) * Math.exp(s * s));
      return {
        key, label: `Lognormal (skewness ${lognormalSkewness(s).toFixed(1)})`,
        sample: (rng) => Math.exp(s * normalSample(rng)),
        mean, sd, range: [0, Math.min(40, Math.exp(2.6 * s))],
        density: (x) => (x <= 0 ? 0 : Math.exp(-((Math.log(x) / s) ** 2) / 2) / (x * s * Math.sqrt(2 * Math.PI))),
      };
    }
    case 'bimodal':
      return {
        key, label: 'Two humps (bimodal)',
        sample: (rng) => (rng() < 0.5 ? rng() * 0.3 : 0.7 + rng() * 0.3),
        mean: 0.5, sd: Math.sqrt(0.38 - 0.25), range: [0, 1],
        density: (x) => (x <= 0.3 || x >= 0.7 ? 1 / 0.6 : 0),
      };
    case 'die':
      return {
        key, label: 'Six-sided die',
        sample: (rng) => Math.floor(rng() * 6) + 1,
        mean: 3.5, sd: Math.sqrt(35 / 12), range: [0.5, 6.5],
        values: [1, 2, 3, 4, 5, 6], prob: () => 1 / 6, step: 1,
      };
    case 'poisson': {
      const lambda = 3;
      return {
        key, label: 'Poisson (λ = 3, counts)',
        sample: (rng) => {
          // Knuth's method; fine for small λ
          const limit = Math.exp(-lambda);
          let k = 0;
          let p = rng();
          while (p > limit) {
            k += 1;
            p *= rng();
          }
          return k;
        },
        mean: lambda, sd: Math.sqrt(lambda), range: [-0.5, 12.5],
        values: Array.from({ length: 13 }, (_, i) => i),
        prob: (v) => (Math.exp(-lambda) * lambda ** v) / factorial(v),
        step: 1,
      };
    }
    case 'biasedCoin':
      return {
        key, label: 'Biased coin (20% heads = 1)',
        sample: (rng) => (rng() < 0.2 ? 1 : 0),
        mean: 0.2, sd: 0.4, range: [-0.5, 1.5],
        values: [0, 1], prob: (v) => (v === 1 ? 0.2 : 0.8), step: 1,
      };
    case 'cauchy':
      return {
        key, label: 'Cauchy (breaks the CLT)',
        sample: (rng) => Math.tan(Math.PI * (rng() - 0.5)),
        mean: NaN, sd: NaN, center: 0, range: [-10, 10],
        density: (x) => 1 / (Math.PI * (1 + x * x)),
        noClt: true,
      };
    default:
      return makeDistribution('exponential');
  }
}

export const DISTRIBUTION_KEYS = ['uniform', 'exponential', 'lognormal', 'bimodal', 'die', 'poisson', 'biasedCoin', 'cauchy'];

export function lognormalSkewness(s) {
  const e = Math.exp(s * s);
  return (e + 2) * Math.sqrt(e - 1);
}

// Every draw is kept so a single sample can be shown value by value.
export function drawSamples(dist, n, samples, seed) {
  const rng = seedrandom(seed ?? '');
  const raw = new Float64Array(samples * n);
  const means = new Float64Array(samples);
  for (let s = 0; s < samples; s += 1) {
    let total = 0;
    for (let i = 0; i < n; i += 1) {
      const v = dist.sample(rng);
      raw[s * n + i] = v;
      total += v;
    }
    means[s] = total / n;
  }
  return { raw, means };
}

// Histogram of sample means over [lo, hi]. For discrete sources, means can only land on a
// lattice (multiples of step/n), so bin width is a whole number of lattice steps and bin edges
// sit halfway between lattice points; otherwise bars alternate between full and empty.
export function histogram(values, dist, n, lo, hi, targetBins = 60) {
  let width = (hi - lo) / targetBins;
  let origin = lo;

  if (dist.step) {
    const lattice = dist.step / n;
    width = lattice * Math.max(1, Math.round(width / lattice));
    const edge = dist.values[0] - lattice / 2;
    origin = edge - Math.ceil((edge - lo) / width) * width;
  }

  const count = Math.ceil((hi - origin) / width);
  const bins = new Array(count).fill(0);
  for (const v of values) {
    const i = Math.floor((v - origin) / width);
    if (i >= 0 && i < count) bins[i] += 1;
  }
  return { bins, origin, width };
}

export const normalDensity = (x, mean, sd) =>
  Math.exp(-0.5 * ((x - mean) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI));

// Mean, spread and shape of a set of values. Skewness and excess kurtosis are 0 for a normal curve.
export function summarize(values) {
  const count = values.length;
  let sum = 0;
  for (const v of values) sum += v;
  const mean = sum / count;
  let m2 = 0;
  let m3 = 0;
  let m4 = 0;
  for (const v of values) {
    const d = v - mean;
    m2 += d * d;
    m3 += d * d * d;
    m4 += d * d * d * d;
  }
  m2 /= count;
  m3 /= count;
  m4 /= count;
  return {
    mean,
    sd: Math.sqrt(m2),
    skewness: m2 > 0 ? m3 / m2 ** 1.5 : 0,
    excessKurtosis: m2 > 0 ? m4 / (m2 * m2) - 3 : 0,
  };
}

// P(lo < x̄ < hi) by the normal approximation, with open ends as ±Infinity.
export function normalProbability(lo, hi, mean, se) {
  const cdf = (x) => (x === Infinity ? 1 : x === -Infinity ? 0 : normalCdf((x - mean) / se));
  return cdf(hi) - cdf(lo);
}

export function shareBetween(values, lo, hi) {
  let inside = 0;
  for (const v of values) if (v > lo && v < hi) inside += 1;
  return inside / values.length;
}
