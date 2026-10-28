# Monte Carlo π: feature research (2026-10-28)

**How to be the best:** explain how wrong you should expect to be. Show any run beside exact reproducible code and against the spread of many runs, plus quasi-random and Buffon alternatives, so students can tell bad luck from a bug and see why each extra digit costs about 100× more points.

Competitors:
- academo: one point at a time; full circle.
- GeoGebra: 100/1000 steps and question sets.
- Buffon's needle simulators exist.
- An Observable notebook compares quasi-random and random points.
- A SAS blog post shows a histogram of 1,000 estimates.
- Coding Train shows code.
- None of these offer CSV export, a share link or a log-log error plot.

Evidence:
- Hacker News users doubted the estimate converged ("never converged to the correct value"), asked how stable it is, and asked for quasi-random points.
- Students can't tell randomness apart from bugs in their own code.

Must:
- Repeat ×100 and ×1000 runs, with a histogram of estimates.
- A show-code panel (Python/JS) that reproduces the run.
- Step controls (+1, +10, +100, +1000) and a speed setting.
- A log-log error plot.

Should:
- A Halton quasi-random comparison.
- Buffon's needle mode.
- A share link.
- A classroom panel for physical dart counts.

Could:
- A full-circle toggle.
- CSV export.
- Estimating other areas.
- A confidence interval and a digits calculator.
