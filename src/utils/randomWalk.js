import seedrandom from 'seedrandom';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export function generateWalk(steps, stepSize, seed, width, height) {
  const rng = seedrandom(seed ?? '');
  const startX = width / 2;
  const startY = height / 2;
  let x = startX;
  let y = startY;
  const path = [{ x, y }];

  for (let step = 0; step < steps; step += 1) {
    const direction = Math.floor(rng() * 4);

    if (direction === 0) {
      y -= stepSize;
    } else if (direction === 1) {
      y += stepSize;
    } else if (direction === 2) {
      x -= stepSize;
    } else {
      x += stepSize;
    }

    x = clamp(x, 0, width);
    y = clamp(y, 0, height);

    path.push({ x, y });
  }

  return path;
}
