import { mulberry32 } from './prng';

export const SEEDS = {
  point: 'One seed in the center',
  points: 'Several seeds',
  ring: 'Ring (grows inward)',
  line: 'Bottom edge (frost, electrodeposition)',
};

const MOVES = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/**
 * Diffusion-limited aggregation on a square grid. Walkers random-walk until they touch the
 * cluster and stick with probability `stickiness`. Every particle remembers the neighbor it stuck
 * to (its parent) and its branch depth, for coloring and SVG export.
 * Call step(budget) repeatedly; it returns the particles added since the last call.
 */
export function createAggregation({ size, stickiness, maxParticles, seed, seedShape = 'point', biasStrength = 0, biasAngle = 0 }) {
  const rand = mulberry32(`${seed ?? ''}-dla`);
  const grid = new Int32Array(size * size).fill(-1); // particle index, or -1 if empty
  const center = Math.floor(size / 2);
  const capacity = maxParticles + size * 4;
  const px = new Int16Array(capacity);
  const py = new Int16Array(capacity);
  const parent = new Int32Array(capacity).fill(-1);
  const depth = new Int32Array(capacity);
  let count = 0;
  let seeds = 0;
  let radius = 1; // farthest particle from the center (or highest row, for the line seed)
  let maxDepth = 0;
  let done = false;
  let walker = null;

  const add = (x, y, from) => {
    grid[y * size + x] = count;
    px[count] = x;
    py[count] = y;
    parent[count] = from;
    depth[count] = from >= 0 ? depth[from] + 1 : 0;
    if (depth[count] > maxDepth) maxDepth = depth[count];
    count += 1;
    return count - 1;
  };

  // Seed shapes
  if (seedShape === 'line') {
    for (let x = 0; x < size; x += 1) add(x, size - 1, -1);
    radius = 1;
  } else if (seedShape === 'ring') {
    const r = Math.floor(size * 0.45);
    // Fine angular steps keep the ring 4-connected so walkers can't slip through
    let last = -1;
    for (let i = 0; i < 8 * r * 4; i += 1) {
      const a = (i / (8 * r * 4)) * Math.PI * 2;
      const x = Math.round(center + r * Math.cos(a));
      const y = Math.round(center + r * Math.sin(a));
      if (grid[y * size + x] === -1) {
        if (last >= 0 && Math.abs(px[last] - x) === 1 && Math.abs(py[last] - y) === 1 && grid[py[last] * size + x] === -1) add(x, py[last], -1);
        last = add(x, y, -1);
      }
    }
    radius = r;
  } else if (seedShape === 'points') {
    for (let i = 0; i < 6; i += 1) {
      const a = rand() * Math.PI * 2;
      const r = size * 0.08 + rand() * size * 0.22;
      add(Math.round(center + r * Math.cos(a)), Math.round(center + r * Math.sin(a)), -1);
    }
    radius = size * 0.3;
  } else {
    add(center, center, -1);
  }
  seeds = count;

  // Biased step weights: drift toward biasAngle (0° = right, 90° = up)
  const ux = Math.cos((biasAngle * Math.PI) / 180);
  const uy = -Math.sin((biasAngle * Math.PI) / 180);
  const weights = MOVES.map(([dx, dy]) => Math.max(0.02, 1 + biasStrength * 3 * (dx * ux + dy * uy)));
  const total = weights.reduce((a, b) => a + b, 0);
  const cumulative = weights.map((_, i) => weights.slice(0, i + 1).reduce((a, b) => a + b, 0) / total);

  const distance = (x, y) => (seedShape === 'line' ? size - 1 - y : Math.hypot(x - center, y - center));

  const launch = () => {
    if (seedShape === 'line') return { x: Math.floor(rand() * size), y: Math.max(1, size - 1 - Math.round(radius) - 6) };
    if (seedShape === 'ring') {
      const a = rand() * Math.PI * 2;
      const r = rand() * Math.max(2, radius * 0.25);
      return { x: Math.round(center + r * Math.cos(a)), y: Math.round(center + r * Math.sin(a)) };
    }
    const a = rand() * Math.PI * 2;
    const r = radius + 5;
    return { x: Math.round(center + r * Math.cos(a)), y: Math.round(center + r * Math.sin(a)) };
  };

  const occupiedNeighbor = (x, y) => {
    for (const [dx, dy] of MOVES) {
      let nx = x + dx;
      if (seedShape === 'line') nx = (nx + size) % size;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
      const idx = grid[ny * size + nx];
      if (idx >= 0) return idx;
    }
    return -1;
  };

  const finished = () => {
    if (count - seeds >= maxParticles) return true;
    if (seedShape === 'line') return radius >= size - 8;
    if (seedShape === 'ring') return radius <= 6;
    return radius >= center - 3;
  };

  // Recent walker positions, for the "show walkers" overlay
  const trail = [];

  function step(budget) {
    const added = [];
    while (budget > 0 && !done) {
      if (finished()) {
        done = true;
        break;
      }
      if (!walker) walker = launch();
      const { x, y } = walker;
      const neighbor = occupiedNeighbor(x, y);
      if (neighbor >= 0 && grid[y * size + x] === -1 && rand() < stickiness) {
        const idx = add(x, y, neighbor);
        added.push(idx);
        if (seedShape === 'ring') radius = Math.min(radius, distance(x, y));
        else radius = Math.max(radius, distance(x, y));
        walker = null;
        continue;
      }
      const r = rand();
      const m = r < cumulative[0] ? 0 : r < cumulative[1] ? 1 : r < cumulative[2] ? 2 : 3;
      let nx = x + MOVES[m][0];
      const ny = y + MOVES[m][1];
      budget -= 1;
      if (seedShape === 'line') nx = (nx + size) % size;
      const offGrid = nx < 1 || ny < 1 || nx >= size - 1 || ny >= size - 1;
      const tooFar = seedShape === 'line' ? size - 1 - ny > radius + 25
        : seedShape === 'ring' ? false
        : distance(nx, ny) > radius + 20;
      if ((offGrid && seedShape !== 'line') || tooFar || (seedShape === 'line' && ny < 1)) {
        walker = null;
      } else if (grid[ny * size + nx] === -1) {
        walker = { x: nx, y: ny };
        trail.push(nx, ny);
        if (trail.length > 600) trail.splice(0, 2);
      }
    }
    return added;
  }

  return {
    step,
    size,
    seedShape,
    center,
    px,
    py,
    parent,
    depth,
    trail,
    get count() { return count; },
    get seeds() { return seeds; },
    get radius() { return radius; },
    get maxDepth() { return maxDepth; },
    get done() { return done; },
  };
}

