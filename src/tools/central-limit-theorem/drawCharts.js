import { clearCanvas } from '../../utils/canvas';
import { normalDensity } from '../../utils/clt';

export const COLORS = {
  bars: '#1de5d0',
  curve: '#ffd166',
};

const PAD = { left: 16, right: 16, top: 14, bottom: 34 };

function frame(canvas, lo, hi, yMax) {
  const ctx = canvas.getContext('2d');
  clearCanvas(ctx, canvas);
  const plotW = canvas.width - PAD.left - PAD.right;
  const plotH = canvas.height - PAD.top - PAD.bottom;
  const x = (v) => PAD.left + ((v - lo) / (hi - lo)) * plotW;
  const y = (v) => PAD.top + (1 - v / yMax) * plotH;

  // Baseline and five evenly spaced x labels
  ctx.strokeStyle = '#2c3850';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD.left, y(0));
  ctx.lineTo(PAD.left + plotW, y(0));
  ctx.stroke();

  ctx.fillStyle = '#aab6d4';
  ctx.font = '13px system-ui, sans-serif';
  ctx.textBaseline = 'top';
  const span = hi - lo;
  const digits = span < 0.5 ? 3 : span <= 5 ? 2 : 1;
  for (let i = 0; i <= 4; i += 1) {
    const v = lo + (span * i) / 4;
    ctx.textAlign = i === 0 ? 'left' : i === 4 ? 'right' : 'center';
    ctx.fillText(v.toFixed(digits), x(v), y(0) + 8);
  }

  return { ctx, x, y };
}

// Top chart: what a single draw from the source distribution looks like.
export function drawSource(canvas, dist) {
  if (!canvas) return;
  const [lo, hi] = dist.range;

  if (dist.values) {
    const yMax = Math.max(...dist.values.map(dist.prob)) * 1.1;
    const { ctx, x, y } = frame(canvas, lo, hi, yMax);
    ctx.fillStyle = COLORS.bars;
    for (const v of dist.values) {
      const half = (x(v + 0.3) - x(v - 0.3)) / 2;
      ctx.fillRect(x(v) - half, y(dist.prob(v)), half * 2, y(0) - y(dist.prob(v)));
    }
    return;
  }

  const points = 400;
  const xs = Array.from({ length: points + 1 }, (_, i) => lo + ((hi - lo) * i) / points);
  const yMax = Math.max(...xs.map(dist.density)) * 1.1;
  const { ctx, x, y } = frame(canvas, lo, hi, yMax);
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

// Bottom chart: histogram of sample means with the normal curve the CLT predicts.
export function drawMeans(canvas, { hist, lo, hi, samples, mean, se }) {
  if (!canvas) return;
  const { bins, origin, width } = hist;
  const curve = (v) => samples * width * normalDensity(v, mean, se);
  const yMax = Math.max(...bins, curve(mean)) * 1.1;
  const { ctx, x, y } = frame(canvas, lo, hi, yMax);

  ctx.save();
  ctx.beginPath();
  ctx.rect(x(lo), 0, x(hi) - x(lo), canvas.height);
  ctx.clip();

  ctx.fillStyle = COLORS.bars;
  bins.forEach((count, i) => {
    if (!count) return;
    const left = x(origin + i * width);
    const right = x(origin + (i + 1) * width);
    ctx.fillRect(left + 0.5, y(count), Math.max(1, right - left - 1), y(0) - y(count));
  });

  ctx.strokeStyle = COLORS.curve;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  const points = 400;
  for (let i = 0; i <= points; i += 1) {
    const v = lo + ((hi - lo) * i) / points;
    ctx.lineTo(x(v), y(curve(v)));
  }
  ctx.stroke();
  ctx.restore();
}
