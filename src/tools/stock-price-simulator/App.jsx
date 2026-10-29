import { useEffect, useMemo, useRef, useState } from 'react';
import ToolPage from '../../shared/ToolPage';
import ToolActions from '../../shared/ToolActions';
import Faq from '../../shared/Faq';
import Predict from '../../shared/Predict';
import { Legend, RangeControl, SeedControl, StatRow } from '../../shared/controls';
import { useUrlState } from '../../shared/useUrlState';
import {
  STEPS_PER_YEAR, callOption, gbmTheory, percentileBands, simulatePaths, targetProbabilities,
} from '../../utils/stockPaths';
import { PALETTE } from '../../utils/chart';
import { quantile } from '../../utils/stats';
import { downloadCSV } from '../../utils/export';
import { randomSeed } from '../../utils/seed';
import { drawFinals, drawMeanConvergence, drawPaths, money } from './draw';

const DEFAULTS = { s0: 100, mu: 0.1, sigma: 0.5, years: 10, paths: 1000, seed: 'market', show: 'both', log: true, fat: false, target: 200 };
const CHART_SIZE = { width: 800, height: 450 };
// Rough long-run figures, for orientation only
const PRESETS = [
  { label: 'Bonds-like (4% / 6%)', mu: 0.04, sigma: 0.06 },
  { label: 'Stock index (8% / 17%)', mu: 0.08, sigma: 0.17 },
  { label: 'Single stock (10% / 30%)', mu: 0.1, sigma: 0.3 },
  { label: 'Volatile stock (10% / 50%)', mu: 0.1, sigma: 0.5 },
  { label: 'Crypto-like (20% / 75%)', mu: 0.2, sigma: 0.75 },
];
const pct = (v, d = 1) => `${(v * 100).toFixed(d)}%`;

const FAQ = [
  {
    q: 'What is geometric Brownian motion?',
    a: 'It is the standard textbook model for a stock price. Each instant the price is multiplied by a small random factor, so the logarithm of the price follows a random walk with drift. It has two inputs: the expected return μ and the volatility σ. Prices can never go below zero, and future prices follow a lognormal distribution.',
  },
  {
    q: 'Why is the median price lower than the average?',
    a: 'Gains and losses do not cancel: a 50% drop followed by a 50% rise leaves you at 75%. The typical (median) path grows at μ − σ²/2 per year, while the average is pulled up by a few huge winners. The gap, σ²/2, is called volatility drag. With 10% expected return and 50% volatility the median path actually shrinks.',
  },
  {
    q: 'How do you run a Monte Carlo stock price simulation?',
    a: 'Pick a start price, an expected return and a volatility. For each simulated path, step through time multiplying the price by exp((μ − σ²/2)·dt + σ·√dt·Z), where Z is a standard normal random number. Repeat for thousands of paths and look at the spread of outcomes. This page does exactly that with daily steps, and the CSV export lets you check your own code.',
  },
  {
    q: 'What is the difference between Brownian motion and geometric Brownian motion?',
    a: 'Plain Brownian motion adds random steps, so it can go negative and its spread grows the same in dollars at any price. Geometric Brownian motion multiplies by random factors, so it stays positive and moves in percentages: a $10 stock and a $1,000 stock have the same percentage volatility.',
  },
  {
    q: 'Is geometric Brownian motion realistic?',
    a: 'It is a useful first model but leaves out important features of real markets: crashes and jumps, fat tails (extreme days happen far more often than a normal curve predicts), and volatility that changes over time. Turn on fat-tailed shocks to see how much the extremes change with the same volatility.',
  },
  {
    q: 'Is this investment advice?',
    a: 'No. This is an educational model of how randomness compounds. It does not predict any real investment, and the presets are rough illustrations, not forecasts.',
  },
];

