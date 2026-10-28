import { clearCanvas } from '../../utils/canvas';

export const COLORS = {
  target: '#1de5d0',
  ruin: '#ff6b8b',
  unfinished: '#ffd166',
};

const PAD = { left: 56, right: 18, top: 18, bottom: 42 };

// Bankroll over time for every game: x = bets placed, y = bankroll.
export function drawGames(canvas, results, start, target) {
  const ctx = canvas?.getContext('2d');
  if (!ctx) return;

  clearCanvas(ctx, canvas);

  const plotW = canvas.width - PAD.left - PAD.right;
  const plotH = canvas.height - PAD.top - PAD.bottom;
  const longest = Math.max(1, ...results.map((r) => r.path.length - 1));
  const x = (i) => PAD.left + (i / longest) * plotW;
  const y = (v) => PAD.top + (1 - v / target) * plotH;

  // Reference lines: broke, starting bankroll, target
  ctx.font = '13px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const refs = [
    { v: 0, label: '$0', color: COLORS.ruin },
    { v: start, label: `$${start}`, color: '#8a96b3', dashed: true },
    { v: target, label: `$${target}`, color: COLORS.target },
  ];
  for (const ref of refs) {
    ctx.strokeStyle = ref.color;
    ctx.lineWidth = 1;
    ctx.setLineDash(ref.dashed ? [5, 5] : []);
    ctx.beginPath();
    ctx.moveTo(PAD.left, y(ref.v));
    ctx.lineTo(PAD.left + plotW, y(ref.v));
    ctx.stroke();
    ctx.fillStyle = ref.color;
    ctx.fillText(ref.label, PAD.left - 8, y(ref.v));
  }
  ctx.setLineDash([]);

  // Thin paths overlap a lot, so draw them translucent; downsample very long games.
  ctx.globalAlpha = results.length > 20 ? 0.35 : 0.8;
  for (const { path, outcome } of results) {
    const stride = Math.max(1, Math.floor(path.length / (plotW * 2)));
    ctx.strokeStyle = COLORS[outcome];
    ctx.beginPath();
    ctx.moveTo(x(0), y(path[0]));
    for (let i = stride; i < path.length; i += stride) {
      ctx.lineTo(x(i), y(path[i]));
    }
    ctx.lineTo(x(path.length - 1), y(path[path.length - 1]));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // X axis labels
  ctx.fillStyle = '#aab6d4';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillText('0', PAD.left, PAD.top + plotH + 8);
  ctx.textAlign = 'right';
  ctx.fillText(longest.toLocaleString(), PAD.left + plotW, PAD.top + plotH + 8);
  ctx.textAlign = 'center';
  ctx.fillText('Bets placed', PAD.left + plotW / 2, PAD.top + plotH + 8);
}
