import { useEffect, useMemo, useRef, useState } from 'react';
import ToolPage from '../../shared/ToolPage';
import { Legend, RangeControl, SeedControl, StatRow } from '../../shared/controls';
import { STEPS_PER_YEAR, gbmTheory, simulatePaths } from '../../utils/stockPaths';
import { PALETTE, chartFrame, clipToPlot, evenTicks, logTicks } from '../../utils/chart';
import { quantile } from '../../utils/stats';
import { exportCanvasPNG } from '../../utils/canvas';
import { randomSeed } from '../../utils/seed';

const PRESETS = [
  { label: 'Steady (7% / 15%)', mu: 0.07, sigma: 0.15 },
  { label: 'Volatile (10% / 50%)', mu: 0.1, sigma: 0.5 },
  { label: 'Wild (20% / 80%)', mu: 0.2, sigma: 0.8 },
];

const pct = (v) => `${(v * 100).toFixed(1)}%`;
const money = (v) => `$${v.toLocaleString(undefined, { maximumFractionDigits: v < 100 ? 2 : 0 })}`;

function draw(canvas, paths, s0, theory, years) {
  if (!canvas) return;
  const steps = paths[0].length - 1;
  // Log price axis: equal percentage moves look equal, and the median grows as a straight line.
  // Scale to most paths so a few extreme ones don't flatten the rest.
  const peaks = paths.map((p) => Math.max(...p)).sort((a, b) => a - b);
  const lows = paths.map((p) => Math.min(...p)).sort((a, b) => a - b);
  const yMax = Math.max(s0 * 1.5, quantile(peaks, 0.95), theory.mean) * 1.2;
  const yMin = Math.min(s0 / 1.5, quantile(lows, 0.05)) / 1.2;
  const frame = chartFrame(canvas, {
    xMin: 0, xMax: steps, yMin, yMax, logY: true,
    xTicks: evenTicks(0, steps, Math.min(years, 5) + 1),
    yTicks: logTicks(yMin, yMax),
    formatX: (v) => `${Math.round(v / STEPS_PER_YEAR)}y`,
    formatY: (v) => money(v),
    xLabel: 'Years',
  });
  const { ctx, x, y } = frame;
  clipToPlot(frame);

  const stride = Math.max(1, Math.floor(steps / 800));
  ctx.globalAlpha = paths.length > 20 ? 0.35 : 0.8;
  ctx.lineWidth = 1;
  for (const prices of paths) {
    ctx.strokeStyle = prices[steps] >= s0 ? PALETTE.cyan : PALETTE.pink;
    ctx.beginPath();
    for (let i = 0; i <= steps; i += stride) ctx.lineTo(x(i), y(prices[i]));
    ctx.lineTo(x(steps), y(prices[steps]));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Theory curves: mean grows at mu, median at mu - sigma^2/2
  const curve = (rate, dashed) => {
    ctx.strokeStyle = PALETTE.yellow;
    ctx.lineWidth = 2.5;
    ctx.setLineDash(dashed ? [8, 6] : []);
    ctx.beginPath();
    for (let i = 0; i <= 100; i += 1) {
      const t = (i / 100) * years;
      ctx.lineTo(x(t * STEPS_PER_YEAR), y(s0 * Math.exp(rate * t)));
    }
    ctx.stroke();
    ctx.setLineDash([]);
  };
  curve(Math.log(theory.mean / s0) / years, true);
  curve(Math.log(theory.median / s0) / years, false);

  ctx.strokeStyle = PALETTE.muted;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(x(0), y(s0));
  ctx.lineTo(x(steps), y(s0));
  ctx.stroke();
  ctx.restore();
}

function App() {
  const canvasRef = useRef(null);
  const s0 = 100;
  const [mu, setMu] = useState(0.1);
  const [sigma, setSigma] = useState(0.5);
  const [years, setYears] = useState(10);
  const [count, setCount] = useState(100);
  const [seed, setSeed] = useState('market');

  const paths = useMemo(
    () => simulatePaths({ s0, mu, sigma, years, paths: count, seed }),
    [mu, sigma, years, count, seed],
  );
  const theory = gbmTheory(s0, mu, sigma, years);

  const finals = paths.map((p) => p[p.length - 1]).sort((a, b) => a - b);
  const below = finals.filter((v) => v < s0).length;
  const mean = finals.reduce((a, b) => a + b, 0) / finals.length;

  useEffect(() => {
    draw(canvasRef.current, paths, s0, theory, years);
  });

  return (
    <ToolPage
      slug="stock-price-simulator"
      title="Stock Price Path Simulator"
      intro="Simulate stock prices as geometric Brownian motion. Set an expected return and a volatility, run many possible futures, and see why the typical outcome is worse than the average one."
    >
      <section className="controls-panel" aria-label="Simulation settings">
        <div className="control-grid">
          <RangeControl id="mu-range" label="Expected annual return (μ)" display={pct(mu)} value={mu}
            min={-0.1} max={0.3} step={0.005} onChange={setMu} />
          <RangeControl id="sigma-range" label="Annual volatility (σ)" display={pct(sigma)} value={sigma}
            min={0.01} max={1} step={0.01} onChange={setSigma} />
          <RangeControl id="years-range" label="Years" value={years} min={1} max={30} onChange={setYears} />
          <RangeControl id="paths-range" label="Simulated paths" value={count} min={1} max={200} onChange={setCount} />
        </div>

        <div className="preset-row" role="group" aria-label="Example settings">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              aria-pressed={mu === preset.mu && sigma === preset.sigma}
              onClick={() => {
                setMu(preset.mu);
                setSigma(preset.sigma);
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <SeedControl value={seed} onChange={setSeed} />

        <div className="button-row">
          <button type="button" onClick={() => setSeed(randomSeed())}>🎲 New paths</button>
          <button type="button" onClick={() => exportCanvasPNG(canvasRef.current, 'stock-price-paths.png')}>
            Export PNG
          </button>
        </div>
      </section>

      <div className="canvas-wrapper chart-wrapper">
        <canvas
          ref={canvasRef}
          width={800}
          height={450}
          role="img"
          aria-label={`${count} simulated price paths over ${years} years starting at $100; ${below} end below the start.`}
        />
        <Legend
          items={[
            { color: PALETTE.cyan, label: 'Ends above $100' },
            { color: PALETTE.pink, label: 'Ends below $100' },
            { color: PALETTE.yellow, label: 'Median (solid) and mean (dashed) predicted' },
          ]}
        />
        <p className="chart-caption">Prices use a log scale, so a move from $50 to $100 looks the same size as $100 to $200.</p>
      </div>

      <section className="stats-panel">
        <h2>Results after {years} years</h2>
        <div className="stats-grid">
          <StatRow label="Paths ending below $100:" value={`${below} (${pct(below / count)})`} />
          <StatRow label="Theory, chance of a loss:" value={pct(theory.probBelowStart)} />
          <StatRow label="Median final price:" value={money(quantile(finals, 0.5))} />
          <StatRow label="Theory, median:" value={money(theory.median)} />
          <StatRow label="Average final price:" value={money(mean)} />
          <StatRow label="Theory, average:" value={money(theory.mean)} />
        </div>
      </section>

      <section className="canvas-description prose" aria-labelledby="explain-heading">
        <h2 id="explain-heading">How stock prices are modeled</h2>
        <p>
          The standard textbook model for a stock price is geometric Brownian motion. Every trading day the price
          is multiplied by a small random factor. The expected return μ sets the average growth rate, and the
          volatility σ sets how large the daily swings are. It is the model behind the Black-Scholes option pricing
          formula, and a random walk on the logarithm of the price.
        </p>

        <h2>Why the median is below the average</h2>
        <p>
          Losses and gains don&apos;t cancel: falling 50% and then rising 50% leaves you at 75% of where you started.
          Because of this, the typical (median) path grows at only μ − σ²/2 per year, while the average is pulled up
          by a few huge winners. With the volatile preset, 10% expected return but 50% volatility, the median path
          actually shrinks, and most paths end below where they started even though the average gains. This effect
          is often called volatility drag.
        </p>

        <h2>Try this</h2>
        <p>
          Keep the return fixed and slide volatility up: the dashed average line stays put while the solid median
          line sinks. Then lengthen the time horizon with the steady preset and watch the chance of a loss shrink.
        </p>

        <h2>A model, not a forecast</h2>
        <p>
          Real markets have crashes, fat tails and changing volatility that this model leaves out. The simulator is
          for learning how randomness compounds, not for predicting any investment or giving financial advice.
        </p>
      </section>
    </ToolPage>
  );
}

export default App;