function OptionPanel({ s0, sigma, years, seed }) {
  const [strike, setStrike] = useState(s0);
  const [rate, setRate] = useState(0.03);
  const result = useMemo(() => callOption({ s0, strike, rate, sigma, years, seed }), [s0, strike, rate, sigma, years, seed]);
  return (
    <section className="panel" aria-labelledby="option-heading">
      <h2 id="option-heading">Option pricing: Black–Scholes vs. Monte Carlo</h2>
      <p className="chart-caption">
        The price of a European call option with this volatility and time horizon, from the Black–Scholes formula and
        from 20,000 simulated final prices using the risk-free rate as the drift.
      </p>
      <div className="inline-fields">
        <label>Strike price ($)<input type="number" min="1" step="any" value={strike} onChange={(e) => setStrike(Number(e.target.value) || 1)} /></label>
        <label>Risk-free rate (%)<input type="number" step="0.1" value={+(rate * 100).toFixed(2)} onChange={(e) => setRate(Number(e.target.value) / 100)} /></label>
      </div>
      <p className="result-line" aria-live="polite">
        Black–Scholes: <strong>{money(result.blackScholes)}</strong>. Monte Carlo: <strong>{money(result.monteCarlo)}</strong> ±{' '}
        {money(1.96 * result.se)} (95%).
      </p>
    </section>
  );
}

