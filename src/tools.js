// Single source of truth for every tool in the suite.
// Used by the hub page, the related-tools links, and the build (page inputs + sitemap),
// so it must stay plain data with no JSX or browser-only imports.
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
    short: 'Draw 2D random walks with seeds, compare distance to √n, and export PNGs.',
    category: 'random-paths',
    status: 'live',
  },
  {
    slug: 'gamblers-ruin',
    name: "Gambler's Ruin Simulator",
    short: 'Bet repeatedly from a starting bankroll and see how often you go broke.',
    category: 'random-paths',
    status: 'live',
  },
  {
    slug: 'stock-price-simulator',
    name: 'Stock Price Path Simulator',
    short: 'Geometric Brownian motion with drift and volatility controls.',
    category: 'random-paths',
    status: 'soon',
  },
  {
    slug: 'diffusion-limited-aggregation',
    name: 'Diffusion-Limited Aggregation',
    short: 'Random walkers stick together and grow coral-like fractals.',
    category: 'random-paths',
    status: 'soon',
  },
  {
    slug: 'central-limit-theorem',
    name: 'Central Limit Theorem Simulator',
    short: 'Average random samples and watch any distribution become a bell curve.',
    category: 'distributions',
    status: 'live',
  },
  {
    slug: 'galton-board',
    name: 'Galton Board',
    short: 'Balls bounce through pegs and stack into a normal distribution.',
    category: 'distributions',
    status: 'soon',
  },
  {
    slug: 'coin-flip-simulator',
    name: 'Coin Flip & Law of Large Numbers',
    short: 'Flip thousands of coins and watch the running average settle at 50%.',
    category: 'distributions',
    status: 'soon',
  },
  {
    slug: 'monty-hall',
    name: 'Monty Hall Problem Simulator',
    short: 'Play the game or run thousands of trials to see why switching wins.',
    category: 'puzzles',
    status: 'soon',
  },
  {
    slug: 'birthday-paradox',
    name: 'Birthday Paradox Calculator',
    short: 'How many people until two share a birthday? Fewer than you think.',
    category: 'puzzles',
    status: 'soon',
  },
  {
    slug: 'monte-carlo-pi',
    name: 'Monte Carlo π Estimator',
    short: 'Throw random points at a circle and estimate π from where they land.',
    category: 'puzzles',
    status: 'soon',
  },
];

export const liveTools = tools.filter((t) => t.status === 'live');

export const toolPath = (slug) => `/${slug}/`;

// Same-category tools first (the people searching for one want the others),
// then the rest of the suite, live tools before upcoming ones.
export function relatedTools(slug, limit = 4) {
  const current = tools.find((t) => t.slug === slug);
  const others = tools.filter((t) => t.slug !== slug);
  const score = (t) =>
    (t.category === current?.category ? 0 : 2) + (t.status === 'live' ? 0 : 1);
  return [...others].sort((a, b) => score(a) - score(b)).slice(0, limit);
}
