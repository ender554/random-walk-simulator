import { mulberry32 } from './prng';

export const RULES = {
  lattice4: { label: 'Grid: up, down, left, right', lattice: true },
  lattice8: { label: 'Grid with diagonals (8 directions)', lattice: true },
  angle: { label: 'Any direction (fixed step length)' },
  gaussian: { label: 'Brownian (Gaussian steps)' },
  levy: { label: 'Lévy flight (occasional long jumps)' },
  selfAvoiding: { label: 'Self-avoiding (never revisits a point)', lattice: true },
};

export const MAX_POINTS = 2_000_000; // walkers × steps, to keep memory reasonable

const DIRS4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIAG = Math.SQRT1_2;
const DIRS8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [DIAG, DIAG], [DIAG, -DIAG], [-DIAG, DIAG], [-DIAG, -DIAG]];

/**
 * Walk `walkers` independent walkers for `steps` steps of length 1 (scale on display).
 * Positions are stored interleaved per walker: pos[(w * (steps + 1) + t) * 2 + {0,1}].
 * boundary: 'none' | 'reflect' | 'wrap' inside a square of half-width `box`.
 */
export function generateWalks({ walkers, steps, rule, alpha = 1.5, driftX = 0, driftY = 0, boundary = 'none', box = 50, seed }) {
  const rand = mulberry32(`${seed ?? ''}-walk`);
  const stride = steps + 1;
  const pos = new Float32Array(walkers * stride * 2);
  const trappedAt = new Int32Array(walkers).fill(-1);

  const normal = () => {
    let u = 0;
    while (u === 0) u = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
  };

  for (let w = 0; w < walkers; w += 1) {
    let x = 0;
    let y = 0;
    const visited = rule === 'selfAvoiding' ? new Set(['0,0']) : null;
    const base = w * stride * 2;
    for (let t = 1; t <= steps; t += 1) {
      let dx = 0;
      let dy = 0;
      if (rule === 'lattice4') [dx, dy] = DIRS4[Math.floor(rand() * 4)];
      else if (rule === 'lattice8') [dx, dy] = DIRS8[Math.floor(rand() * 8)];
      else if (rule === 'angle' || rule === 'levy') {
        const angle = rand() * 2 * Math.PI;
        // Lévy: step length from a Pareto tail with exponent alpha (minimum 1)
        const length = rule === 'levy' ? (1 - rand()) ** (-1 / alpha) : 1;
        dx = Math.cos(angle) * length;
        dy = Math.sin(angle) * length;
      } else if (rule === 'gaussian') {
        dx = normal() * DIAG;
        dy = normal() * DIAG;
      } else if (rule === 'selfAvoiding') {
        if (trappedAt[w] === -1) {
          const free = DIRS4.filter(([a, b]) => !visited.has(`${x + a},${y + b}`));
          if (free.length) [dx, dy] = free[Math.floor(rand() * free.length)];
          else trappedAt[w] = t - 1;
        }
      }
      x += dx + driftX;
      y += dy + driftY;
      if (boundary === 'reflect') {
        if (x > box) x = 2 * box - x;
        if (x < -box) x = -2 * box - x;
        if (y > box) y = 2 * box - y;
        if (y < -box) y = -2 * box - y;
      } else if (boundary === 'wrap') {
        if (x > box) x -= 2 * box;
        if (x < -box) x += 2 * box;
        if (y > box) y -= 2 * box;
        if (y < -box) y += 2 * box;
      }
      if (visited) visited.add(`${x},${y}`);
      pos[base + t * 2] = x;
      pos[base + t * 2 + 1] = y;
    }
  }
  return { pos, walkers, steps, trappedAt };
}

/** Average distance and mean squared displacement across walkers at the given step counts. */
export function displacementStats(walk, checkpoints) {
  const { pos, walkers, steps } = walk;
  const stride = (steps + 1) * 2;
  return checkpoints.map((t) => {
    let dist = 0;
    let sq = 0;
    for (let w = 0; w < walkers; w += 1) {
      const x = pos[w * stride + t * 2];
      const y = pos[w * stride + t * 2 + 1];
      const r2 = x * x + y * y;
      sq += r2;
      dist += Math.sqrt(r2);
    }
    return [t, dist / walkers, sq / walkers];
  });
}

/** For grid walks: how many walkers have come back to the start by step t, and returns per walker. */
export function returnStats(walk, upTo) {
  const { pos, walkers, steps } = walk;
  const stride = (steps + 1) * 2;
  let returned = 0;
  let totalReturns = 0;
  let firstReturnSum = 0;
  for (let w = 0; w < walkers; w += 1) {
    let first = -1;
    for (let t = 1; t <= upTo; t += 1) {
      if (Math.abs(pos[w * stride + t * 2]) < 1e-6 && Math.abs(pos[w * stride + t * 2 + 1]) < 1e-6) {
        totalReturns += 1;
        if (first === -1) first = t;
      }
    }
    if (first !== -1) {
      returned += 1;
      firstReturnSum += first;
    }
  }
  return { returned, totalReturns, meanFirstReturn: returned ? firstReturnSum / returned : NaN };
}

export function bounds(walk) {
  let minX = 0;
  let maxX = 0;
  let minY = 0;
  let maxY = 0;
  const { pos } = walk;
  for (let i = 0; i < pos.length; i += 2) {
    if (pos[i] < minX) minX = pos[i];
    if (pos[i] > maxX) maxX = pos[i];
    if (pos[i + 1] < minY) minY = pos[i + 1];
    if (pos[i + 1] > maxY) maxY = pos[i + 1];
  }
  return { minX, maxX, minY, maxY };
}
