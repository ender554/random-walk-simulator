// Color palettes shared by the art-friendly tools.

export const PALETTES = {
  neon: ['#1de5d0', '#ff6b8b', '#ffd166', '#a78bfa', '#7dd3fc', '#86efac', '#fdba74', '#f0abfc'],
  viridis: ['#440154', '#46327e', '#365c8d', '#277f8e', '#1fa187', '#4ac16d', '#a0da39', '#fde725'],
  sunset: ['#2d1e5f', '#6b2d7b', '#a8326e', '#d9485b', '#f2734a', '#f9a64a', '#fbd476'],
  ocean: ['#03045e', '#023e8a', '#0077b6', '#0096c7', '#00b4d8', '#48cae4', '#90e0ef', '#caf0f8'],
  mono: ['#edf3ff'],
  ink: ['#111827'],
};

export const BACKGROUNDS = {
  dark: '#0b0f14',
  paper: '#f7f3ea',
  white: '#ffffff',
  transparent: null,
};

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Interpolate along a palette, t in [0, 1]
export function paletteColor(palette, t) {
  if (palette.length === 1) return palette[0];
  const scaled = Math.min(0.9999, Math.max(0, t)) * (palette.length - 1);
  const i = Math.floor(scaled);
  const f = scaled - i;
  const a = hexToRgb(palette[i]);
  const b = hexToRgb(palette[i + 1]);
  return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * f)).join(',')})`;
}
