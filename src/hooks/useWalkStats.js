import { useMemo } from 'react';
import { generateWalk } from '../utils/randomWalk';

const defaultStats = {
  finalDistance: 0,
  expectedDistance: 0,
  meanDistance: 0,
  difference: 0
};

export function useWalkStats(steps, stepSize, seed) {
  return useMemo(() => {
    const parsedSteps = Number(steps);
    const parsedStepSize = Number(stepSize);

    if (!parsedSteps || !parsedStepSize) {
      return defaultStats;
    }

    const path = generateWalk(
      parsedSteps,
      parsedStepSize,
      seed ?? '',
      800,
      800
    );

    if (!path.length) {
      return defaultStats;
    }

    const start = path[0];
    let totalDistance = 0;

    path.forEach(({ x, y }) => {
      totalDistance += Math.hypot(x - start.x, y - start.y);
    });

    const finalPoint = path[path.length - 1];
    const finalDistance = Math.hypot(
      finalPoint.x - start.x,
      finalPoint.y - start.y
    );

    const meanDistance = totalDistance / path.length;
    const expectedDistance = Math.sqrt(parsedSteps) * parsedStepSize;
    const difference = finalDistance - expectedDistance;

    return {
      finalDistance,
      expectedDistance,
      meanDistance,
      difference
    };
  }, [steps, stepSize, seed]);
}
