import seedrandom from 'seedrandom';

// Source distributions. Each knows how to sample itself from a uniform draw,
// its true mean and standard deviation, and its shape for drawing:
// `density` for continuous ones, `values` + `prob` for discrete ones.
export const distributions = {
  uniform: {
    label: 'Uniform (flat)',
    sample: (rng) => rng(),
    mean: 0.5,
    sd: Math.sqrt(1 / 12),
    range: [0, 1],
    density: () => 1,
  },
  exponential: {
    label: 'Exponential (skewed)',
    sample: (rng) => -Math.log(1 - rng()),
    mean: 1,
    sd: 1,
    range: [0, 5],
    density: (x) => Math.exp(-x),
  },
  bimodal: {
    label: 'Two humps (bimodal)',
    sample: (rng) => (rng() < 0.5 ? rng() * 0.3 : 0.7 + rng() * 0.3),
    mean: 0.5,
    sd: Math.sqrt(0.38 - 0.25),
    range: [0, 1],
    density: (x) => (x <= 0.3 || x >= 0.7 ? 1 / 0.6 : 0),
  },
  die: {
    label: 'Six-sided die',
    sample: (rng) => Math.floor(rng() * 6) + 1,
    mean: 3.5,
    sd: Math.sqrt(35 / 12),
    range: [0.5, 6.5],
    values: [1, 2, 3, 4, 5, 6],
    prob: () => 1 / 6,
    step: 1,
  },
  biasedCoin: {
    label: 'Biased coin (20% heads = 1)',
    sample: (rng) => (rng() < 0.2 ? 1 : 0),
    mean: 0.2,
    sd: 0.4,
    range: [-0.5, 1.5],
    values: [0, 1],
    prob: (v) => (v === 1 ? 0.2 : 0.8),
    step: 1,
  },
};

export function sampleMeans(dist, n, samples, seed) {
  const rng = seedrandom(seed ?? '');
  const means = new Float64Array(samples);
  for (let s = 0; s < samples; s += 1) {
    let total = 0;
    for (let i = 0; i < n; i += 1) total += dist.sample(rng);
    means[s] = total / n;
  }
  return means;
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

export function summarize(values) {
  let sum = 0;
  for (const v of values) sum += v;
  const mean = sum / values.length;
  let sq = 0;
  for (const v of values) sq += (v - mean) ** 2;
  return { mean, sd: Math.sqrt(sq / values.length) };
}
