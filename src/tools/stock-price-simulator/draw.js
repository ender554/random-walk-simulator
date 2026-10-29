import { PALETTE, chartFrame, clipToPlot, evenTicks, logTicks } from '../../utils/chart';
import { STEPS_PER_YEAR, finalDensity } from '../../utils/stockPaths';
import { quantile } from '../../utils/stats';

export const money = (v) => `$${v.toLocaleString(undefined, { maximumFractionDigits: v < 100 ? 2 : 0 })}`;
const MAX_DRAWN = 200;

/** Price paths and/or percentile bands over time, on a log or linear price axis. */
export function drawPaths(canvas, { sim, bands, s0, theory, years, show, logScale, target }) {
  const { samples, kept, stride, steps, paths } = sim;
  const tops = bands[bands.length - 1].values;
  const bottoms = bands[0].values;
  const yMaxRaw = Math.max(s0 * 1.5, ...tops, theory.mean, target || 0) * 1.15;
  const yMin = logScale ? Math.min(s0 / 1.5, ...bottoms, target || Infinity) / 1.2 : 0;
  const frame = chartFrame(canvas, {
    xMin: 0, xMax: steps, yMin, yMax: yMaxRaw, logY: logScale,
    xTicks: evenTicks(0, steps, Math.min(years, 5) + 1),
    yTicks: logScale ? logTicks(yMin, yMaxRaw) : evenTicks(0, yMaxRaw, 5),
    formatX: (v) => `${Math.round(v / STEPS_PER_YEAR)}y`,
    formatY: money,
    xLabel: 'Years',
  });
  const { ctx, x, y } = frame;
  clipToPlot(frame);
  const tAt = (i) => i * stride;

  if (show !== 'paths') {
    const fill = (lower, upper, color) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let i = 0; i < kept; i += 1) ctx.lineTo(x(tAt(i)), y(Math.max(yMin || 1e-9, upper.values[i])));
      for (let i = kept - 1; i >= 0; i -= 1) ctx.lineTo(x(tAt(i)), y(Math.max(yMin || 1e-9, lower.values[i])));
      ctx.fill();
    };
    fill(bands[0], bands[4], 'rgba(29, 229, 208, 0.12)');
    fill(bands[1], bands[3], 'rgba(29, 229, 208, 0.25)');
  }

  if (show !== 'bands') {
    const drawn = Math.min(paths, MAX_DRAWN);
    ctx.globalAlpha = show === 'both' ? 0.18 : drawn > 20 ? 0.3 : 0.8;
    ctx.lineWidth = 1;
    for (let p = 0; p < drawn; p += 1) {
      const final = samples[p * kept + kept - 1];
      ctx.strokeStyle = final >= s0 ? PALETTE.cyan : PALETTE.pink;
      ctx.beginPath();
      for (let i = 0; i < kept; i += 1) ctx.lineTo(x(tAt(i)), y(Math.max(yMin || 1e-9, samples[p * kept + i])));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // Theory: mean grows at mu (dashed), median at mu − sigma²/2 (solid)
  const curve = (end, dashed) => {
    ctx.strokeStyle = PALETTE.yellow;
    ctx.lineWidth = 2.5;
    ctx.setLineDash(dashed ? [8, 6] : []);
    ctx.beginPath();
    const rate = Math.log(end / s0) / years;
    for (let i = 0; i <= 100; i += 1) {
      const t = (i / 100) * years;
      ctx.lineTo(x(t * STEPS_PER_YEAR), y(s0 * Math.exp(rate * t)));
    }
    ctx.stroke();
    ctx.setLineDash([]);
  };
  curve(theory.mean, true);
  curve(theory.median, false);

  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  for (const [level, color] of [[s0, PALETTE.muted], ...(target ? [[target, PALETTE.violet]] : [])]) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x(0), y(level));
    ctx.lineTo(x(steps), y(level));
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();
}

