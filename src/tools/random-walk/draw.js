import { PALETTE, chartFrame, clipToPlot, evenTicks } from '../../utils/chart';

export const PALETTES = {
  neon: ['#1de5d0', '#ff6b8b', '#ffd166', '#a78bfa', '#7dd3fc', '#86efac', '#fdba74', '#f0abfc'],
  viridis: ['#440154', '#46327e', '#365c8d', '#277f8e', '#1fa187', '#4ac16d', '#a0da39', '#fde725'],
  sunset: ['#2d1e5f', '#6b2d7b', '#a8326e', '#d9485b', '#f2734a', '#f9a64a', '#fbd476'],
  ocean: ['#03045e', '#023e8a', '#0077b6', '#0096c7', '#00b4d8', '#48cae4', '#90e0ef', '#caf0f8'],
  mono: ['#edf3ff'],
  ink: ['#111827'],
};

export const BACKGROUNDS = {
  dark: '#0b0f14',
  paper: '#f7f3ea',
  white: '#ffffff',
  transparent: null,
};

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Interpolate along a palette, t in [0, 1]
export function paletteColor(palette, t) {
  if (palette.length === 1) return palette[0];
  const scaled = Math.min(0.9999, Math.max(0, t)) * (palette.length - 1);
  const i = Math.floor(scaled);
  const f = scaled - i;
  const a = hexToRgb(palette[i]);
  const b = hexToRgb(palette[i + 1]);
  return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * f)).join(',')})`;
}

/** Maps walk coordinates onto the canvas, keeping the aspect ratio and centered on the start. */
export function makeView(width, height, b, pad = 20) {
  const span = Math.max(b.maxX - b.minX, b.maxY - b.minY, 10);
  const scale = (Math.min(width, height) - pad * 2) / span;
  const cx = (b.minX + b.maxX) / 2;
  const cy = (b.minY + b.maxY) / 2;
  return {
    scale,
    x: (v) => width / 2 + (v - cx) * scale,
    y: (v) => height / 2 - (v - cy) * scale,
  };
}

/**
 * Draws walker paths from step `from` to `to` (incrementally when from > 0), or a heatmap of
 * every visited position. Wrapped walks are broken where they jump across the box.
 */
export function drawWalks(canvas, opts) {
  const { walk, from = 0, to, view, colorMode, palette, lineWidth, opacity, background, bounds: b, jumpLimit } = opts;
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const map = makeView(width, height, b);
  const colors = PALETTES[palette] ?? PALETTES.neon;
  const stride = (walk.steps + 1) * 2;

  if (from === 0) {
    ctx.clearRect(0, 0, width, height);
    if (BACKGROUNDS[background]) {
      ctx.fillStyle = BACKGROUNDS[background];
      ctx.fillRect(0, 0, width, height);
    }
  }

  if (view === 'heatmap') {
    const cells = 160;
    const counts = new Uint32Array(cells * cells);
    const cell = Math.min(width, height) / cells;
    let max = 1;
    for (let w = 0; w < walk.walkers; w += 1) {
      for (let t = 0; t <= to; t += 1) {
        const px = Math.floor(map.x(walk.pos[w * stride + t * 2]) / cell);
        const py = Math.floor(map.y(walk.pos[w * stride + t * 2 + 1]) / cell);
        if (px < 0 || py < 0 || px >= cells || py >= cells) continue;
        const v = (counts[py * cells + px] += 1);
        if (v > max) max = v;
      }
    }
    const logMax = Math.log1p(max);
    for (let i = 0; i < counts.length; i += 1) {
      if (!counts[i]) continue;
      ctx.fillStyle = paletteColor(colors, Math.log1p(counts[i]) / logMax);
      ctx.fillRect((i % cells) * cell, Math.floor(i / cells) * cell, cell + 0.5, cell + 0.5);
    }
    return;
  }

  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = opacity;
  const start = Math.max(0, from - 1);
  // Long walks: skip points that land on the same pixel to keep drawing fast
  const skip = Math.max(1, Math.floor(walk.steps / 20000));
  for (let w = 0; w < walk.walkers; w += 1) {
    const base = w * stride;
    if (colorMode === 'time') {
      // Short segments, each colored by how far along the walk it is
      const chunk = Math.max(skip, Math.ceil(walk.steps / 120));
      for (let s = start; s < to; s += chunk) {
        const end = Math.min(to, s + chunk);
        ctx.strokeStyle = paletteColor(colors, s / walk.steps);
        ctx.beginPath();
        ctx.moveTo(map.x(walk.pos[base + s * 2]), map.y(walk.pos[base + s * 2 + 1]));
        for (let t = s + 1; t <= end; t += 1) {
          const px = walk.pos[base + t * 2];
          const py = walk.pos[base + t * 2 + 1];
          const jumped = jumpLimit && (Math.abs(px - walk.pos[base + (t - 1) * 2]) > jumpLimit || Math.abs(py - walk.pos[base + (t - 1) * 2 + 1]) > jumpLimit);
          if (jumped) ctx.moveTo(map.x(px), map.y(py));
          else if ((t - s) % skip === 0 || t === end) ctx.lineTo(map.x(px), map.y(py));
        }
        ctx.stroke();
      }
    } else {
      ctx.strokeStyle = colorMode === 'single' ? colors[0] : colors[w % colors.length];
      ctx.beginPath();
      ctx.moveTo(map.x(walk.pos[base + start * 2]), map.y(walk.pos[base + start * 2 + 1]));
      for (let t = start + 1; t <= to; t += 1) {
        const px = walk.pos[base + t * 2];
        const py = walk.pos[base + t * 2 + 1];
        const jumped = jumpLimit && (Math.abs(px - walk.pos[base + (t - 1) * 2]) > jumpLimit || Math.abs(py - walk.pos[base + (t - 1) * 2 + 1]) > jumpLimit);
        if (jumped) ctx.moveTo(map.x(px), map.y(py));
        else if (t % skip === 0 || t === to) ctx.lineTo(map.x(px), map.y(py));
      }
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  // Start marker
  ctx.fillStyle = background === 'dark' || background === 'transparent' ? '#ffffff' : '#111827';
  ctx.beginPath();
  ctx.arc(map.x(0), map.y(0), Math.max(2.5, lineWidth * 1.5), 0, Math.PI * 2);
  ctx.fill();
}

/** Distance (or mean squared displacement) against steps, with the theoretical curve. */
export function drawDisplacement(canvas, { stats, steps, measure, theory }) {
  const index = measure === 'msd' ? 2 : 1;
  const yMax = Math.max(1, ...stats.map((s) => s[index]), ...(theory ? [theory(steps)] : [])) * 1.1;
  const frame = chartFrame(canvas, {
    xMin: 0, xMax: steps, yMin: 0, yMax,
    xTicks: evenTicks(0, steps, 5).map(Math.round),
    yTicks: evenTicks(0, yMax, 4),
    formatY: (v) => (v >= 100 ? Math.round(v).toLocaleString() : v.toFixed(1)),
    xLabel: 'Steps',
    pad: { left: 64, right: 18, top: 14, bottom: 42 },
  });
  const { ctx, x, y } = frame;
  clipToPlot(frame);
  if (theory) {
    ctx.strokeStyle = PALETTE.yellow;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    for (let i = 0; i <= 100; i += 1) {
      const t = (steps * i) / 100;
      ctx.lineTo(x(t), y(theory(t)));
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.strokeStyle = PALETTE.cyan;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (const s of stats) ctx.lineTo(x(s[0]), y(s[index]));
  ctx.stroke();
  ctx.restore();
}

/** SVG with one polyline per walker, for pen plotters and vector editing. */
export function walksToSvg({ walk, colorMode, palette, lineWidth, opacity, background, bounds: b, size = 1000 }) {
  const map = makeView(size, size, b);
  const colors = PALETTES[palette] ?? PALETTES.neon;
  const stride = (walk.steps + 1) * 2;
  const skip = Math.max(1, Math.ceil(walk.steps / 5000));
  const lines = [];
  for (let w = 0; w < walk.walkers; w += 1) {
    const pts = [];
    for (let t = 0; t <= walk.steps; t += skip) {
      pts.push(`${map.x(walk.pos[w * stride + t * 2]).toFixed(2)},${map.y(walk.pos[w * stride + t * 2 + 1]).toFixed(2)}`);
    }
    const color = colorMode === 'single' ? colors[0] : colors[w % colors.length];
    lines.push(`<polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="${lineWidth}" stroke-opacity="${opacity}" stroke-linejoin="round" stroke-linecap="round"/>`);
  }
  const bg = BACKGROUNDS[background] ? `<rect width="100%" height="100%" fill="${BACKGROUNDS[background]}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${bg}${lines.join('')}</svg>`;
}
