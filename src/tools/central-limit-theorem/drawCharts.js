import { clearCanvas } from '../../utils/canvas';
import { normalDensity } from '../../utils/clt';

export const COLORS = {
  bars: '#1de5d0',
  curve: '#ffd166',
  sample: '#ff6b8b',
  shade: 'rgba(167, 139, 250, 0.16)',
};

const PAD = { left: 16, right: 16, top: 14, bottom: 34 };
// Short charts (the phone's pinned stage) keep 12 px labels and give the plot more of the height
const padFor = (canvas) => (canvas.height < 130 ? { left: 12, right: 12, top: 8, bottom: 22 } : PAD);

function frame(canvas, lo, hi, yMax) {
  const ctx = canvas.getContext('2d');
  clearCanvas(ctx, canvas);
  const pad = padFor(canvas);
  const plotW = canvas.width - pad.left - pad.right;
  const plotH = canvas.height - pad.top - pad.bottom;
  const x = (v) => pad.left + ((v - lo) / (hi - lo)) * plotW;
  const y = (v) => pad.top + (1 - v / yMax) * plotH;

  // Baseline and five evenly spaced x labels
  ctx.strokeStyle = '#2c3850';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad.left, y(0));
  ctx.lineTo(pad.left + plotW, y(0));
  ctx.stroke();

  ctx.fillStyle = '#aab6d4';
  ctx.font = `${canvas.width < 500 ? 12 : 13}px system-ui, sans-serif`;
  ctx.textBaseline = 'top';
  const span = hi - lo;
  const digits = span < 0.5 ? 3 : span <= 5 ? 2 : 1;
  for (let i = 0; i <= 4; i += 1) {
    const v = lo + (span * i) / 4;
    ctx.textAlign = i === 0 ? 'left' : i === 4 ? 'right' : 'center';
    ctx.fillText(v.toFixed(digits), x(v), y(0) + (pad.bottom < 30 ? 4 : 8));
  }

  return { ctx, x, y };
}

// Top chart: the source distribution, plus the values of the current sample if stepping through.
// `label` names the source in the top corner while no sample is shown.
export function drawSource(canvas, dist, sample, label) {
  if (!canvas) return;
  const [lo, hi] = dist.range;
  let view;

  if (dist.values) {
    const yMax = Math.max(...dist.values.map(dist.prob)) * 1.15;
    view = frame(canvas, lo, hi, yMax);
    const { ctx, x, y } = view;
    ctx.fillStyle = COLORS.bars;
    for (const v of dist.values) {
      const half = (x(v + 0.3) - x(v - 0.3)) / 2;
      ctx.fillRect(x(v) - half, y(dist.prob(v)), half * 2, y(0) - y(dist.prob(v)));
    }
  } else {
    const points = 400;
    const xs = Array.from({ length: points + 1 }, (_, i) => lo + ((hi - lo) * i) / points);
    const yMax = Math.max(...xs.map(dist.density)) * 1.15;
    view = frame(canvas, lo, hi, yMax);
    const { ctx, x, y } = view;
    ctx.fillStyle = 'rgba(29, 229, 208, 0.35)';
    ctx.strokeStyle = COLORS.bars;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x(lo), y(0));
    for (const v of xs) ctx.lineTo(x(v), y(dist.density(v)));
    ctx.lineTo(x(hi), y(0));
    ctx.fill();
    ctx.beginPath();
    for (const v of xs) ctx.lineTo(x(v), y(dist.density(v)));
    ctx.stroke();
  }

  const { ctx, x } = view;
  const pad = padFor(canvas);
  if (!sample) {
    if (label) {
      ctx.fillStyle = '#aab6d4';
      ctx.font = '600 12px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText(label, canvas.width - pad.right, 4);
    }
    return;
  }
  const baseY = canvas.height - pad.bottom - (pad.bottom < 30 ? 6 : 10);
  const dot = canvas.height < 130 ? 3 : 4;
  ctx.fillStyle = COLORS.sample;
  // Stack repeated values (dice, counts) so every draw is visible
  const stacks = new Map();
  for (const v of sample.values) {
    const key = Math.round(x(Math.min(hi, Math.max(lo, v))));
    const level = stacks.get(key) ?? 0;
    stacks.set(key, level + 1);
    ctx.beginPath();
    ctx.arc(key, baseY - level * (dot * 2 + 1), dot, 0, Math.PI * 2);
    ctx.fill();
  }
  const meanX = x(Math.min(hi, Math.max(lo, sample.mean)));
  ctx.strokeStyle = COLORS.curve;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(meanX, 6);
  ctx.lineTo(meanX, canvas.height - pad.bottom);
  ctx.stroke();
  ctx.fillStyle = COLORS.curve;
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.textAlign = meanX > canvas.width - 120 ? 'right' : 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(` mean ${sample.mean.toFixed(3)} `, meanX, 6);
}

// Bottom chart: histogram of sample means, the normal curve the CLT predicts,
// an optional shaded probability region and a marker for the latest sample's mean.
export function drawMeans(canvas, { hist, lo, hi, samples, mean, se, shade, latest }) {
  if (!canvas) return;
  const { bins, origin, width } = hist;
  const hasCurve = Number.isFinite(se) && se > 0;
  const curve = (v) => samples * width * normalDensity(v, mean, se);
  const yMax = Math.max(1, ...bins, hasCurve ? curve(mean) : 0) * 1.1;
  const { ctx, x, y } = frame(canvas, lo, hi, yMax);

  ctx.save();
  ctx.beginPath();
  ctx.rect(x(lo), 0, x(hi) - x(lo), canvas.height);
  ctx.clip();

  if (shade) {
    const a = Math.max(lo, shade.lo);
    const b = Math.min(hi, shade.hi);
    if (b > a) {
      ctx.fillStyle = COLORS.shade;
      ctx.fillRect(x(a), y(yMax), x(b) - x(a), y(0) - y(yMax));
    }
  }

  ctx.fillStyle = COLORS.bars;
  bins.forEach((count, i) => {
    if (!count) return;
    const left = x(origin + i * width);
    const right = x(origin + (i + 1) * width);
    ctx.fillRect(left + 0.5, y(count), Math.max(1, right - left - 1), y(0) - y(count));
  });

  if (hasCurve) {
    ctx.strokeStyle = COLORS.curve;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const points = 400;
    for (let i = 0; i <= points; i += 1) {
      const v = lo + ((hi - lo) * i) / points;
      ctx.lineTo(x(v), y(curve(v)));
    }
    ctx.stroke();
  }

  if (latest !== undefined) {
    ctx.strokeStyle = COLORS.sample;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x(latest), y(0));
    ctx.lineTo(x(latest), y(yMax));
    ctx.stroke();
  }
  ctx.restore();
}
