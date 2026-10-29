# Diffusion-Limited Aggregation: feature research (2026-10-28)

**How to be the best:** the only zero-install browser DLA that serves both audiences. For physics students it is a lab that measures fractal dimension properly, with a mass-radius fit and experiments on seed, bias and stickiness. For generative artists it is a studio that exports clean high-res or vector output in their own palette.

Competitors:
- Jason Webb: seed shapes, spawn locations, bias, SVG export, colors.
- Paul Bourke: line, ring and circle seeds; 3D; STL.
- NetLogo: wiggle and multiple seeds; dimension exercises.
- fogleman/dlaf: off-lattice growth; CSV with parent links.
- alife: color maps and tiling.
- The other web tools are thin or dead (Wolfram Player, Java).

Evidence:
- A Hacker News user asked about hex lattices.
- Another Hacker News user asked about unequal move probabilities.
- People render offline from exported data.
- A physics caveat: square-lattice clusters drift away from 1.71.

Must:
- Seed presets: point, multiple points, ring, bottom line.
- Drift.
- A mass-radius log-log plot with a slope fit.
- A palette picker, background color and transparent export.
- High-res export redrawn from cell data.
- Speed control and skip to end.

Should:
- SVG export of parent-child segments.
- Color modes: order, distance and branch depth.
- A show-walkers toggle.
- A share link.

Could:
- Off-lattice growth.
- CSV export with parent links.
- A hex lattice.
