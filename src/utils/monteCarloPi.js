import { JS_PRNG, PYTHON_PRNG, mulberry32 } from './prng';

// Standard deviation of one point's contribution to the estimate: 4·sqrt(p(1−p)) with p = π/4
export const SPREAD = 4 * Math.sqrt((Math.PI / 4) * (1 - Math.PI / 4));

// Van der Corput radical inverse: the building block of the Halton sequence
function radicalInverse(i, base) {
  let f = 1;
  let r = 0;
  let n = i;
  while (n > 0) {
    f /= base;
    r += f * (n % base);
    n = Math.floor(n / base);
  }
  return r;
}

/**
 * Points in the unit square. `random` uses the seeded generator; `halton` uses the low-discrepancy
 * Halton sequence (bases 2 and 3), which fills the square more evenly and converges faster.
 */
export function generatePoints(method, count, seed, full = false) {
  const rand = mulberry32(seed ?? '');
  const xs = new Float64Array(count);
  const ys = new Float64Array(count);
  const insideSoFar = new Uint32Array(count + 1);
  for (let i = 0; i < count; i += 1) {
    if (method === 'halton') {
      xs[i] = radicalInverse(i + 1, 2);
      ys[i] = radicalInverse(i + 1, 3);
    } else {
      xs[i] = rand();
      ys[i] = rand();
    }
    if (full) {
      // Same draws, stretched over the square from −1 to 1 around a full circle
      xs[i] = xs[i] * 2 - 1;
      ys[i] = ys[i] * 2 - 1;
    }
    insideSoFar[i + 1] = insideSoFar[i] + (xs[i] * xs[i] + ys[i] * ys[i] <= 1 ? 1 : 0);
  }
  return { xs, ys, insideSoFar };
}

/** Many independent runs of n points each: the spread of their estimates. */
export function repeatedEstimates(runs, n, seed) {
  return Array.from({ length: runs }, (_, r) => {
    const rand = mulberry32(`${seed}-run${r + 1}`);
    let inside = 0;
    for (let i = 0; i < n; i += 1) {
      const x = rand();
      const y = rand();
      if (x * x + y * y <= 1) inside += 1;
    }
    return (4 * inside) / n;
  });
}

/**
 * Buffon's needle: drop needles of length L on lines 1 apart. P(cross) = 2L/π, so π ≈ 2L·n / hits.
 * The direction is drawn as a random point in a unit disk (rejection sampling), so π is never used
 * to make the needles — otherwise the experiment would assume its own answer.
 */
export function dropNeedles(count, length, seed) {
  const rand = mulberry32(`${seed ?? ''}-needles`);
  const needles = [];
  let hits = 0;
  for (let i = 0; i < count; i += 1) {
    const cx = rand() * 10;
    const cy = rand() * 6;
    let dx;
    let dy;
    let r2;
    do {
      dx = rand() * 2 - 1;
      dy = rand() * 2 - 1;
      r2 = dx * dx + dy * dy;
    } while (r2 > 1 || r2 === 0);
    const scale = length / 2 / Math.sqrt(r2);
    const y1 = cy - dy * scale;
    const y2 = cy + dy * scale;
    const crosses = Math.floor(y1) !== Math.floor(y2);
    if (crosses) hits += 1;
    needles.push([cx - dx * scale, y1, cx + dx * scale, y2, crosses]);
  }
  return { needles, hits };
}

/** Code that reproduces this exact run (same seed, same points, same answer). */
export function codeSnippet(language, seed, count, full = false) {
  if (language === 'python') {
    return `import math

${PYTHON_PRNG}

rand = make_rng(${JSON.stringify(seed)})
inside = 0
for i in range(${count}):
    x, y = ${full ? "2 * rand() - 1, 2 * rand() - 1" : "rand(), rand()"}
    if x * x + y * y <= 1:
        inside += 1

estimate = 4 * inside / ${count}
print(f"inside={inside} estimate={estimate:.5f} error={estimate - math.pi:+.5f}")`;
  }
  return `${JS_PRNG}

const rand = makeRng(${JSON.stringify(seed)});
let inside = 0;
for (let i = 0; i < ${count}; i++) {
  const x = ${full ? "2 * rand() - 1" : "rand()"};
  const y = ${full ? "2 * rand() - 1" : "rand()"};
  if (x * x + y * y <= 1) inside++;
}

const estimate = (4 * inside) / ${count};
console.log(\`inside=\${inside} estimate=\${estimate.toFixed(5)} error=\${(estimate - Math.PI).toFixed(5)}\`);`;
}
