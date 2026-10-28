# Chance Lab

Interactive probability simulators by Five54 Precision: random walks, bell curves
and famous probability puzzles you can run in the browser. It started as the
Random Walk Simulator.

Chance Lab is a working name, set in `.env`. Where things stand:
[STATUS](docs/STATUS.md). Why it exists and its limits:
[PROJECT_INTAKE](docs/PROJECT_INTAKE.md).

```bash
npm install
npm run dev       # local site at http://localhost:5173
npm run build     # static site in dist/, including sitemap.xml and robots.txt
npm run lint
```

## Layout

| Path | What |
|---|---|
| `src/tools.js` | Every tool: name, category, live or coming soon. Drives the hub, related links, build pages and sitemap |
| `src/shared` | Site layout, related-tools links, base styles |
| `src/pages` | Hub, About, Privacy |
| `src/tools/<slug>` | One folder per tool |
| `src/utils` | Simulation engines shared between tools |
| `<slug>/index.html` | Each page's HTML with its own title, description and structured data |
| `docs` | Five54 intake and status |

## Adding a tool

1. Add it to `src/tools.js` with `status: 'soon'` (it appears on the hub).
2. Build it in `src/tools/<slug>/`, wrapped in `SiteLayout` with `RelatedTools`.
3. Copy `random-walk/index.html` to `<slug>/index.html` and write its title, description and structured data.
4. Set `status: 'live'`. The build picks up the page and adds it to the sitemap.

## Deploy

Cloudflare Pages: build command `npm run build`, output directory `dist`.
Set `VITE_SITE_URL` to the real domain before building so canonical URLs and the sitemap point at it.
