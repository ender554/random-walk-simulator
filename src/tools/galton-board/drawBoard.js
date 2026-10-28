import { clearCanvas } from '../../utils/canvas';
import { PALETTE } from '../../utils/chart';
import { binomialPmf } from '../../utils/stats';

export const TOP = 30;
export const BOARD_H = 330;
export const BIN_TOP = 390;
export const BIN_BOTTOM = 620;

export function layout(canvas, rows) {
  const spacing = Math.min(44, (canvas.width - 40) / (rows + 1));
  const rowH = BOARD_H / rows;
  const cx = canvas.width / 2;
  // Position after `row` bounces with `rights` of them to the right
  const pegX = (row, rights) => cx + (rights - row / 2) * spacing;
  const pegY = (row) => TOP + row * rowH;
  return { spacing, rowH, cx, pegX, pegY };
}

// balls: [{ rights: number[] (cumulative), t: progress in rows }]
export function drawBoard(canvas, { rows, p, bins, inFlight, total }) {
  const ctx = canvas.getContext('2d');
  clearCanvas(ctx, canvas);
  const { spacing, pegX, pegY } = layout(canvas, rows);

  // Pegs
  ctx.fillStyle = '#56647f';
  for (let r = 0; r < rows; r += 1) {
    for (let k = 0; k <= r; k += 1) {
      ctx.beginPath();
      ctx.arc(pegX(r, k), pegY(r), 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Bins: bars scaled to the expected peak so the final shape fills the space
  const expected = (k) => total * binomialPmf(rows, k, p);
  let peak = 1;
  for (let k = 0; k <= rows; k += 1) peak = Math.max(peak, expected(k), bins[k]);
  const barH = (count) => (count / peak) * (BIN_BOTTOM - BIN_TOP);
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

  ctx.fillStyle = PALETTE.cyan;
  for (let k = 0; k <= rows; k += 1) {
    const h = barH(bins[k]);
    ctx.fillRect(binX(k) - spacing / 2 + 2, BIN_BOTTOM - h, spacing - 4, h);
  }

  // Expected binomial counts
  ctx.strokeStyle = PALETTE.yellow;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let k = 0; k <= rows; k += 1) ctx.lineTo(binX(k), BIN_BOTTOM - barH(expected(k)));
  ctx.stroke();

  ctx.strokeStyle = '#2c3850';
  ctx.beginPath();
  ctx.moveTo(binX(0) - spacing / 2, BIN_BOTTOM);
  ctx.lineTo(binX(rows) + spacing / 2, BIN_BOTTOM);
  ctx.stroke();

  // Bin labels
  ctx.fillStyle = PALETTE.label;
  ctx.font = '12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const labelEvery = rows > 14 ? 2 : 1;
  for (let k = 0; k <= rows; k += labelEvery) ctx.fillText(String(k), binX(k), BIN_BOTTOM + 6);

  // Falling balls: interpolate between pegs with a small hop
  ctx.fillStyle = '#edf3ff';
  for (const ball of inFlight) {
    const row = Math.min(Math.floor(ball.t), rows);
    const frac = ball.t - row;
    const fromX = pegX(row, ball.rights[row]);
    const toRow = Math.min(row + 1, rows);
    const toX = row >= rows ? fromX : pegX(toRow, ball.rights[toRow]);
    const xPos = fromX + (toX - fromX) * frac;
    const yPos =
      row >= rows
        ? pegY(rows) + frac * (BIN_TOP - pegY(rows))
        : pegY(row) + frac * (pegY(toRow) - pegY(row)) - Math.sin(frac * Math.PI) * 8 - 6;
    ctx.beginPath();
    ctx.arc(xPos, yPos, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}
