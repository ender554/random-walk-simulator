import seedrandom from 'seedrandom';

export const DAYS = 365;
export const MONTHS = [
  ['Jan', 31], ['Feb', 28], ['Mar', 31], ['Apr', 30], ['May', 31], ['Jun', 30],
  ['Jul', 31], ['Aug', 31], ['Sep', 30], ['Oct', 31], ['Nov', 30], ['Dec', 31],
];

// Exact chance that at least two of n people share a birthday (365 equally likely days).
export function sharedChance(n) {
  let allDifferent = 1;
  for (let k = 0; k < n; k += 1) allDifferent *= (DAYS - k) / DAYS;
  return 1 - allDifferent;
}

export const smallestGroupFor = (chance) => {
  let n = 1;
  while (sharedChance(n) < chance) n += 1;
  return n;
};

export function dayLabel(day) {
  let d = day;
  for (const [name, length] of MONTHS) {
    if (d < length) return `${name} ${d + 1}`;
    d -= length;
  }
  return '';
}

export function randomGroup(rng, n) {
  return Array.from({ length: n }, () => Math.floor(rng() * DAYS));
}

export function simulateRooms({ people, trials, seed }) {
  const rng = seedrandom(seed ?? '');
  let hits = 0;
  const seen = new Uint8Array(DAYS);
  for (let t = 0; t < trials; t += 1) {
    seen.fill(0);
    for (let i = 0; i < people; i += 1) {
      const day = Math.floor(rng() * DAYS);
      if (seen[day]) {
        hits += 1;
        break;
      }
      seen[day] = 1;
    }
  }
  return { hits, sampleRoom: randomGroup(rng, people) };
}
