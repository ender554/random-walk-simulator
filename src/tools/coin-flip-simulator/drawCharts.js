import { PALETTE, SERIES, chartFrame, clipToPlot, evenTicks, powersOfTen } from '../../utils/chart';
import { binomialPmf } from '../../utils/stats';

// Running share of heads (or heads minus tails) for every run, against the expected band.
export function drawRuns(canvas, { runs, flips, p, mode }) {
  if (!canvas) return;
  const share = mode === 'share';
  const spread = (n) => (share ? 2 * Math.sqrt((p * (1 - p)) / n) : 4 * Math.sqrt(n * p * (1 - p)));
  const center = (n) => (share ? p : n * (2 * p - 1));
  let yMin = 0;
  let yMax = 1;
  if (!share) {
    let extent = 4 * Math.sqrt(flips * p * (1 - p)) * 1.2;
    for (const run of runs) for (const pt of run.points) extent = Math.max(extent, Math.abs(pt[2] - center(pt[0])) * 1.1);
    yMin = Math.min(center(flips) - extent, -extent);
    yMax = Math.max(center(flips) + extent, extent);
  }
  const frame = chartFrame(canvas, {
    xMin: 1, xMax: flips, yMin, yMax, logX: true,
    xTicks: powersOfTen(flips),
    yTicks: evenTicks(yMin, yMax, 5),
    formatY: share ? (v) => `${Math.round(v * 100)}%` : (v) => Math.round(v).toLocaleString(),
    xLabel: 'Number of flips (log scale)',
  });
  const { ctx, x, y } = frame;
  clipToPlot(frame);

  const ns = runs[0].points.map(([n]) => n);
  ctx.fillStyle = 'rgba(255, 209, 102, 0.12)';
  ctx.beginPath();
  ns.forEach((n) => ctx.lineTo(x(n), y(center(n) + spread(n))));
  [...ns].reverse().forEach((n) => ctx.lineTo(x(n), y(center(n) - spread(n))));
  ctx.fill();

  ctx.strokeStyle = PALETTE.yellow;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ns.forEach((n) => ctx.lineTo(x(n), y(center(n))));
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.lineWidth = 2;
  runs.forEach((run, i) => {
    ctx.strokeStyle = SERIES[i % SERIES.length];
    ctx.beginPath();
    for (const [n, s, diff] of run.points) ctx.lineTo(x(n), y(share ? s : diff));
    ctx.stroke();
  });
  ctx.restore();
}

// Heads in each repeated experiment, with the exact binomial distribution; `highlight` marks a k range.
export function drawBinomial(canvas, { counts, n, p, experiments, highlight }) {
  if (!canvas) return;
  const mean = n * p;
  const sd = Math.sqrt(n * p * (1 - p));
  const lo = Math.max(0, Math.floor(mean - 4.5 * sd));
  const hi = Math.min(n, Math.ceil(mean + 4.5 * sd));
  let yMax = 0;
  for (let k = lo; k <= hi; k += 1) yMax = Math.max(yMax, counts[k], experiments * binomialPmf(n, k, p));
  yMax *= 1.1;
  const frame = chartFrame(canvas, {
    xMin: lo - 0.5, xMax: hi + 0.5, yMin: 0, yMax,
    xTicks: evenTicks(lo, hi, 5).map(Math.round),
    yTicks: evenTicks(0, yMax, 4),
    formatY: (v) => Math.round(v).toLocaleString(),
    xLabel: `Heads in ${n} flips`,
  });
  const { ctx, x, y } = frame;
  clipToPlot(frame);
  const w = Math.max(1, x(1) - x(0) - 1);
  for (let k = lo; k <= hi; k += 1) {
    const inside = highlight && k >= highlight[0] && k <= highlight[1];
    ctx.fillStyle = inside ? PALETTE.violet : PALETTE.cyan;
    ctx.fillRect(x(k) - w / 2, y(counts[k]), w, y(0) - y(counts[k]));
  }
  ctx.fillStyle = PALETTE.yellow;
  for (let k = lo; k <= hi; k += 1) {
    ctx.beginPath();
    ctx.arc(x(k), y(experiments * binomialPmf(n, k, p)), Math.min(4, w / 2 + 1), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// How many streaks of each length appeared, against how many to expect.
export function drawRunLengths(canvas, { observed, expected }) {
  if (!canvas) return;
  const maxL = observed.length - 1;
  let yMax = 1;
  for (let L = 1; L <= maxL; L += 1) yMax = Math.max(yMax, observed[L], expected[L]);
  yMax *= 1.1;
  const frame = chartFrame(canvas, {
    xMin: 0.5, xMax: maxL + 0.5, yMin: 0, yMax,
    xTicks: evenTicks(1, maxL, Math.min(maxL, 6)).map(Math.round),
    yTicks: evenTicks(0, yMax, 4),
    formatY: (v) => Math.round(v).toLocaleString(),
    xLabel: 'Streak length (same face in a row)',
  });
  const { ctx, x, y } = frame;
  clipToPlot(frame);
  const w = Math.max(2, (x(1) - x(0)) * 0.7);
  for (let L = 1; L <= maxL; L += 1) {
    ctx.fillStyle = PALETTE.cyan;
    ctx.fillRect(x(L) - w / 2, y(observed[L]), w, y(0) - y(observed[L]));
    ctx.fillStyle = PALETTE.yellow;
    ctx.fillRect(x(L) - w / 2, y(expected[L]) - 1.5, w, 3);
  }
  ctx.restore();
}
