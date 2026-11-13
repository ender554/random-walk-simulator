// Single source of truth for every tool in the suite.
// Used by the hub page, the related-tools links, and the build (page inputs + sitemap),
// so it must stay plain data with no JSX or browser-only imports.
//
// label: the short name used in the Simulators menu.
//
// updated: the day of the page's last significant change: its tool, text, links, title, description
// or structured data (Google's sitemap guide). Shown as "Last updated", and used as `dateModified` and
// the sitemap's lastmod, so change it whenever the page changes.
//
// status: 'live' tools get their own page and sitemap entry; 'soon' tools only
// appear on the hub so we don't publish thin placeholder pages.

export const categories = [
  {
    id: 'random-paths',
    name: 'Random walks & paths',
    blurb: 'Watch randomness wander, drift, and grow.',
  },
  {
    id: 'distributions',
    name: 'Distributions & averages',
    blurb: 'See why randomness piles up into bell curves.',
  },
  {
    id: 'puzzles',
    name: 'Probability puzzles & Monte Carlo',
    blurb: 'Famous counterintuitive results, tested by simulation.',
  },
];

export const tools = [
  {
    slug: 'random-walk',
    name: 'Random Walk Simulator',
    label: 'Random walk',
    short: 'Draw 2D random walks with seeds, compare distance to √n, and export PNGs.',
    category: 'random-paths',
    updated: '2026-11-13',
    status: 'live',
  },
  {
    slug: 'gamblers-ruin',
    name: "Gambler's Ruin Simulator",
    label: "Gambler's ruin",
    short: 'Bet repeatedly from a starting bankroll and see how often you go broke.',
    category: 'random-paths',
    updated: '2026-11-13',
    status: 'live',
  },
  {
    slug: 'stock-price-simulator',
    name: 'Stock Price Path Simulator',
    label: 'Stock price paths',
    short: 'Geometric Brownian motion with drift and volatility controls.',
    category: 'random-paths',
    updated: '2026-11-13',
    status: 'live',
  },
  {
    slug: 'diffusion-limited-aggregation',
    name: 'Diffusion-Limited Aggregation',
    label: 'Diffusion-limited aggregation',
    short: 'Random walkers stick together and grow coral-like fractals.',
    category: 'random-paths',
    updated: '2026-11-13',
    status: 'live',
  },
  {
    slug: 'central-limit-theorem',
    name: 'Central Limit Theorem Simulator',
    label: 'Central limit theorem',
    short: 'Average random samples and watch any distribution become a bell curve.',
    category: 'distributions',
    updated: '2026-11-13',
    status: 'live',
  },
  {
    slug: 'galton-board',
    name: 'Galton Board',
    label: 'Galton board',
    short: 'Balls bounce through pegs and stack into a normal distribution.',
    category: 'distributions',
    updated: '2026-11-13',
    status: 'live',
  },
  {
    slug: 'coin-flip-simulator',
    name: 'Coin Flip & Law of Large Numbers',
    label: 'Coin flip',
    short: 'Flip thousands of coins and watch the running average settle at 50%.',
    category: 'distributions',
    updated: '2026-11-13',
    status: 'live',
  },
  {
    slug: 'monty-hall',
    name: 'Monty Hall Problem Simulator',
    label: 'Monty Hall problem',
    short: 'Play the game or run thousands of trials to see why switching wins.',
    category: 'puzzles',
    updated: '2026-11-13',
    status: 'live',
  },
  {
    slug: 'birthday-paradox',
    name: 'Birthday Paradox Calculator',
    label: 'Birthday paradox',
    short: 'How many people until two share a birthday? Fewer than you think.',
    category: 'puzzles',
    updated: '2026-11-13',
    status: 'live',
  },
  {
    slug: 'monte-carlo-pi',
    name: 'Monte Carlo π Estimator',
    label: 'Monte Carlo π',
    short: 'Throw random points at a circle and estimate π from where they land.',
    category: 'puzzles',
    updated: '2026-11-13',
    status: 'live',
  },
];

export const liveTools = tools.filter((t) => t.status === 'live');

export const toolPath = (slug) => `/${slug}/`;

// Three learning paths, in hub order. Each tool's first "next" pick is its next step; a path's last
// step jumps to the start of the next path (docs/redesign-2026-11-10/A3-LOGIC.md).
export const paths = [
  { category: 'puzzles', steps: ['monty-hall', 'birthday-paradox', 'monte-carlo-pi'] },
  { category: 'distributions', steps: ['coin-flip-simulator', 'galton-board', 'central-limit-theorem'] },
  { category: 'random-paths', steps: ['random-walk', 'gamblers-ruin', 'stock-price-simulator'], also: ['diffusion-limited-aggregation'] },
];

