import { BACKGROUNDS, PALETTES, paletteColor } from '../../utils/palettes';
import { PALETTE, chartFrame, clipToPlot } from '../../utils/chart';

// Position along the palette for particle i, by the chosen color mode
function shade(sim, i, mode, norm) {
  if (i < sim.seeds) return 0;
  if (mode === 'distance') {
    const d = sim.seedShape === 'line' ? sim.size - 1 - sim.py[i] : Math.hypot(sim.px[i] - sim.center, sim.py[i] - sim.center);
    return d / norm.distance;
  }
  if (mode === 'depth') return sim.depth[i] / norm.depth;
  return (i - sim.seeds) / norm.order;
}

export function normalizers(sim, maxParticles) {
  return {
    order: Math.max(1, maxParticles),
    distance: sim.seedShape === 'line' ? sim.size : sim.size / 2,
    // Rough final branch length while growing; replaced by the real maximum when finished
    depth: Math.max(10, sim.maxDepth, Math.sqrt(maxParticles) * 1.5),
  };
}

/**
 * Draws particles [from, to) of the cluster. With from = 0 the canvas is cleared and the
 * background painted first; later calls add only new particles.
 */
export function drawCluster(canvas, { sim, from, to, colorMode, palette, background, norm }) {
  const ctx = canvas.getContext('2d');
  const cell = canvas.width / sim.size;
  const colors = PALETTES[palette] ?? PALETTES.neon;
  if (from === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (BACKGROUNDS[background]) {
      ctx.fillStyle = BACKGROUNDS[background];
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }
  for (let i = from; i < to; i += 1) {
    ctx.fillStyle = i < sim.seeds ? (background === 'dark' || background === 'transparent' ? '#edf3ff' : '#111827') : paletteColor(colors, shade(sim, i, colorMode, norm));
    ctx.fillRect(sim.px[i] * cell, sim.py[i] * cell, cell + 0.15, cell + 0.15);
  }
}

// The current walker's recent path, on a transparent overlay canvas
export function drawWalkers(canvas, sim) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const cell = canvas.width / sim.size;
  const { trail } = sim;
  for (let i = 0; i < trail.length; i += 2) {
    ctx.fillStyle = `rgba(255, 255, 255, ${0.15 + (0.6 * i) / trail.length})`;
    ctx.fillRect(trail[i] * cell, trail[i + 1] * cell, cell, cell);
  }
}

/** Mass–radius on log–log axes with the fitted slope and the 1.71 reference. */
export function drawMassRadius(canvas, mr) {
  if (!mr) return;
  const { points, slope, intercept, fitRange } = mr;
  const maxR = points[points.length - 1][0];
  const maxN = Math.max(...points.map(([, n]) => n));
  const frame = chartFrame(canvas, {
    xMin: 2, xMax: maxR * 1.05, yMin: 1, yMax: maxN * 1.5, logX: true, logY: true,
    xTicks: [2, 5, 10, 20, 50, 100, 200].filter((v) => v <= maxR),
    yTicks: [1, 10, 100, 1000, 10000, 100000].filter((v) => v <= maxN * 1.5),
    xLabel: 'Radius r (cells, log scale)',
  });
  const { ctx, x, y } = frame;
  clipToPlot(frame);
  if (Number.isFinite(slope)) {
    const line = (s, b, color, dash) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash(dash);
      ctx.beginPath();
      ctx.moveTo(x(2), y(Math.exp(b + s * Math.log(2))));
      ctx.lineTo(x(maxR), y(Math.exp(b + s * Math.log(maxR))));
      ctx.stroke();
      ctx.setLineDash([]);
    };
    // Reference line with slope 1.71 through the middle of the fitted range
    const mid = Math.sqrt(fitRange[0] * fitRange[1]);
    const midLogN = intercept + slope * Math.log(mid);
    line(1.71, midLogN - 1.71 * Math.log(mid), 'rgba(167, 139, 250, 0.8)', [6, 5]);
    line(slope, intercept, PALETTE.yellow, []);
  }
  ctx.fillStyle = PALETTE.cyan;
  for (const [r, n] of points) {
    if (n < 1) continue;
    ctx.beginPath();
    ctx.arc(x(r), y(n), 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** SVG of every particle-to-parent link: the branching tree, for plotters and laser cutters. */
export function clusterToSvg({ sim, colorMode, palette, background, norm, size = 1000 }) {
  const cell = size / sim.size;
  const colors = PALETTES[palette] ?? PALETTES.neon;
  const lines = [];
  for (let i = sim.seeds; i < sim.count; i += 1) {
    const p = sim.parent[i];
    if (p < 0) continue;
    const x1 = (sim.px[i] + 0.5) * cell;
    const y1 = (sim.py[i] + 0.5) * cell;
    const x2 = (sim.px[p] + 0.5) * cell;
    const y2 = (sim.py[p] + 0.5) * cell;
    if (Math.abs(x1 - x2) > cell * 2) continue; // skip links that wrap around the edge
    lines.push(`<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${paletteColor(colors, shade(sim, i, colorMode, norm))}"/>`);
  }
  const bg = BACKGROUNDS[background] ? `<rect width="100%" height="100%" fill="${BACKGROUNDS[background]}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" stroke-width="${(cell * 0.8).toFixed(2)}" stroke-linecap="round">${bg}${lines.join('')}</svg>`;
}
