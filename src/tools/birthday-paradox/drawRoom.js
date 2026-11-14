import { clearCanvas } from '../../utils/canvas';
import { PALETTE } from '../../utils/chart';

/**
 * People sitting in a circle with a faint line for every pair: the number of lines is the
 * number of chances for a match, which is why the probability climbs so fast.
 * Pairs that share a birthday are drawn bright. Drawn at screen size; the stage prints the
 * count of people and pairs beside it.
 */
export function drawRoom(canvas, days) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  clearCanvas(ctx, canvas);
  const n = days.length;
  const side = Math.min(canvas.width, canvas.height);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r = side / 2 - Math.max(10, side * 0.06);
  const pos = (i) => {
    const angle = (i / Math.max(n, 1)) * Math.PI * 2 - Math.PI / 2;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  };

  // The empty room: the circle people will sit on
  ctx.strokeStyle = 'rgba(138, 150, 179, 0.35)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 5]);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  const matched = new Set();
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

  const dot = side < 200 ? (n > 40 ? 2.5 : 4) : n > 60 ? 4 : 7;
  for (let i = 0; i < n; i += 1) {
    const [x, y] = pos(i);
    ctx.fillStyle = matched.has(i) ? PALETTE.yellow : PALETTE.cyan;
    ctx.beginPath();
    ctx.arc(x, y, dot, 0, Math.PI * 2);
    ctx.fill();
  }
}
