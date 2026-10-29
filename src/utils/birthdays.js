import seedrandom from 'seedrandom';

export const MONTHS = [
  ['Jan', 31], ['Feb', 28], ['Mar', 31], ['Apr', 30], ['May', 31], ['Jun', 30],
  ['Jul', 31], ['Aug', 31], ['Sep', 30], ['Oct', 31], ['Nov', 30], ['Dec', 31],
];

export const QUESTIONS = {
  anyTwo: { label: 'Any two people share a birthday', short: 'at least two people share a birthday' },
  mine: { label: 'Someone shares MY birthday', short: 'someone else shares your birthday' },
  three: { label: 'At least three people share one', short: 'at least three people share a birthday' },
  near: { label: 'Two birthdays within a few days', short: 'two birthdays fall within the window' },
};

export const SPACES = [
  { key: 'birthdays', label: 'Birthdays (365 days)', size: 365 },
  { key: 'leap', label: 'Leap year (366 days)', size: 366 },
  { key: 'months', label: 'Birth months (12)', size: 12 },
  { key: 'letters', label: 'First initials (26 letters)', size: 26 },
  { key: 'hash16', label: '16-bit hash (65,536 values)', size: 2 ** 16 },
  { key: 'hash32', label: '32-bit hash (≈4.3 billion values)', size: 2 ** 32 },
  { key: 'hash64', label: '64-bit hash (≈1.8 × 10¹⁹ values)', size: 2 ** 64 },
];

// log Γ(x), Lanczos approximation (accurate to ~15 digits)
const LANCZOS = [
  676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
  12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
];
export function logGamma(x) {
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  const z = x - 1;
  let a = 0.99999999999980993;
  const t = z + 7.5;
  LANCZOS.forEach((c, i) => {
    a += c / (z + i + 1);
  });
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(a);
}
const logFactorial = (k) => logGamma(k + 1);

/** Exact (or, for huge spaces, very accurate) probability for each question. */
export function probability(question, people, size, window = 1) {
  const n = people;
  if (n < 2) return 0;
  switch (question) {
    case 'mine':
      return 1 - Math.exp((n - 1) * Math.log1p(-1 / size));
    case 'three': {
      if (n > 2 * size) return 1;
      // Ways to place n people with at most two per day: j days get a pair, n - 2j get one person
      let total = -Infinity;
      const terms = [];
      for (let j = Math.max(0, n - size); j <= Math.floor(n / 2); j += 1) {
        const singles = n - 2 * j;
        terms.push(
          logFactorial(size) - logFactorial(j) - logFactorial(singles) - logFactorial(size - j - singles)
          + logFactorial(n) - j * Math.LN2 - n * Math.log(size),
        );
      }
      const max = Math.max(...terms);
      total = max + Math.log(terms.reduce((s, v) => s + Math.exp(v - max), 0));
      return 1 - Math.exp(total);
    }
    case 'near': {
      // No two within `window` days on a circular year: (N − nw − 1)! / ((N − n(w+1))! · N^(n−1))
      const free = size - n * (window + 1);
      if (free < 0) return 1;
      return 1 - Math.exp(logFactorial(size - n * window - 1) - logFactorial(free) - (n - 1) * Math.log(size));
    }
    default: {
      if (size > 1e7) return -Math.expm1((-n * (n - 1)) / (2 * size));
      if (n > size) return 1;
      let logAllDifferent = 0;
      for (let k = 1; k < n; k += 1) logAllDifferent += Math.log1p(-k / size);
      return 1 - Math.exp(logAllDifferent);
    }
  }
}

/** Smallest group size with at least the target chance. */
export function peopleNeeded(question, target, size, window = 1) {
  let lo = 1;
  let hi = 2;
  while (probability(question, hi, size, window) < target) {
    hi *= 2;
    if (hi > 1e13) return Infinity;
  }
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (probability(question, mid, size, window) >= target) hi = mid;
    else lo = mid;
  }
  return hi;
}

// One random room: does it satisfy the question?
function roomMatches(question, values, size, window, counts) {
  if (question === 'mine') return values.slice(1).some((v) => v === values[0]);
  if (question === 'near') {
    const sorted = [...values].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i += 1) if (sorted[i] - sorted[i - 1] <= window) return true;
    return sorted.length > 1 && sorted[0] + size - sorted[sorted.length - 1] <= window;
  }
  counts.fill(0);
  const needed = question === 'three' ? 3 : 2;
  for (const v of values) {
    counts[v] += 1;
    if (counts[v] >= needed) return true;
  }
  return false;
}

export const canSimulate = (size, people, trials) => size <= 1e6 && people * trials <= 4e6;

export function simulateRooms({ question, people, size, window, trials, seed }) {
  const rng = seedrandom(seed ?? '');
  const draw = () => Math.floor(rng() * size);
  const counts = size <= 1e6 ? new Uint16Array(size) : null;
  let hits = 0;
  if (canSimulate(size, people, trials)) {
    for (let t = 0; t < trials; t += 1) {
      const values = Array.from({ length: people }, draw);
      if (roomMatches(question, values, size, window, counts)) hits += 1;
    }
  }
  // A sample room to show, as long as the largest group we draw
  const sampleRoom = size <= 1e6 ? Array.from({ length: Math.min(people, 400) }, draw) : [];
  return { hits, sampleRoom };
}

export function dayLabel(day) {
  let d = day;
  for (const [name, length] of MONTHS) {
    if (d < length) return `${name} ${d + 1}`;
    d -= length;
  }
  return 'Feb 29';
}

const MONTH_NAMES = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const toDay = (month, day) => {
  if (month < 0 || month > 11 || day < 1) return null;
  if (month === 1 && day === 29) return 365; // Feb 29 gets its own slot
  if (day > MONTHS[month][1]) return null;
  return MONTHS.slice(0, month).reduce((s, [, len]) => s + len, 0) + day - 1;
};

/**
 * Parse a pasted list of birthdays: "Mar 14", "14 March", "3/14", "2010-03-14", one per line or
 * separated by commas/semicolons. Returns { days, bad } where days are 0–364 (365 = Feb 29).
 */
export function parseBirthdays(text) {
  const days = [];
  const bad = [];
  for (const raw of text.split(/[\n,;]+/)) {
    const token = raw.trim().toLowerCase();
    if (!token) continue;
    let day = null;
    let m = token.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) day = toDay(Number(m[2]) - 1, Number(m[3]));
    if (day === null && (m = token.match(/^(\d{1,2})[/.-](\d{1,2})(?:[/.-]\d{2,4})?$/))) day = toDay(Number(m[1]) - 1, Number(m[2]));
    if (day === null && (m = token.match(/^([a-z]{3})[a-z]*\.?\s+(\d{1,2})/))) day = toDay(MONTH_NAMES.indexOf(m[1]), Number(m[2]));
    if (day === null && (m = token.match(/^(\d{1,2})\s+([a-z]{3})/))) day = toDay(MONTH_NAMES.indexOf(m[2]), Number(m[1]));
    if (day === null) bad.push(raw.trim());
    else days.push(day);
  }
  return { days, bad };
}
