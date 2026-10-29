// Builds the 1200×630 social preview images (og:image) in public/og/, one per page.
// Run with `npm run og` after changing a tool's name or the site name; the PNGs are committed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import { liveTools } from '../src/tools.js';
import { mulberry32 } from '../src/utils/prng.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', 'og');
const env = Object.fromEntries(
  fs.readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/)
    .filter((line) => /^\w+=/.test(line))
    .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]),
);
const SITE_NAME = env.VITE_SITE_NAME ?? 'Chance Lab';

const W = 1200;
const H = 630;
const C = { bg: '#0b0f14', panel: '#111823', grid: '#1f2836', text: '#ffffff', sub: '#aab6d4', muted: '#8a96b3', cyan: '#1de5d0', pink: '#ff6b8b', yellow: '#ffd166', violet: '#a78bfa', blue: '#7dd3fc' };
const FONT = "'Segoe UI', 'Inter', 'Helvetica Neue', Arial, sans-serif";

// Art is drawn in a 480×480 box on the right of the card.
const ART = { x: 660, y: 75, size: 480 };

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const polyline = (pts, attrs) => `<polyline points="${pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}" fill="none" stroke-linejoin="round" stroke-linecap="round" ${attrs}/>`;

function normal(rand) {
  let u = 0;
  while (u === 0) u = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

// Fit a set of point lists into the art box, keeping the aspect ratio.
function fit(lists, pad = 20) {
  const all = lists.flat();
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const span = Math.max(Math.max(...xs) - minX, Math.max(...ys) - minY) || 1;
  const k = (ART.size - pad * 2) / span;
  const offX = (ART.size - (Math.max(...xs) - minX) * k) / 2;
  const offY = (ART.size - (Math.max(...ys) - minY) * k) / 2;
  return lists.map((pts) => pts.map(([x, y]) => [offX + (x - minX) * k, offY + (y - minY) * k]));
}

const art = {
  'random-walk'() {
    const rand = mulberry32('og-walk');
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const walks = [C.cyan, C.pink, C.yellow].map(() => {
      let x = 0;
      let y = 0;
      const pts = [[0, 0]];
      for (let i = 0; i < 900; i += 1) {
        const [dx, dy] = dirs[Math.floor(rand() * 4)];
        x += dx;
        y += dy;
        pts.push([x, y]);
      }
      return pts;
    });
    const fitted = fit(walks);
    const colors = [C.cyan, C.pink, C.yellow];
    return fitted.map((pts, i) => polyline(pts, `stroke="${colors[i]}" stroke-width="3" opacity="0.9"`)).join('')
      + `<circle cx="${fitted[0][0][0]}" cy="${fitted[0][0][1]}" r="9" fill="#ffffff"/>`;
  },

  'gamblers-ruin'() {
    const rand = mulberry32('og-ruin');
    const goal = 30;
    const start = 15;
    const steps = 320;
    const x = (t) => 20 + (t / steps) * 440;
    const y = (v) => 440 - (v / goal) * 400;
    let out = `<line x1="20" x2="460" y1="${y(goal)}" y2="${y(goal)}" stroke="${C.cyan}" stroke-dasharray="8 8" stroke-width="2"/>`
      + `<line x1="20" x2="460" y1="${y(0)}" y2="${y(0)}" stroke="${C.pink}" stroke-dasharray="8 8" stroke-width="2"/>`;
    for (let p = 0; p < 9; p += 1) {
      let v = start;
      const pts = [[x(0), y(v)]];
      for (let t = 1; t <= steps && v > 0 && v < goal; t += 1) {
        v += rand() < 0.49 ? 1 : -1;
        pts.push([x(t), y(v)]);
      }
      const color = v <= 0 ? C.pink : v >= goal ? C.cyan : C.muted;
      out += polyline(pts, `stroke="${color}" stroke-width="2.5" opacity="0.8"`);
      const [ex, ey] = pts[pts.length - 1];
      if (v <= 0 || v >= goal) out += `<circle cx="${ex}" cy="${ey}" r="5" fill="${color}"/>`;
    }
    return out;
  },

  'stock-price-simulator'() {
    const rand = mulberry32('og-stock');
    const steps = 252;
    const paths = [];
    for (let p = 0; p < 40; p += 1) {
      let s = 100;
      const pts = [[0, s]];
      for (let t = 1; t <= steps; t += 1) {
        s *= Math.exp((0.08 - 0.045) / steps + 0.3 * Math.sqrt(1 / steps) * normal(rand));
        pts.push([t, s]);
      }
      paths.push(pts);
    }
    const x = (t) => 20 + (t / steps) * 440;
    const logMin = Math.log(45);
    const logMax = Math.log(230);
    const y = (s) => 450 - ((Math.log(s) - logMin) / (logMax - logMin)) * 420;
    const median = paths[0].map((_, t) => {
      const col = paths.map((p) => p[t][1]).sort((a, b) => a - b);
      return [x(t), y(col[Math.floor(col.length / 2)])];
    });
    return paths.map((pts) => polyline(pts.map(([t, s]) => [x(t), y(s)]), `stroke="${C.cyan}" stroke-width="2" opacity="0.35"`)).join('')
      + polyline(median, `stroke="${C.yellow}" stroke-width="5"`);
  },

  'diffusion-limited-aggregation'() {
    const rand = mulberry32('og-dla');
    const N = 161;
    const mid = (N - 1) / 2;
    const grid = new Uint8Array(N * N);
    const order = [];
    grid[mid * N + mid] = 1;
    order.push([mid, mid]);
    let radius = 2;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    while (order.length < 2600 && radius < mid - 4) {
      const a = rand() * 2 * Math.PI;
      let x = Math.round(mid + (radius + 3) * Math.cos(a));
      let y = Math.round(mid + (radius + 3) * Math.sin(a));
      for (;;) {
        const [dx, dy] = dirs[Math.floor(rand() * 4)];
        x += dx;
        y += dy;
        if (Math.hypot(x - mid, y - mid) > radius + 12) break;
        if (dirs.some(([u, v]) => grid[(y + v) * N + (x + u)])) {
          grid[y * N + x] = 1;
          order.push([x, y]);
          radius = Math.max(radius, Math.hypot(x - mid, y - mid));
          break;
        }
      }
    }
    // Scale the cluster's bounding box to fill the art box
    const xs = order.map((p) => p[0]);
    const ys = order.map((p) => p[1]);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const span = Math.max(Math.max(...xs) - minX, Math.max(...ys) - minY) + 1;
    const k = (ART.size - 40) / span;
    const offX = 20 + (ART.size - 40 - (Math.max(...xs) - minX + 1) * k) / 2;
    const offY = 20 + (ART.size - 40 - (Math.max(...ys) - minY + 1) * k) / 2;
    const colors = [C.cyan, C.blue, C.violet, C.pink];
    return order.map(([gx, gy], i) => {
      const x = (gx - minX) * k + offX;
      const y = (gy - minY) * k + offY;
      const color = colors[Math.min(colors.length - 1, Math.floor((i / order.length) * colors.length))];
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(k + 0.4).toFixed(1)}" height="${(k + 0.4).toFixed(1)}" fill="${color}"/>`;
    }).join('');
  },

  'central-limit-theorem'() {
    const rand = mulberry32('og-clt');
    const bins = new Array(28).fill(0);
    for (let i = 0; i < 20000; i += 1) {
      let sum = 0;
      for (let j = 0; j < 12; j += 1) sum += -Math.log(1 - rand());
      const mean = sum / 12;
      const b = Math.floor(((mean - 0.2) / 1.6) * bins.length);
      if (b >= 0 && b < bins.length) bins[b] += 1;
    }
    const max = Math.max(...bins);
    const bw = 440 / bins.length;
    let out = bins.map((n, i) => `<rect x="${(20 + i * bw + 1.5).toFixed(1)}" y="${(450 - (n / max) * 380).toFixed(1)}" width="${(bw - 3).toFixed(1)}" height="${((n / max) * 380).toFixed(1)}" rx="3" fill="${C.cyan}" opacity="0.85"/>`).join('');
    // Normal curve with the same mean and spread (mean 1, sd 1/√12)
    const sd = 1 / Math.sqrt(12);
    const curve = [];
    for (let i = 0; i <= 120; i += 1) {
      const m = 0.2 + (i / 120) * 1.6;
      const d = Math.exp(-((m - 1) ** 2) / (2 * sd * sd));
      curve.push([20 + (i / 120) * 440, 450 - d * 380 * 1.02]);
    }
    out += polyline(curve, `stroke="${C.pink}" stroke-width="5"`);
    return out;
  },

  'galton-board'() {
    const rand = mulberry32('og-galton');
    const rows = 10;
    const bins = new Array(rows + 1).fill(0);
    for (let i = 0; i < 400; i += 1) {
      let b = 0;
      for (let r = 0; r < rows; r += 1) b += rand() < 0.5 ? 0 : 1;
      bins[b] += 1;
    }
    const gap = 40;
    let out = '';
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c <= r; c += 1) {
        out += `<circle cx="${240 + (c - r / 2) * gap}" cy="${25 + r * 22}" r="4.5" fill="${C.muted}"/>`;
      }
    }
    const ball = 8;
    bins.forEach((n, b) => {
      const cx = 240 + (b - rows / 2) * gap;
      const stack = Math.round(n / 8);
      for (let k = 0; k < stack; k += 1) {
        out += `<circle cx="${cx}" cy="${468 - ball - k * (ball * 2 - 1)}" r="${ball - 1}" fill="${k === stack - 1 ? C.yellow : C.cyan}"/>`;
      }
      out += `<line x1="${cx + gap / 2}" x2="${cx + gap / 2}" y1="250" y2="470" stroke="${C.grid}" stroke-width="2"/>`;
    });
    return out;
  },

  'coin-flip-simulator'() {
    const rand = mulberry32('og-coin');
    const n = 4000;
    const x = (t) => 20 + (Math.log10(t) / Math.log10(n)) * 440;
    const y = (p) => 240 - (p - 0.5) * 520;
    let out = `<line x1="20" x2="460" y1="${y(0.5)}" y2="${y(0.5)}" stroke="#ffffff" stroke-dasharray="8 8" stroke-width="2" opacity="0.6"/>`;
    [C.cyan, C.pink, C.yellow, C.violet].forEach((color) => {
      let heads = 0;
      const pts = [];
      for (let t = 1; t <= n; t += 1) {
        heads += rand() < 0.5 ? 1 : 0;
        if (t >= 4 && (t < 60 || t % 10 === 0)) pts.push([x(t), y(heads / t)]);
      }
      out += polyline(pts, `stroke="${color}" stroke-width="3.5" opacity="0.9"`);
    });
    return out;
  },

  'monty-hall'() {
    const door = (x, label, state) => {
      const fill = state === 'open' ? C.bg : C.panel;
      const stroke = state === 'pick' ? C.cyan : C.grid;
      let d = `<rect x="${x}" y="40" width="130" height="220" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="5"/>`;
      if (state === 'open') d += `<text x="${x + 65}" y="175" font-size="84" text-anchor="middle" fill="${C.pink}" font-family="${FONT}" font-weight="700">×</text>`;
      else d += `<text x="${x + 65}" y="170" font-size="64" text-anchor="middle" fill="${state === 'pick' ? C.cyan : C.sub}" font-family="${FONT}" font-weight="700">${label}</text>`;
      return d;
    };
    const bar = (yPos, label, share, color) => `<text x="20" y="${yPos - 12}" font-size="26" fill="${C.sub}" font-family="${FONT}">${label}</text>`
      + `<rect x="20" y="${yPos}" width="440" height="34" rx="8" fill="${C.panel}"/>`
      + `<rect x="20" y="${yPos}" width="${440 * share}" height="34" rx="8" fill="${color}"/>`
      + `<text x="${30 + 440 * share}" y="${yPos + 26}" font-size="26" font-weight="700" fill="#ffffff" font-family="${FONT}">${Math.round(share * 100)}%</text>`;
    return door(20, '1', 'pick') + door(175, '2', 'open') + door(330, '3', 'closed')
      + bar(350, 'Always switch', 2 / 3, C.cyan) + bar(445, 'Always stay', 1 / 3, C.pink);
  },

  'birthday-paradox'() {
    const x = (n) => 20 + (n / 70) * 440;
    const y = (p) => 450 - p * 400;
    const pts = [];
    let none = 1;
    for (let n = 0; n <= 70; n += 1) {
      if (n > 0) none *= (366 - n) / 365;
      pts.push([x(n), y(1 - none)]);
    }
    return `<line x1="20" x2="460" y1="${y(0.5)}" y2="${y(0.5)}" stroke="#ffffff" stroke-dasharray="8 8" stroke-width="2" opacity="0.5"/>`
      + `<line x1="${x(23)}" x2="${x(23)}" y1="${y(0)}" y2="${y(0.507)}" stroke="${C.yellow}" stroke-dasharray="8 8" stroke-width="2"/>`
      + polyline(pts, `stroke="${C.cyan}" stroke-width="6"`)
      + `<circle cx="${x(23)}" cy="${y(0.507)}" r="12" fill="${C.pink}"/>`
      + `<text x="${x(23) + 22}" y="${y(0.507) + 62}" font-size="64" font-weight="800" fill="#ffffff" font-family="${FONT}">23</text>`;
  },

  'monte-carlo-pi'() {
    const rand = mulberry32('og-pi');
    let out = `<rect x="20" y="20" width="440" height="440" fill="none" stroke="${C.grid}" stroke-width="3"/>`
      + `<path d="M20 460 L20 20 A440 440 0 0 1 460 460 Z" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.6"/>`;
    for (let i = 0; i < 1800; i += 1) {
      const u = rand();
      const v = rand();
      const inside = u * u + v * v <= 1;
      out += `<circle cx="${(20 + u * 440).toFixed(1)}" cy="${(460 - v * 440).toFixed(1)}" r="3.2" fill="${inside ? C.cyan : C.pink}" opacity="0.85"/>`;
    }
    return out;
  },
};

