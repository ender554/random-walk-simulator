import { clearCanvas } from '../../utils/canvas';
import { PALETTE, chartFrame, clipToPlot, evenTicks, powersOfTen } from '../../utils/chart';
import { SPREAD } from '../../utils/monteCarloPi';
import { logCheckpoints, normalCdf } from '../../utils/stats';

// The dartboard: a square with a quarter (or full) circle; draws points from..to incrementally.
export function drawSquare(canvas, { xs, ys }, from, to, full) {
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  const px = (v) => (full ? ((v + 1) / 2) * size : v * size);
  const py = (v) => (full ? (1 - (v + 1) / 2) * size : (1 - v) * size);
  if (from === 0) {
    clearCanvas(ctx, canvas);
    ctx.strokeStyle = PALETTE.yellow;
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (full) ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    else ctx.arc(0, size, size, -Math.PI / 2, 0);
    ctx.stroke();
  }
  const dot = to > 20000 ? 1.5 : to > 2000 ? 2.5 : to > 200 ? 4 : 6;
  for (let i = from; i < to; i += 1) {
    ctx.fillStyle = xs[i] * xs[i] + ys[i] * ys[i] <= 1 ? PALETTE.cyan : PALETTE.pink;
    ctx.fillRect(px(xs[i]) - dot / 2, py(ys[i]) - dot / 2, dot, dot);
  }
}

/**
 * Convergence: the estimate vs points thrown with a ±2·SE band, or the error |estimate − π| on
 * log–log axes against the 1/√n line. `series` is [{ insideSoFar, color }].
 */
export function drawConvergence(canvas, { series, shown, total, view }) {
  const checkpoints = logCheckpoints(total).filter((n) => n <= shown);
  if (view === 'error') {
    const frame = chartFrame(canvas, {
      xMin: 1, xMax: total, yMin: 1e-5, yMax: 2, logX: true, logY: true,
      xTicks: powersOfTen(total),
      yTicks: [1e-4, 1e-3, 1e-2, 1e-1, 1],
      formatY: (v) => (v >= 0.01 ? String(v) : v.toExponential(0)),
      xLabel: 'Points thrown (log scale)',
    });
    const { ctx, x, y } = frame;
    clipToPlot(frame);
    ctx.strokeStyle = PALETTE.yellow;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(x(1), y(SPREAD));
    ctx.lineTo(x(total), y(SPREAD / Math.sqrt(total)));
    ctx.stroke();
    ctx.setLineDash([]);
    for (const { insideSoFar, color } of series) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (const n of checkpoints) ctx.lineTo(x(n), y(Math.max(1e-5, Math.abs((4 * insideSoFar[n]) / n - Math.PI))));
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  const frame = chartFrame(canvas, {
    xMin: 1, xMax: total, yMin: 2.6, yMax: 3.7, logX: true,
    xTicks: powersOfTen(total),
    yTicks: evenTicks(2.6, 3.6, 6),
    formatY: (v) => v.toFixed(1),
    xLabel: 'Points thrown (log scale)',
  });
  const { ctx, x, y } = frame;
  clipToPlot(frame);
  ctx.fillStyle = 'rgba(255, 209, 102, 0.12)';
  ctx.beginPath();
  checkpoints.forEach((n) => ctx.lineTo(x(n), y(Math.PI + (2 * SPREAD) / Math.sqrt(n))));
  [...checkpoints].reverse().forEach((n) => ctx.lineTo(x(n), y(Math.PI - (2 * SPREAD) / Math.sqrt(n))));
  ctx.fill();
  ctx.strokeStyle = PALETTE.yellow;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(x(1), y(Math.PI));
  ctx.lineTo(x(total), y(Math.PI));
  ctx.stroke();
  ctx.setLineDash([]);
  for (const { insideSoFar, color } of series) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (const n of checkpoints) ctx.lineTo(x(n), y((4 * insideSoFar[n]) / n));
    ctx.stroke();
  }
  ctx.restore();
}

// Histogram of many runs' estimates with the normal curve the theory predicts; marks the current run.
export function drawEstimates(canvas, { estimates, n, current }) {
  const se = SPREAD / Math.sqrt(n);
  const lo = Math.PI - 4.5 * se;
  const hi = Math.PI + 4.5 * se;
  const bins = 40;
  const width = (hi - lo) / bins;
  const counts = new Array(bins).fill(0);
  for (const e of estimates) {
    const i = Math.floor((e - lo) / width);
    if (i >= 0 && i < bins) counts[i] += 1;
  }
  const expected = (i) => estimates.length * (normalCdf((lo + (i + 1) * width - Math.PI) / se) - normalCdf((lo + i * width - Math.PI) / se));
  let yMax = 1;
  for (let i = 0; i < bins; i += 1) yMax = Math.max(yMax, counts[i], expected(i));
  yMax *= 1.1;
  const frame = chartFrame(canvas, {
    xMin: lo, xMax: hi, yMin: 0, yMax,
    xTicks: evenTicks(lo, hi, 5),
    yTicks: evenTicks(0, yMax, 4),
    formatX: (v) => v.toFixed(n >= 10000 ? 3 : 2),
    formatY: (v) => Math.round(v).toLocaleString(),
    xLabel: `Estimates of π from ${estimates.length.toLocaleString()} runs of ${n.toLocaleString()} points`,
  });
  const { ctx, x, y } = frame;
  clipToPlot(frame);
  for (let i = 0; i < bins; i += 1) {
    ctx.fillStyle = PALETTE.cyan;
    ctx.fillRect(x(lo + i * width) + 0.5, y(counts[i]), Math.max(1, x(lo + (i + 1) * width) - x(lo + i * width) - 1), y(0) - y(counts[i]));
  }
  ctx.strokeStyle = PALETTE.yellow;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < bins; i += 1) ctx.lineTo(x(lo + (i + 0.5) * width), y(expected(i)));
  ctx.stroke();
  for (const [value, color] of [[Math.PI, PALETTE.yellow], [current, PALETTE.pink]]) {
    if (!Number.isFinite(value)) continue;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x(value), y(0));
    ctx.lineTo(x(value), y(yMax));
    ctx.stroke();
  }
  ctx.restore();
}

// Buffon's needle: parallel lines one unit apart and the dropped needles.
export function drawNeedles(canvas, { needles }) {
  const ctx = canvas.getContext('2d');
  clearCanvas(ctx, canvas);
  const sx = canvas.width / 10;
  const sy = canvas.height / 6;
  ctx.strokeStyle = PALETTE.yellow;
  ctx.lineWidth = 1.5;
  for (let line = 0; line <= 6; line += 1) {
    ctx.beginPath();
    ctx.moveTo(0, line * sy);
    ctx.lineTo(canvas.width, line * sy);
    ctx.stroke();
  }
  ctx.lineWidth = needles.length > 2000 ? 0.75 : 1.5;
  for (const [x1, y1, x2, y2, crosses] of needles) {
    ctx.strokeStyle = crosses ? PALETTE.cyan : 'rgba(255, 107, 139, 0.7)';
    ctx.beginPath();
    ctx.moveTo(x1 * sx, y1 * sy);
    ctx.lineTo(x2 * sx, y2 * sy);
    ctx.stroke();
  }
}
