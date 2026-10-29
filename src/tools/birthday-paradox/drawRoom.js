import { clearCanvas } from '../../utils/canvas';
import { PALETTE } from '../../utils/chart';

/**
 * People sitting in a circle with a faint line for every pair: the number of lines is the
 * number of chances for a match, which is why the probability climbs so fast.
 * Pairs that share a birthday are drawn bright.
 */
export function drawRoom(canvas, days) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  clearCanvas(ctx, canvas);
  const n = days.length;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r = Math.min(cx, cy) - 28;
  const pos = (i) => {
    const angle = (i / Math.max(n, 1)) * Math.PI * 2 - Math.PI / 2;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  };

  const matched = new Set();
  ctx.lineWidth = 1;
  ctx.strokeStyle = n > 40 ? 'rgba(138, 150, 179, 0.12)' : 'rgba(138, 150, 179, 0.3)';
  ctx.beginPath();
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      const [x1, y1] = pos(i);
      const [x2, y2] = pos(j);
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      if (days[i] === days[j]) {
        matched.add(i);
        matched.add(j);
      }
    }
  }
  ctx.stroke();

  ctx.strokeStyle = PALETTE.yellow;
  ctx.lineWidth = 3;
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      if (days[i] !== days[j]) continue;
      const [x1, y1] = pos(i);
      const [x2, y2] = pos(j);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }

  const dot = n > 60 ? 4 : 7;
  for (let i = 0; i < n; i += 1) {
    const [x, y] = pos(i);
    ctx.fillStyle = matched.has(i) ? PALETTE.yellow : PALETTE.cyan;
    ctx.beginPath();
    ctx.arc(x, y, dot, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = PALETTE.label;
  ctx.font = '600 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${n} people · ${((n * (n - 1)) / 2).toLocaleString()} pairs`, cx, cy);
}