function App() {
  const canvasRef = useRef(null);
  const finalsRef = useRef(null);
  const meanRef = useRef(null);
  const chartWrapRef = useRef(null);
  const [settings, set, reset] = useUrlState(DEFAULTS);
  const { s0, mu, sigma, years, paths, seed, show, log, fat, target } = settings;

  const sim = useMemo(
    () => simulatePaths({ s0, mu, sigma, years, paths, seed, fatTails: fat }),
    [s0, mu, sigma, years, paths, seed, fat],
  );
  const bands = useMemo(() => percentileBands(sim), [sim]);
  const theory = gbmTheory(s0, mu, sigma, years);
  const sorted = useMemo(() => Float64Array.from(sim.finals).sort(), [sim]);
  const below = sorted.findIndex((v) => v >= s0);
  const belowCount = below === -1 ? paths : below;
  const mean = sim.finals.reduce((a, b) => a + b, 0) / paths;
  const medianFinal = quantile(sorted, 0.5);
  const medianCagr = (medianFinal / s0) ** (1 / years) - 1;

  const targetValue = target > 0 ? target : s0 * 2;
  const tp = targetProbabilities(s0, targetValue, mu, sigma, years);
  const up = targetValue >= s0;
  const simEnd = sim.finals.filter((v) => (up ? v >= targetValue : v <= targetValue)).length / paths;
  const simTouch = (up ? sim.highs : sim.lows).filter((v) => (up ? v >= targetValue : v <= targetValue)).length / paths;
  const theoryEnd = up ? tp.endAbove : 1 - tp.endAbove;

  const draw = (canvas) => drawPaths(canvas, { sim, bands, s0, theory, years, show, logScale: log, target: targetValue });
  useEffect(() => {
    draw(canvasRef.current);
    drawFinals(finalsRef.current, { finals: sim.finals, s0, mu, sigma, years, theory });
    drawMeanConvergence(meanRef.current, { finals: sim.finals, theory });
  });

  const exportCsv = () => {
    const exported = Math.min(paths, 200);
    const monthly = Math.max(1, Math.round(21 / sim.stride));
    const headers = ['day', ...Array.from({ length: exported }, (_, p) => `path_${p + 1}`)];
    const rows = [];
    for (let i = 0; i < sim.kept; i += monthly) {
      rows.push([i * sim.stride, ...Array.from({ length: exported }, (_, p) => sim.samples[p * sim.kept + i].toFixed(4))]);
    }
    downloadCSV(`stock-paths-${exported}.csv`, headers, rows);
  };

  return (
    <ToolPage
      slug="stock-price-simulator"
      title="Stock Price Simulator (Monte Carlo, Geometric Brownian Motion)"
      intro="Simulate thousands of possible futures for a stock price. See percentile bands, the distribution of final prices, the odds of hitting a target, and why the typical outcome is worse than the average one. Every number is checked against its exact formula."
    >
      <Predict
        question="A stock is expected to return 10% a year, with 50% volatility. After 10 years, what share of possible paths end below where they started?"
        answer="About 56%. Even though the average path grows, the typical (median) path shrinks: it grows at μ − σ²/2 = 10% − 12.5% = −2.5% a year. This is volatility drag."
        placeholder="e.g. 20%"
      />

      <section className="controls-panel" aria-label="Simulation settings">
        <div className="control-grid">
          <div className="control-row">
            <label htmlFor="s0-input">Start price ($)</label>
            <input id="s0-input" type="number" min="1" step="any" className="number-input" value={s0}
              onChange={(e) => set('s0', Math.max(1, Number(e.target.value) || 100))} />
          </div>
          <RangeControl id="mu-range" label="Expected annual return (μ)" display={pct(mu)} value={mu}
            min={-0.1} max={0.3} step={0.005} onChange={(v) => set('mu', v)} />
          <RangeControl id="sigma-range" label="Annual volatility (σ)" display={pct(sigma, 0)} value={sigma}
            min={0.01} max={1} step={0.01} onChange={(v) => set('sigma', v)} />
          <RangeControl id="years-range" label="Years" value={years} min={1} max={30} onChange={(v) => set('years', v)} />
          <RangeControl id="paths-range" label="Simulated paths" display={paths.toLocaleString()} value={paths}
            min={10} max={5000} step={10} onChange={(v) => set('paths', v)} />
          <SeedControl value={seed} onChange={(v) => set('seed', v)} />
        </div>
        <div className="preset-row" role="group" aria-label="Example settings (rough long-run figures)">
          {PRESETS.map((preset) => (
            <button key={preset.label} type="button" aria-pressed={mu === preset.mu && sigma === preset.sigma}
              onClick={() => { set('mu', preset.mu); set('sigma', preset.sigma); }}>
              {preset.label}
            </button>
          ))}
        </div>
        <div className="preset-row" role="group" aria-label="Chart view">
          {[['both', 'Paths and bands'], ['paths', 'Paths only'], ['bands', 'Bands only']].map(([key, label]) => (
            <button key={key} type="button" aria-pressed={show === key} onClick={() => set('show', key)}>{label}</button>
          ))}
          <button type="button" aria-pressed={log} onClick={() => set('log', !log)}>{log ? 'Log scale' : 'Linear scale'}</button>
        </div>
        <label className="check-row" htmlFor="fat-check">
          <input id="fat-check" type="checkbox" checked={fat} onChange={(e) => set('fat', e.target.checked)} />
          Fat-tailed daily shocks (Student t, same volatility): extreme days happen more often, like real markets
        </label>
        <ToolActions
          image={{ draw, size: CHART_SIZE, filename: 'stock-price-paths.png' }}
          onCsv={exportCsv}
          csvLabel="Download paths, monthly (CSV)"
          onReset={reset}
          fullscreenRef={chartWrapRef}
        >
          <button type="button" onClick={() => set('seed', randomSeed())}>🎲 New paths</button>
        </ToolActions>
      </section>

      <div className="canvas-wrapper chart-wrapper" ref={chartWrapRef}>
        <canvas ref={canvasRef} width={CHART_SIZE.width} height={CHART_SIZE.height} role="img"
          aria-label={`${paths} simulated price paths over ${years} years starting at ${money(s0)}; ${belowCount} end below the start.`} />
        <Legend
          items={[
            ...(show !== 'bands' ? [{ color: PALETTE.cyan, label: `Ends above ${money(s0)}` }, { color: PALETTE.pink, label: `Ends below ${money(s0)}` }] : []),
            ...(show !== 'paths' ? [{ color: 'rgba(29, 229, 208, 0.5)', label: '25–75% and 5–95% of paths' }] : []),
            { color: PALETTE.yellow, label: 'Median (solid) and mean (dashed) predicted' },
            { color: PALETTE.violet, label: 'Target' },
          ]}
        />
        <p className="chart-caption">
          {log ? 'Log price scale: a move from $50 to $100 looks the same size as $100 to $200.' : 'Linear price scale: notice how far the winners stretch to the right.'}
          {paths > 200 && show !== 'bands' ? ` Showing 200 of ${paths.toLocaleString()} paths; the bands and statistics use all of them.` : ''}
        </p>
      </div>

      <section className="stats-panel">
        <h2>After {years} years</h2>
        <div className="stats-grid">
          <StatRow label={`Paths ending below ${money(s0)}:`} value={`${belowCount.toLocaleString()} (${pct(belowCount / paths)})`} />
          <StatRow label="Theory, chance of a loss:" value={pct(theory.probBelowStart)} />
          <StatRow label="Median final price:" value={money(medianFinal)} />
          <StatRow label="Theory, median:" value={money(theory.median)} />
          <StatRow label="Average final price:" value={money(mean)} />
          <StatRow label="Theory, average:" value={money(theory.mean)} />
          <StatRow label="Median annual growth (CAGR):" value={pct(medianCagr)} />
          <StatRow label="Volatility drag (σ²/2):" value={`${pct((sigma * sigma) / 2)} a year off μ = ${pct(mu)}`} />
          <StatRow label="5th–95th percentile:" value={`${money(quantile(sorted, 0.05))} to ${money(quantile(sorted, 0.95))}`} />
        </div>
      </section>

      <section className="panel" aria-labelledby="target-heading">
        <h2 id="target-heading">Chance of reaching a target price</h2>
        <div className="inline-fields">
          <label>Target price ($)<input type="number" min="1" step="any" value={target} onChange={(e) => set('target', Number(e.target.value) || 0)} /></label>
        </div>
        <p className="result-line" aria-live="polite">
          Ending {up ? 'at or above' : 'at or below'} {money(targetValue)} after {years} years: simulated <strong>{pct(simEnd)}</strong>,
          theory <strong>{pct(theoryEnd)}</strong>. Touching {money(targetValue)} at any point: simulated{' '}
          <strong>{pct(simTouch)}</strong>, theory <strong>{pct(tp.touch)}</strong>
          {fat ? ' (theory assumes normal shocks)' : ' (the simulation checks once a day, so it can miss brief touches)'}.
        </p>
      </section>

      <div className="canvas-wrapper chart-wrapper">
        <h2 className="chart-title">Where the {paths.toLocaleString()} paths ended</h2>
        <canvas ref={finalsRef} width={800} height={320} role="img"
          aria-label={`Histogram of final prices with the lognormal curve; median ${money(medianFinal)}, mean ${money(mean)}.`} />
        <Legend items={[{ color: PALETTE.pink, label: 'Below start' }, { color: PALETTE.cyan, label: 'Above start' }, { color: PALETTE.yellow, label: 'Lognormal prediction, median (solid), mean (dashed)' }]} />
        <p className="chart-caption">Most paths end left of the mean: the long right tail of a few big winners pulls the average up.</p>
      </div>

      <div className="canvas-wrapper chart-wrapper">
        <h2 className="chart-title">How many paths does it take to pin down the average?</h2>
        <canvas ref={meanRef} width={800} height={260} role="img"
          aria-label="Running average of final prices as more paths are included, compared with the theoretical mean." />
        <p className="chart-caption">
          The running average of final prices jumps every time a rare big winner appears. With high volatility it takes
          thousands of paths to settle near the theoretical mean (dashed), because the average depends on the tail.
        </p>
      </div>

      <OptionPanel s0={s0} sigma={sigma} years={years} seed={seed} />

      <section className="canvas-description prose" aria-labelledby="explain-heading">
        <h2 id="explain-heading">How stock prices are modeled</h2>
        <p>
          The standard textbook model for a stock price is geometric Brownian motion. Every trading day the price
          is multiplied by a small random factor. The expected return μ sets the average growth rate, and the
          volatility σ sets how large the daily swings are. It is the model behind the Black–Scholes option pricing
          formula, and a random walk on the logarithm of the price. This simulator steps through {STEPS_PER_YEAR} trading
          days a year.
        </p>

        <h2>Why the median is below the average</h2>
        <p>
          Losses and gains don&apos;t cancel: falling 50% and then rising 50% leaves you at 75% of where you started.
          Because of this, the typical (median) path grows at only μ − σ²/2 per year, while the average is pulled up
          by a few huge winners. With 10% expected return but 50% volatility, the median path actually shrinks, and
          most paths end below where they started even though the average gains. This effect is called volatility
          drag. The histogram of final prices shows it directly: most of the mass sits left of the mean.
        </p>

        <h2>Reading the bands</h2>
        <p>
          The darker band holds the middle half of all paths at each moment (25th to 75th percentile), and the lighter
          band holds 90% of them (5th to 95th). Bands are easier to read than hundreds of overlapping lines and show
          the downside risk that matters most for planning.
        </p>

        <h2>A model, not a forecast</h2>
        <p>
          Real markets have crashes, fat tails and changing volatility that this model leaves out; the fat-tail option
          shows one of these effects. The simulator is for learning how randomness compounds, not for predicting any
          investment or giving financial advice.
        </p>
      </section>

      <Faq items={FAQ} />
    </ToolPage>
  );
}

export default App;
