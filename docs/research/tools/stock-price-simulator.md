# Stock Price Path Simulator: feature research (2026-10-28)

**How to be the best:** the one free tool where you can see why the typical path (median) and the average path (mean) diverge. It would put live paths, fan bands, a terminal histogram with a lognormal overlay, and closed-form theory on one screen, with every number checked against its exact formula.

Competitors:
- Portfolio Visualizer and retirement Monte Carlo tools show percentile fans.
- MetricGate has percentile tables, P(S_T ≥ K), an editable S0 and a drift breakdown.
- Wharton, finmath and Wolfram price options by Monte Carlo.
- Some tools offer 1k–100k paths.
- No free browser tool combines paths, a lognormal histogram and a Black-Scholes check.

Evidence:
- Coders get confused when their simulated mean doesn't match theory.
- "Sample the tail" sensitivity (LessWrong).
- Retirement planners are told to watch the 10th–25th percentiles.
- Critics point out GBM's lack of fat tails.

Must:
- 5/25/50/75/95 fan bands.
- A final-price histogram with a lognormal overlay.
- Up to 5,000 paths, drawing about 200 of them.
- Target probability, both at the end and ever touched.
- An editable start price and a linear/log toggle.

Should:
- Real-world volatility presets.
- A CAGR / volatility drag readout.
- A share link and CSV.
- A sample-mean convergence chart.

Could:
- A fat-tail/jump toggle.
- A Black-Scholes call vs. Monte Carlo comparison.
- Contributions and withdrawals.
