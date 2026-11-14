// Colours every canvas draws with. Present mode (?present=1, src/shared/present.js) swaps them for the light
// projector set before the first draw, so drawing code must read them at draw time, never copy them at import.
// Contrast on the background, WCAG formula: every series and line is 3:1 or more; text colours are 4.5:1 or more.

const DARK = {
  bg: '#0b0f14',
  cyan: '#1de5d0', // first series
  cyanHi: '#5ff3e2', // a highlighted first-series mark
  pink: '#ff6b8b', // second series
  yellow: '#ffd166', // theory curves and bands
  violet: '#a78bfa',
  muted: '#8a96b3',
  label: '#aab6d4', // tick labels
  text: '#edf3ff', // text drawn on a mark
  grid: '#1f2836', // gridlines (decoration)
  gridStrong: '#2c3850', // axes and frames (decoration)
  peg: '#56647f',
};

// Projector palette from docs/redesign-2026-11-10/DESIGN.md: switch #004f47 (9.5:1 on white) and stay #e0567a
// (3.6:1) differ in lightness, not hue alone. The rest are 5:1 or more on white.
const LIGHT = {
  bg: '#ffffff',
  cyan: '#004f47',
  cyanHi: '#0d9488',
  pink: '#e0567a',
  yellow: '#a15c00',
  violet: '#6d28d9',
  muted: '#5b6a8a',
  label: '#3d4a63',
  text: '#0b0f14',
  grid: '#d0d7e3',
  gridStrong: '#a9b4c8',
  peg: '#8a96b3',
};

export const PALETTE = { ...DARK };

// Distinct colours for several runs on one chart.
export const SERIES = ['#1de5d0', '#ff6b8b', '#ffd166', '#a78bfa', '#7dd3fc', '#86efac', '#fdba74', '#f0abfc'];
const LIGHT_SERIES = ['#004f47', '#e0567a', '#a15c00', '#6d28d9', '#0369a1', '#15803d', '#c2410c', '#a21caf'];

export function applyLightPalette() {
  Object.assign(PALETTE, LIGHT);
  SERIES.splice(0, SERIES.length, ...LIGHT_SERIES);
}

// '#1de5d0', 0.3 → 'rgba(29, 229, 208, 0.3)'
export function alpha(hex, a) {
  const [r, g, b] = hex.match(/\w\w/g).map((x) => parseInt(x, 16));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