/** Mass–radius data for a center-seeded cluster: particles within radius r, for log-spaced r. */
export function massRadius(sim) {
  const maxR = sim.radius;
  if (sim.seedShape !== 'point' || maxR < 8) return null;
  const points = [];
  const radii = [];
  for (let r = 2; r <= maxR; r *= 1.15) radii.push(r);
  const dist = Array.from({ length: sim.count }, (_, i) => Math.hypot(sim.px[i] - sim.center, sim.py[i] - sim.center)).sort((a, b) => a - b);
  let j = 0;
  for (const r of radii) {
    while (j < dist.length && dist[j] <= r) j += 1;
    points.push([r, j]);
  }
  // Least-squares slope of log N against log r, skipping the core and the still-growing edge
  const fit = points.filter(([r]) => r >= 3 && r <= maxR * 0.6);
  if (fit.length < 4) return { points, slope: NaN };
  const xs = fit.map(([r]) => Math.log(r));
  const ys = fit.map(([, n]) => Math.log(n));
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const my = ys.reduce((a, b) => a + b, 0) / ys.length;
  let num = 0;
  let den = 0;
  xs.forEach((x, i) => {
    num += (x - mx) * (ys[i] - my);
    den += (x - mx) ** 2;
  });
  const slope = num / den;
  return { points, slope, intercept: my - slope * mx, fitRange: [fit[0][0], fit[fit.length - 1][0]] };
}
