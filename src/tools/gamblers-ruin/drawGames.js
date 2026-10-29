import { PALETTE, chartFrame, clipToPlot, evenTicks } from '../../utils/chart';

export const COLORS = {
  target: '#1de5d0',
  ruin: '#ff6b8b',
  unfinished: '#ffd166',
};

const money = (v) => `$${Math.round(v).toLocaleString()}`;

/** Bankroll over time for the first games, with reference lines for broke, start and target. */
export function drawGames(canvas, { results, start, target }) {
  const shown = results.filter((r) => r.path);
  const longest = Math.max(1, ...shown.map((r) => r.path.length - 1));
  const peak = Math.max(start * 1.1, ...shown.map((r) => r.peak));
  const top = Number.isFinite(target) ? Math.max(target, Math.min(peak, target * 1.6)) : peak * 1.05;
  const frame = chartFrame(canvas, {
    xMin: 0, xMax: longest, yMin: 0, yMax: top,
    xTicks: [0, longest],
    yTicks: Number.isFinite(target) ? [0, start, target] : evenTicks(0, top, 4),
    formatY: money,
    xLabel: 'Bets placed',
  });
  const { ctx, x, y, pad, plotW } = frame;
  clipToPlot(frame);

  const refs = [[0, COLORS.ruin], [start, PALETTE.muted], ...(Number.isFinite(target) ? [[target, COLORS.target]] : [])];
  for (const [level, color] of refs) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash(level === start ? [5, 5] : []);
    ctx.beginPath();
    ctx.moveTo(pad.left, y(level));
    ctx.lineTo(pad.left + plotW, y(level));
    ctx.stroke();
  }
  ctx.setLineDash([]);

  ctx.globalAlpha = shown.length > 20 ? 0.35 : 0.8;
  for (const { path, outcome } of shown) {
    const stride = Math.max(1, Math.floor(path.length / (plotW * 2)));
    ctx.strokeStyle = COLORS[outcome];
    ctx.beginPath();
    ctx.moveTo(x(0), y(path[0]));
    for (let i = stride; i < path.length; i += stride) ctx.lineTo(x(i), y(Math.min(path[i], top)));
    ctx.lineTo(x(path.length - 1), y(Math.min(path[path.length - 1], top)));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

/** How long games lasted, split by how they ended; marks the theoretical average when known. */
export function drawLengths(canvas, { results, expectedBets }) {
  const lengths = results.map((r) => r.bets).sort((a, b) => a - b);
  const hi = Math.max(10, lengths[Math.floor(lengths.length * 0.98)] ?? 10);
  const bins = 40;
  const width = Math.max(1, Math.ceil(hi / bins));
  const target = new Array(bins).fill(0);
  const ruin = new Array(bins).fill(0);
  for (const r of results) {
    const i = Math.min(bins - 1, Math.floor(r.bets / width));
    if (r.outcome === 'target') target[i] += 1;
    else if (r.outcome === 'ruin') ruin[i] += 1;
  }
  const yMax = Math.max(1, ...target.map((t, i) => t + ruin[i])) * 1.1;
  const frame = chartFrame(canvas, {
    xMin: 0, xMax: bins * width, yMin: 0, yMax,
    xTicks: evenTicks(0, bins * width, 5).map(Math.round),
    yTicks: evenTicks(0, yMax, 4),
    formatY: (v) => Math.round(v).toLocaleString(),
    xLabel: 'Bets until the game ended (last bin includes longer games)',
  });
  const { ctx, x, y } = frame;
  clipToPlot(frame);
  for (let i = 0; i < bins; i += 1) {
    const left = x(i * width) + 0.5;
    const w = Math.max(1, x((i + 1) * width) - x(i * width) - 1);
    ctx.fillStyle = COLORS.ruin;
    ctx.fillRect(left, y(ruin[i]), w, y(0) - y(ruin[i]));
    ctx.fillStyle = COLORS.target;
    ctx.fillRect(left, y(ruin[i] + target[i]), w, y(ruin[i]) - y(ruin[i] + target[i]));
  }
  if (Number.isFinite(expectedBets) && expectedBets <= bins * width) {
    ctx.strokeStyle = PALETTE.yellow;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(x(expectedBets), y(0));
    ctx.lineTo(x(expectedBets), y(yMax));
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

/** Chance of ruin for every starting bankroll: the exact curve plus simulated points. */
export function drawRuinCurve(canvas, { target, theoryAt, simulated, start }) {
  const frame = chartFrame(canvas, {
    xMin: 0, xMax: target, yMin: 0, yMax: 1,
    xTicks: evenTicks(0, target, 5),
    yTicks: evenTicks(0, 1, 5),
    formatX: money,
    formatY: (v) => `${Math.round(v * 100)}%`,
    xLabel: 'Starting bankroll',
  });
  const { ctx, x, y } = frame;
  clipToPlot(frame);
  if (theoryAt) {
    ctx.strokeStyle = PALETTE.yellow;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= 200; i += 1) {
      const s = (target * i) / 200;
      ctx.lineTo(x(s), y(theoryAt(s)));
    }
    ctx.stroke();
  }
  for (const [s, value] of simulated) {
    ctx.fillStyle = s === start ? PALETTE.pink : PALETTE.cyan;
    ctx.beginPath();
    ctx.arc(x(s), y(value), s === start ? 7 : 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