/** Final prices on log-spaced bins with the lognormal density; marks the start, median and mean. */
export function drawFinals(canvas, { finals, s0, mu, sigma, years, theory }) {
  const sorted = Float64Array.from(finals).sort();
  const lo = Math.max(1e-6, Math.min(quantile(sorted, 0.005), s0 / 2));
  const hi = Math.max(quantile(sorted, 0.995), theory.mean * 1.2, s0 * 1.5);
  const bins = 50;
  const edges = Array.from({ length: bins + 1 }, (_, i) => lo * (hi / lo) ** (i / bins));
  const counts = new Array(bins).fill(0);
  for (const v of finals) {
    const i = Math.floor((Math.log(v / lo) / Math.log(hi / lo)) * bins);
    if (i >= 0 && i < bins) counts[i] += 1;
  }
  // Expected count per bin from the lognormal density (midpoint rule)
  const expected = (i) => finals.length * finalDensity(Math.sqrt(edges[i] * edges[i + 1]), s0, mu, sigma, years) * (edges[i + 1] - edges[i]);
  let yMax = 1;
  for (let i = 0; i < bins; i += 1) yMax = Math.max(yMax, counts[i], expected(i));
  yMax *= 1.1;
  const frame = chartFrame(canvas, {
    xMin: lo, xMax: hi, yMin: 0, yMax, logX: true,
    xTicks: logTicks(lo, hi).filter((_, i, a) => a.length < 8 || i % 2 === 0),
    yTicks: evenTicks(0, yMax, 4),
    formatX: money,
    formatY: (v) => Math.round(v).toLocaleString(),
    xLabel: `Price after ${years} years (log scale)`,
  });
  const { ctx, x, y } = frame;
  clipToPlot(frame);
  for (let i = 0; i < bins; i += 1) {
    ctx.fillStyle = edges[i + 1] <= s0 ? PALETTE.pink : PALETTE.cyan;
    ctx.fillRect(x(edges[i]) + 0.5, y(counts[i]), Math.max(1, x(edges[i + 1]) - x(edges[i]) - 1), y(0) - y(counts[i]));
  }
  ctx.strokeStyle = PALETTE.yellow;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < bins; i += 1) ctx.lineTo(x(Math.sqrt(edges[i] * edges[i + 1])), y(expected(i)));
  ctx.stroke();
  for (const [value, color, dashed] of [[s0, PALETTE.muted, true], [theory.median, PALETTE.yellow, false], [theory.mean, PALETTE.yellow, true]]) {
    if (value < lo || value > hi) continue;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash(dashed ? [6, 5] : []);
    ctx.beginPath();
    ctx.moveTo(x(value), y(0));
    ctx.lineTo(x(value), y(yMax));
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();
}

/** Running average of final prices as paths are added, against the theoretical mean. */
export function drawMeanConvergence(canvas, { finals, theory }) {
  const n = finals.length;
  const running = new Float64Array(n);
  let sum = 0;
  for (let i = 0; i < n; i += 1) {
    sum += finals[i];
    running[i] = sum / (i + 1);
  }
  const yMax = Math.max(theory.mean * 2, ...running.subarray(Math.min(n - 1, 9))) * 1.05;
  const frame = chartFrame(canvas, {
    xMin: 1, xMax: n, yMin: 0, yMax, logX: n > 10,
    xTicks: [1, 10, 100, 1000, 10000].filter((v) => v <= n),
    yTicks: evenTicks(0, yMax, 4),
    formatY: money,
    xLabel: 'Paths averaged (log scale)',
  });
  const { ctx, x, y } = frame;
  clipToPlot(frame);
  ctx.strokeStyle = PALETTE.yellow;
  ctx.setLineDash([8, 6]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x(1), y(theory.mean));
  ctx.lineTo(x(n), y(theory.mean));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = PALETTE.cyan;
  ctx.beginPath();
  for (let i = 0; i < n; i += 1) ctx.lineTo(x(i + 1), y(Math.min(yMax, running[i])));
  ctx.stroke();
  ctx.restore();
}
