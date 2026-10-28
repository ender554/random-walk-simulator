// Standard normal draw (Box-Muller) from a uniform rng.
export function normalSample(rng) {
  let u = 0;
  while (u === 0) u = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

// Standard normal CDF via the Abramowitz-Stegun erf approximation (error < 1.5e-7).
export function normalCdf(z) {
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const erf = 1 - poly * Math.exp(-x * x);
  return z >= 0 ? 0.5 * (1 + erf) : 0.5 * (1 - erf);
}

export function binomialPmf(n, k, p) {
  let logC = 0;
  for (let i = 1; i <= k; i += 1) logC += Math.log(n - k + i) - Math.log(i);
  return Math.exp(logC + k * Math.log(p) + (n - k) * Math.log(1 - p));
}

export function quantile(sorted, q) {
  if (!sorted.length) return 0;
  const i = Math.min(sorted.length - 1, Math.max(0, Math.floor(q * (sorted.length - 1))));
  return sorted[i];
}

// ~count points spread evenly on a log scale from 1 to max, for plotting long runs.
export function logCheckpoints(max, count = 300) {
  const points = new Set([1]);
  for (let i = 1; i <= count; i += 1) {
    points.add(Math.max(1, Math.round(max ** (i / count))));
  }
  return [...points].sort((a, b) => a - b);
}
