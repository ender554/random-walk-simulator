import seedrandom from 'seedrandom';

const MOVES = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/**
 * Diffusion-limited aggregation on a square grid. Walkers start on a circle just outside
 * the cluster, random-walk until they touch it, and stick with probability `stickiness`.
 * Call step(budget) repeatedly; it returns the cells added since the last call.
 */
export function createAggregation({ size, stickiness, maxParticles, seed }) {
  const rng = seedrandom.alea(seed ?? '');
  const grid = new Uint32Array(size * size); // 0 = empty, otherwise attachment order
  const center = Math.floor(size / 2);
  const edgeLimit = center - 3;
  grid[center * size + center] = 1;

  let count = 1;
  let radius = 1;
  let walker = null;

  const occupied = (x, y) => grid[y * size + x] !== 0;
  const touching = (x, y) =>
    occupied(x + 1, y) || occupied(x - 1, y) || occupied(x, y + 1) || occupied(x, y - 1);

  const launch = () => {
    const angle = rng() * Math.PI * 2;
    const r = radius + 5;
    return {
      x: Math.round(center + r * Math.cos(angle)),
      y: Math.round(center + r * Math.sin(angle)),
    };
  };

  function step(budget) {
    const added = [];
    while (budget > 0 && radius < edgeLimit && count < maxParticles) {
      if (!walker) walker = launch();
      const { x, y } = walker;

      if (touching(x, y) && rng() < stickiness) {
        count += 1;
        grid[y * size + x] = count;
        radius = Math.max(radius, Math.hypot(x - center, y - center));
        added.push({ x, y, order: count });
        walker = null;
        continue;
      }

      const [dx, dy] = MOVES[Math.floor(rng() * 4)];
      const nx = x + dx;
      const ny = y + dy;
      budget -= 1;
      // Too far away to matter: start again near the cluster instead of wandering for ages
      const offGrid = nx < 1 || ny < 1 || nx >= size - 1 || ny >= size - 1;
      if (offGrid || Math.hypot(nx - center, ny - center) > radius + 20) {
        walker = null;
      } else if (!occupied(nx, ny)) {
        walker = { x: nx, y: ny };
      }
    }
    return added;
  }

  return {
    step,
    get count() {
      return count;
    },
    get radius() {
      return radius;
    },
    get full() {
      return radius >= edgeLimit || count >= maxParticles;
    },
    center,
  };
}
