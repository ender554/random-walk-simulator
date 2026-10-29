# Random Walk Simulator: feature research (2026-10-28)

**How to be the best:** the one random walk tool that turns a seeded walk into a live classroom experiment (many walkers, √n and MSD charts, return-to-origin stats, an endpoint heatmap) and into plotter-ready art (gradients, SVG, high-res export, share link).

Competitors:
- Coatless Professor: 1D, 2D and 3D walks; simple, biased, Lévy and Brownian types; many walks; distance chart; endpoint distribution; no export.
- NetLogo: 360-degree steps.
- Rosenthal: speed control and bias.
- Utah: CSV export (page now 404).
- Coding Train: Lévy and self-avoiding walks.
- RandomWalker R: color by step and visit heatmaps.
- Generative-art guidance favors palettes over a single neon line.

No direct user complaints were found. There is an unmet need for a random walk SVG/plotter generator, and the old diffusion applets are dead.

Must:
- Multiple walkers with palette colors.
- Animated playback with speed control.
- Distance vs. √n and MSD charts.
- Step rules: 4-direction, 8-direction, continuous, Gaussian and Lévy.
- A share link.
- Export as SVG, 1×/2×/4× PNG, transparent PNG and CSV.

Should:
- Drift.
- An endpoint/visit heatmap.
- Return-to-origin stats.
- Art styling (color by time, width, opacity, background, boundary mode).

Could:
- A self-avoiding walk.
- 1D and 3D walks.