// Where a tool sits on its path: { path, step (1-based), of }, or null for tools that aren't a step.
export function pathStep(slug) {
  for (const path of paths) {
    const i = path.steps.indexOf(slug);
    if (i >= 0) return { path, step: i + 1, of: path.steps.length };
  }
  return null;
}

// Hand-picked next experiments: [slug, one-line reason]. The first is the main pick.
const NEXT = {
  'monty-hall': [
    ['birthday-paradox', 'Another answer most people get wrong: in a room of 23, the chance two share a birthday is 50.7%.'],
    ['coin-flip-simulator', 'A few games can point the wrong way. Watch a running average wander before it settles.'],
    ['monte-carlo-pi', 'Put randomness to work: estimate π from random points in a square.'],
  ],
  'birthday-paradox': [
    ['monte-carlo-pi', 'You checked an exact answer with random rooms. Now use random points to estimate π.'],
    ['coin-flip-simulator', 'Streaks feel rigged too. How long is the longest run of heads in 100 flips?'],
    ['monty-hall', 'Another answer most people get wrong: switching doors wins 2 times in 3.'],
  ],
  'monte-carlo-pi': [
    ['coin-flip-simulator', 'Why your π estimate steadies: the law of large numbers, one coin flip at a time.'],
    ['central-limit-theorem', 'Why the error shrinks like 1/√n: averages of random samples form a bell curve.'],
    ['random-walk', 'The same √n sets how far a random walk wanders from where it started.'],
  ],
  'coin-flip-simulator': [
    ['galton-board', 'Why do the counts pile into a bell? Each peg is a coin flip: left or right.'],
    ['central-limit-theorem', 'Not just coins: averages of almost any random draws form a bell curve.'],
    ['random-walk', 'Turn each flip into a step and the path becomes a random walk.'],
  ],
  'galton-board': [
    ['central-limit-theorem', "The bell isn't special to pegs: add up almost anything random and it appears."],
    ['coin-flip-simulator', 'Each peg is a fair coin flip. Watch the share of heads settle at 50%.'],
    ['random-walk', "Each ball's path is a random walk of left and right steps."],
  ],
  'central-limit-theorem': [
    ['random-walk', 'A random walk is a running sum of random steps. See how far it gets: about √n.'],
    ['galton-board', 'Watch the bell curve build itself, one ball at a time.'],
    ['monte-carlo-pi', "The CLT at work: a π estimate's error shrinks like 1/√n."],
  ],
  'random-walk': [
    ['gamblers-ruin', 'Give the walk a floor at $0 and a goal. How often do you go broke?'],
    ['stock-price-simulator', 'Multiply instead of add: the random walk behind stock-price models.'],
    ['diffusion-limited-aggregation', 'Let random walkers stick when they touch, and they grow fractals.'],
  ],
  'gamblers-ruin': [
    ['stock-price-simulator', 'From fixed bets to percentage moves: simulate prices with drift and volatility.'],
    ['random-walk', 'Your bankroll is a random walk. See how far one wanders without a floor.'],
    ['coin-flip-simulator', 'Each fair bet is a coin flip. How long do losing streaks run?'],
  ],
  'stock-price-simulator': [
    ['monty-hall', 'A famous puzzle where intuition fails: why switching doors wins 2 times in 3.'],
    ['monte-carlo-pi', 'The Monte Carlo method behind these price paths can also estimate π.'],
    ['central-limit-theorem', 'Why many small random moves add up to a bell curve.'],
  ],
  'diffusion-limited-aggregation': [
    ['random-walk', 'Follow one random walker on its own. How far does it wander?'],
    ['galton-board', 'Another shape built by chance: balls stacking into a bell curve.'],
    ['monte-carlo-pi', 'Random points again, this time to estimate π.'],
  ],
};

// [{ tool, reason, step }] for a tool page; step is set when the pick is on the same path.
export function nextTools(slug) {
  const here = pathStep(slug);
  return (NEXT[slug] ?? []).map(([to, reason]) => {
    const there = pathStep(to);
    const samePath = here && there && here.path === there.path;
    return { tool: tools.find((t) => t.slug === to), reason, step: samePath ? there : null };
  });
}

// Same-category tools first (the people searching for one want the others),
// then the rest of the suite, live tools before upcoming ones.
// Tools in `skip` (the page's next picks) are left out, so the two lists don't repeat each other.
export function relatedTools(slug, limit = 4, skip = []) {
  const current = tools.find((t) => t.slug === slug);
  const others = tools.filter((t) => t.slug !== slug && !skip.includes(t.slug));
  const score = (t) =>
    (t.category === current?.category ? 0 : 2) + (t.status === 'live' ? 0 : 1);
  return [...others].sort((a, b) => score(a) - score(b)).slice(0, limit);
}
