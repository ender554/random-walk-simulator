import { useEffect, useMemo, useRef, useState } from 'react';
import SiteLayout from '../../shared/SiteLayout';
import RelatedTools from '../../shared/RelatedTools';
import FurtherReading from '../../shared/FurtherReading';
import { distributions, histogram, sampleMeans, summarize } from '../../utils/clt';
import { exportCanvasPNG } from '../../utils/canvas';
import { randomSeed } from '../../utils/seed';
import { COLORS, drawMeans, drawSource } from './drawCharts';
import '../../shared/tool.css';

const fmt = (v) => v.toLocaleString(undefined, { maximumFractionDigits: 3 });

function App() {
  const sourceRef = useRef(null);
  const meansRef = useRef(null);
  const [distKey, setDistKey] = useState('exponential');
  const [n, setN] = useState(5);
  const [samples, setSamples] = useState(5000);
  const [zoom, setZoom] = useState(false);
  const [seed, setSeed] = useState('bellcurve');

  const dist = distributions[distKey];
  const se = dist.sd / Math.sqrt(n);
  const means = useMemo(() => sampleMeans(dist, n, samples, seed), [dist, n, samples, seed]);
  const observed = summarize(means);

  const [lo, hi] = zoom
    ? [Math.max(dist.range[0], dist.mean - 4.5 * se), Math.min(dist.range[1], dist.mean + 4.5 * se)]
    : dist.range;
  const hist = histogram(means, dist, n, lo, hi);

  let within = 0;
  for (const m of means) if (Math.abs(m - dist.mean) <= 2 * se) within += 1;

  useEffect(() => {
    drawSource(sourceRef.current, dist);
  }, [dist]);

  useEffect(() => {
    drawMeans(meansRef.current, { hist, lo, hi, samples, mean: dist.mean, se });
  });

  return (
    <SiteLayout>
      <div className="tool-main">
        <header className="page-header">
          <h1>Central Limit Theorem Simulator</h1>
          <p>
            Pick any distribution, take the average of n random draws, and repeat thousands of times. However lopsided
            the source, the averages pile up into a bell curve.
          </p>
        </header>

        <section className="controls-panel" aria-label="Simulation settings">
          <div className="control-grid">
            <div className="control-row">
              <label htmlFor="dist-select">Source distribution</label>
              <select id="dist-select" value={distKey} onChange={(e) => setDistKey(e.target.value)}>
                {Object.entries(distributions).map(([key, d]) => (
                  <option key={key} value={key}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="control-row">
              <label htmlFor="n-range">
                Draws averaged per sample (n) <span>{n}</span>
              </label>
              <input
                id="n-range"
                type="range"
                min="1"
                max="100"
                value={n}
                onChange={(e) => setN(Number(e.target.value))}
              />
            </div>

            <div className="control-row">
              <label htmlFor="samples-range">
                Number of samples <span>{samples.toLocaleString()}</span>
              </label>
              <input
                id="samples-range"
                type="range"
                min="100"
                max="10000"
                step="100"
                value={samples}
                onChange={(e) => setSamples(Number(e.target.value))}
              />
            </div>

            <div className="control-row">
              <label htmlFor="seed-input">Seed</label>
              <input
                id="seed-input"
                type="text"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder="Enter seed"
              />
            </div>
          </div>

          <label className="check-row" htmlFor="zoom-check">
            <input id="zoom-check" type="checkbox" checked={zoom} onChange={(e) => setZoom(e.target.checked)} />
            Zoom in on the sample means
          </label>

          <div className="button-row">
            <button type="button" onClick={() => setSeed(randomSeed())}>
              🎲 New samples
            </button>
            <button type="button" onClick={() => exportCanvasPNG(meansRef.current, 'central-limit-theorem.png')}>
              Export PNG
            </button>
          </div>

        </section>

        <div className="canvas-wrapper chart-wrapper">
          <h2 className="chart-title">One draw from the source: {dist.label.toLowerCase()}</h2>
          <canvas
            ref={sourceRef}
            width={800}
            height={200}
            role="img"
            aria-label={`Shape of the ${dist.label} distribution, mean ${fmt(dist.mean)}.`}
          />
        </div>

        <div className="canvas-wrapper chart-wrapper">
          <h2 className="chart-title">
            Averages of {n} draws, {samples.toLocaleString()} times
          </h2>
          <canvas
            ref={meansRef}
            width={800}
            height={340}
            role="img"
            aria-label={`Histogram of ${samples} sample means of ${n} draws, centered at ${fmt(observed.mean)} with spread ${fmt(observed.sd)}.`}
          />
          <p className="chart-caption">
            <span className="legend-swatch" style={{ background: COLORS.bars, marginLeft: 0 }} />
            Sample means
            <span className="legend-swatch" style={{ background: COLORS.curve }} />
            Normal curve predicted by the CLT
          </p>
        </div>

        <section className="stats-panel">
          <h2>Results</h2>
          <div className="stats-grid">
            <div className="stat-row"><span>Source mean (μ):</span><span>{fmt(dist.mean)}</span></div>
            <div className="stat-row"><span>Mean of sample means:</span><span>{fmt(observed.mean)}</span></div>
            <div className="stat-row"><span>Source spread (σ):</span><span>{fmt(dist.sd)}</span></div>
            <div className="stat-row"><span>Spread of means:</span><span>{fmt(observed.sd)}</span></div>
            <div className="stat-row"><span>Predicted σ/√n:</span><span>{fmt(se)}</span></div>
            <div className="stat-row">
              <span>Within 2σ/√n of μ:</span>
              <span>{((within / samples) * 100).toFixed(1)}% (normal 95.4%)</span>
            </div>
          </div>
        </section>

        <section className="canvas-description prose" aria-labelledby="explain-heading">
          <h2 id="explain-heading">What does the central limit theorem say?</h2>
          <p>
            Take n independent draws from almost any distribution and average them. Repeat that many times. The
            central limit theorem says those averages follow an approximately normal (bell-shaped) distribution
            centered on the true mean μ, with a spread of σ/√n, and the approximation gets better as n grows. The
            source does not have to look anything like a bell curve.
          </p>

          <h2>See it happen</h2>
          <p>
            Start with n = 1: the averages are just single draws, so the bottom chart copies the top one. Move n to
            2, 5, then 30. The skewed exponential loses its long tail, the two humps merge into one, and the die&apos;s
            flat bars become a smooth bell. Turn on zoom to see the shape when the spread gets narrow.
          </p>

          <h2>Why the spread shrinks with √n</h2>
          <p>
            Averaging lets high and low draws cancel out. The standard deviation of an average of n draws is σ/√n, so
            averaging 4 draws halves the spread and averaging 100 cuts it to a tenth. The results compare that
            prediction with the spread of your simulated means.
          </p>

          <h2>Why it matters</h2>
          <p>
            The central limit theorem is why the normal distribution shows up everywhere, from measurement errors to
            polling. It is the reason confidence intervals and many statistical tests work even when the underlying
            data is not normal. It also explains the bell shape on a Galton board, where each ball&apos;s position is
            the sum of many left-or-right bounces.
          </p>
        </section>

        <FurtherReading slug="central-limit-theorem" />
        <RelatedTools slug="central-limit-theorem" />
      </div>
    </SiteLayout>
  );
}

export default App;