// The hub card: a small grid of the tools' artwork.
function hubArt() {
  const picks = ['random-walk', 'central-limit-theorem', 'monte-carlo-pi', 'diffusion-limited-aggregation'];
  return picks.map((slug, i) => {
    const s = 0.47;
    const tx = (i % 2) * 250;
    const ty = Math.floor(i / 2) * 250;
    return `<g transform="translate(${tx} ${ty})"><rect width="230" height="230" rx="16" fill="${C.panel}"/>`
      + `<g transform="translate(5 5) scale(${s})">${art[slug]()}</g></g>`;
  }).join('');
}

// Greedy word wrap by character count; good enough for short headings.
function wrap(text, maxChars) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    if (line && (line + ' ' + word).length > maxChars) {
      lines.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines;
}

function card({ title, subtitle, artSvg }) {
  const titleLines = wrap(title, 16);
  // Shrink long headings so the widest line stays clear of the artwork (bold glyphs ≈ 0.58em wide)
  const longest = Math.max(...titleLines.map((l) => l.length));
  const titleSize = Math.min(titleLines.length > 2 ? 60 : 70, Math.floor(540 / (longest * 0.58)));
  const titleTop = 205;
  const titleSvg = titleLines.map((l, i) => `<text x="70" y="${titleTop + i * titleSize * 1.12}" font-size="${titleSize}" font-weight="800" fill="${C.text}" font-family="${FONT}">${esc(l)}</text>`).join('');
  const subTop = titleTop + titleLines.length * titleSize * 1.12 + 22;
  const subSvg = wrap(subtitle, 34).slice(0, 3).map((l, i) => `<text x="70" y="${subTop + i * 40}" font-size="30" fill="${C.sub}" font-family="${FONT}">${esc(l)}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  <rect x="${ART.x - 20}" y="${ART.y - 20}" width="${ART.size + 40}" height="${ART.size + 40}" rx="24" fill="${C.panel}" opacity="0.6"/>
  <g transform="translate(70 62) scale(0.75)">
    <rect width="64" height="64" rx="14" fill="${C.panel}"/>
    <path d="M14 48 L24 33 L19 24 L37 29 L46 18" fill="none" stroke="${C.cyan}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="46" cy="18" r="8.5" fill="${C.pink}"/>
  </g>
  <text x="132" y="98" font-size="32" font-weight="700" fill="${C.text}" font-family="${FONT}">${esc(SITE_NAME)}</text>
  ${titleSvg}
  ${subSvg}
  <text x="70" y="575" font-size="26" fill="${C.cyan}" font-weight="600" font-family="${FONT}">Free · No sign-up · Runs in your browser</text>
  <g transform="translate(${ART.x} ${ART.y})">${artSvg}</g>
</svg>`;
}

function render(svg, file) {
  const png = new Resvg(svg, { font: { loadSystemFonts: true, defaultFontFamily: 'Segoe UI' } }).render().asPng();
  fs.writeFileSync(path.join(outDir, file), png);
  return png.length;
}

fs.mkdirSync(outDir, { recursive: true });
const pages = [
  { file: 'home.png', title: `${liveTools.length} probability simulators`, subtitle: 'Random walks, bell curves, Monty Hall, the birthday paradox and more.', artSvg: hubArt() },
  ...liveTools.map((t) => ({ file: `${t.slug}.png`, title: t.name, subtitle: t.short, artSvg: art[t.slug]() })),
];
for (const page of pages) {
  const bytes = render(card(page), page.file);
  console.log(`og/${page.file}  ${(bytes / 1024).toFixed(0)} kB`);
}
