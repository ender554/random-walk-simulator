import { clearCanvas } from '../../utils/canvas';
import { PALETTE } from '../../utils/chart';
import { binomialPmf } from '../../utils/stats';

export const WIDTH = 800;
export const HEIGHT = 680;
const TOP = 34;
const BOARD_H = 330;
const BIN_TOP = 400;
const BIN_BOTTOM = 630;

const choose = (n, k) => {
  let c = 1;
  for (let i = 1; i <= k; i += 1) c = (c * (n - k + i)) / i;
  return Math.round(c);
};

export function layout(width, rows) {
  const spacing = Math.min(56, (width - 40) / (rows + 1));
  const rowH = BOARD_H / Math.max(rows, 1);
  const cx = width / 2;
  // Position after `row` bounces with `rights` of them to the right
  const pegX = (row, rights) => cx + (rights - row / 2) * spacing;
  const pegY = (row) => TOP + row * rowH;
  return { spacing, pegX, pegY };
}

function ballPosition(ball, rows, pegX, pegY) {
  const row = Math.min(Math.floor(ball.t), rows);
  const frac = ball.t - row;
  const fromX = pegX(row, ball.rights[row]);
  if (row >= rows) return [fromX, pegY(rows) + frac * (BIN_TOP - pegY(rows))];
  const toX = pegX(row + 1, ball.rights[row + 1]);
  return [fromX + (toX - fromX) * frac, pegY(row) + frac * (pegY(row + 1) - pegY(row)) - Math.sin(frac * Math.PI) * 8 - 6];
}

/**
 * The board: pegs (optionally labelled with Pascal's triangle path counts), falling balls, the
 * last ball's path, and bins compared with the binomial prediction (and optionally the normal curve).
 */
export function drawBoard(canvas, state) {
  const { rows, p, bins, inFlight, lastPath, view, pascal, normal } = state;
  const ctx = canvas.getContext('2d');
  clearCanvas(ctx, canvas);
  const { spacing, pegX, pegY } = layout(canvas.width, rows);
  const total = bins.reduce((a, b) => a + b, 0);
  const labelFont = rows > 14 ? 9 : rows > 9 ? 11 : 13;

  // Last ball's path
  if (lastPath) {
    ctx.strokeStyle = 'rgba(255, 107, 139, 0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let r = 0; r <= rows; r += 1) ctx.lineTo(pegX(r, lastPath[r]), pegY(r) - 6);
    ctx.lineTo(pegX(rows, lastPath[rows]), BIN_TOP);
    ctx.stroke();
  }

  // Pegs
  for (let r = 0; r < rows; r += 1) {
    for (let k = 0; k <= r; k += 1) {
      ctx.fillStyle = '#56647f';
      ctx.beginPath();
      ctx.arc(pegX(r, k), pegY(r), 3.5, 0, Math.PI * 2);
      ctx.fill();
      if (pascal) {
        ctx.fillStyle = PALETTE.violet;
        ctx.font = `600 ${labelFont}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(String(choose(r, k)), pegX(r, k), pegY(r) + 6);
      }
    }
  }

  // Bins scaled to the expected peak so the final shape fills the space
  const expected = (k) => total * binomialPmf(rows, k, p);
  let peak = 1;
  for (let k = 0; k <= rows; k += 1) peak = Math.max(peak, expected(k), bins[k]);
  const barH = (count) => (count / peak) * (BIN_BOTTOM - BIN_TOP - 24);
  const binX = (k) => pegX(rows, k);

  ctx.strokeStyle = '#1f2836';
  ctx.lineWidth = 1;
  for (let k = 0; k <= rows + 1; k += 1) {
    const edge = binX(k) - spacing / 2;
    ctx.beginPath();
    ctx.moveTo(edge, BIN_TOP - 20);
    ctx.lineTo(edge, BIN_BOTTOM);
    ctx.stroke();
  }

  for (let k = 0; k <= rows; k += 1) {
    const h = barH(bins[k]);
    ctx.fillStyle = lastPath && lastPath[rows] === k ? '#5ff3e2' : PALETTE.cyan;
    ctx.fillRect(binX(k) - spacing / 2 + 2, BIN_BOTTOM - h, spacing - 4, h);
    // Bar labels: count, share of balls, or binomial probability
    if (total > 0 && rows <= 14 && view !== 'none') {
      const label = view === 'count' ? String(bins[k])
        : view === 'fraction' ? `${Math.round((bins[k] / total) * 100)}%`
        : `${(binomialPmf(rows, k, p) * 100).toFixed(rows > 10 ? 1 : 0)}%`;
      ctx.fillStyle = PALETTE.label;
      ctx.font = `${labelFont}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(label, binX(k), BIN_BOTTOM - h - 3);
    }
  }

  if (total > 0) {
    // Exact binomial prediction
    ctx.strokeStyle = PALETTE.yellow;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let k = 0; k <= rows; k += 1) ctx.lineTo(binX(k), BIN_BOTTOM - barH(expected(k)));
    ctx.stroke();

    if (normal && rows >= 2) {
      const mean = rows * p;
      const sd = Math.sqrt(rows * p * (1 - p));
      ctx.strokeStyle = PALETTE.violet;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= 200; i += 1) {
        const k = -0.5 + ((rows + 1) * i) / 200;
        const density = Math.exp(-0.5 * ((k - mean) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI));
        ctx.lineTo(binX(k), BIN_BOTTOM - barH(total * density));
      }
      ctx.stroke();
      // Mean and ±1σ markers
      ctx.setLineDash([5, 4]);
      for (const [offset, alpha] of [[0, 0.9], [-sd, 0.5], [sd, 0.5]]) {
        ctx.strokeStyle = `rgba(167, 139, 250, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(binX(mean + offset), BIN_TOP - 10);
        ctx.lineTo(binX(mean + offset), BIN_BOTTOM);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
  }

  ctx.strokeStyle = '#2c3850';
  ctx.beginPath();
  ctx.moveTo(binX(0) - spacing / 2, BIN_BOTTOM);
  ctx.lineTo(binX(rows) + spacing / 2, BIN_BOTTOM);
  ctx.stroke();

  // Bin labels: number of right bounces, and Pascal's row under them
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const every = rows > 14 ? 2 : 1;
  for (let k = 0; k <= rows; k += every) {
    ctx.fillStyle = PALETTE.label;
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(String(k), binX(k), BIN_BOTTOM + 6);
    if (pascal) {
      ctx.fillStyle = PALETTE.violet;
      ctx.font = `600 ${labelFont}px system-ui, sans-serif`;
      ctx.fillText(choose(rows, k).toLocaleString(), binX(k), BIN_BOTTOM + 24);
    }
  }

  // Falling balls
  ctx.fillStyle = '#edf3ff';
  for (const ball of inFlight) {
    const [x, y] = ballPosition(ball, rows, pegX, pegY);
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
