import { useMemo } from 'react';
import { generateWalk } from '../utils/randomWalk';

const empty = {
  finalDistance: 0,
  expectedDistance: 0,
  meanDistance: 0,
  difference: 0,
};

export function useWalkStats(steps, stepSize, seed) {
  return useMemo(() => {
    if (!steps || !stepSize) return empty;

    const path = generateWalk(steps, stepSize, seed ?? '', 800, 800);
    if (!path.length) return empty;

    const start = path[0];
    let total = 0;

    for (const p of path) {
      total += Math.hypot(p.x - start.x, p.y - start.y);
    }

    const end = path[path.length - 1];

    const finalDistance = Math.hypot(end.x - start.x, end.y - start.y);
    const meanDistance = total / path.length;
    const expectedDistance = Math.sqrt(steps) * stepSize;
    const difference = finalDistance - expectedDistance;

    return { finalDistance, meanDistance, expectedDistance, difference };
  }, [steps, stepSize, seed]);
}
