import { clearCanvas } from './canvas';

export const PALETTE = {
  cyan: '#1de5d0',
  pink: '#ff6b8b',
  yellow: '#ffd166',
  violet: '#a78bfa',
  muted: '#8a96b3',
  label: '#aab6d4',
  grid: '#1f2836',
};

// Distinct colors for several runs on one chart.
export const SERIES = ['#1de5d0', '#ff6b8b', '#ffd166', '#a78bfa', '#7dd3fc', '#86efac', '#fdba74', '#f0abfc'];

const DEFAULT_PAD = { left: 60, right: 18, top: 18, bottom: 42 };

/**
 * Clears the canvas and draws gridlines, tick labels and an x-axis label.
 * Returns mappers from data to pixels. Log axes need positive values.
 */
export function chartFrame(canvas, opts) {
  const {
    xMin, xMax, yMin, yMax,
    logX = false,
    logY = false,
    xTicks = [], yTicks = [],
    formatX = (v) => v.toLocaleString(),
    formatY = (v) => v.toLocaleString(),
    xLabel = '',
    pad = DEFAULT_PAD,
  } = opts;

  const ctx = canvas.getContext('2d');
  clearCanvas(ctx, canvas);

  const plotW = canvas.width - pad.left - pad.right;
  const plotH = canvas.height - pad.top - pad.bottom;
  const tx = logX ? Math.log10 : (v) => v;
  const ty = logY ? Math.log10 : (v) => v;
  const x = (v) => pad.left + ((tx(v) - tx(xMin)) / (tx(xMax) - tx(xMin))) * plotW;
  const y = (v) => pad.top + (1 - (ty(v) - ty(yMin)) / (ty(yMax) - ty(yMin))) * plotH;

  ctx.font = '13px system-ui, sans-serif';
  ctx.lineWidth = 1;

  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (const v of yTicks) {
    ctx.strokeStyle = PALETTE.grid;
    ctx.beginPath();
    ctx.moveTo(pad.left, y(v));
    ctx.lineTo(pad.left + plotW, y(v));
    ctx.stroke();
    ctx.fillStyle = PALETTE.label;
    ctx.fillText(formatY(v), pad.left - 8, y(v));
  }

  ctx.textBaseline = 'top';
  xTicks.forEach((v, i) => {
    ctx.textAlign = xTicks.length > 1 && i === xTicks.length - 1 ? 'right' : i === 0 ? 'left' : 'center';
    ctx.fillStyle = PALETTE.label;
    ctx.fillText(formatX(v), x(v), pad.top + plotH + 8);
  });

  if (xLabel) {
    ctx.textAlign = 'center';
    ctx.fillText(xLabel, pad.left + plotW / 2, pad.top + plotH + 24);
  }

  return { ctx, x, y, plotW, plotH, pad };
}

// Clip later drawing to the plot area; call ctx.restore() when done.
export function clipToPlot({ ctx, pad, plotW, plotH }) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(pad.left, pad.top, plotW, plotH);
  ctx.clip();
}

export function powersOfTen(max) {
  const ticks = [];
  for (let v = 1; v <= max; v *= 10) ticks.push(v);
  return ticks;
}

export function evenTicks(min, max, count = 5) {
  return Array.from({ length: count }, (_, i) => min + ((max - min) * i) / (count - 1));
}

// 1-2-5 ticks (1, 2, 5, 10, 20, ...) between min and max, for log axes.
export function logTicks(min, max) {
  const ticks = [];
  for (let decade = 10 ** Math.floor(Math.log10(min)); decade <= max; decade *= 10) {
    for (const m of [1, 2, 5]) {
      const v = m * decade;
      if (v >= min && v <= max) ticks.push(v);
    }
  }
  return ticks;
}
