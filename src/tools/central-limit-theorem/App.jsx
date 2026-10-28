import { useEffect, useMemo, useRef, useState } from 'react';
import ToolPage from '../../shared/ToolPage';
import ToolActions from '../../shared/ToolActions';
import Faq from '../../shared/Faq';
import Predict from '../../shared/Predict';
import { Legend, RangeControl, SeedControl, StatRow } from '../../shared/controls';
import { useUrlState } from '../../shared/useUrlState';
import {
  DISTRIBUTION_KEYS, drawSamples, histogram, lognormalSkewness, makeDistribution, normalProbability, shareBetween, summarize,
} from '../../utils/clt';
import { downloadCSV } from '../../utils/export';
import { randomSeed } from '../../utils/seed';
import { COLORS, drawMeans, drawSource } from './drawCharts';

const DEFAULTS = { dist: 'exponential', skew: 0.75, n: 5, samples: 5000, seed: 'bellcurve', zoom: false };
const MEANS_SIZE = { width: 800, height: 340 };
const COMPARE_NS = [1, 5, 30];
const fmt = (v) => (Number.isFinite(v) ? v.toLocaleString(undefined, { maximumFractionDigits: 3 }) : 'undefined');
const pct = (v) => `${(v * 100).toFixed(1)}%`;

const FAQ = [
  {
    q: 'What does the central limit theorem say in simple terms?',
    a: 'If you take many samples and average each one, the averages form an approximately normal (bell-shaped) distribution centered on the true mean, even when the original data is not normal. The spread of those averages is σ/√n, and the bell shape gets better as the sample size n grows.',
  },
  {
    q: 'What is the difference between sample size and number of samples?',
    a: 'Sample size n is how many values go into each average. Number of samples is how many averages you collect. Increasing n makes the distribution of averages narrower and more bell-shaped; increasing the number of samples only makes the histogram smoother and closer to its true shape.',
  },
  {
    q: 'Why is the standard error σ/√n?',
    a: 'The variance of a sum of n independent values is n·σ², so the variance of their average is σ²/n. Taking the square root gives a standard deviation of σ/√n. Averaging 4 values halves the spread; averaging 100 values cuts it to a tenth.',
  },
  {
    q: 'Is n = 30 always enough for the central limit theorem?',
    a: 'No. Thirty is a rule of thumb that works for mildly skewed data. Strongly skewed data needs much larger samples before the averages look normal: try the lognormal source with high skewness and watch how slowly the bell shape appears. Heavy-tailed data like the Cauchy distribution never becomes normal at all.',
  },
  {
    q: 'What is the difference between the central limit theorem and the law of large numbers?',
    a: 'The law of large numbers says one average gets closer to the true mean as n grows. The central limit theorem describes how averages are scattered around the true mean: in a normal distribution with spread σ/√n. One is about where the average ends up, the other about the shape of its uncertainty.',
  },
  {
    q: 'When does the central limit theorem not apply?',
    a: 'It needs independent values from a distribution with a finite variance. The Cauchy distribution has no finite mean or variance, so averaging does not help: the average of 100 Cauchy values is just as spread out as a single one. Choose the Cauchy source to see it fail.',
  },
];

function App() {
  const sourceRef = useRef(null);
  const meansRef = useRef(null);
  const chartsRef = useRef(null);
  const compareRefs = useRef([]);
  const [settings, set, reset] = useUrlState(DEFAULTS);
  const { n, samples, seed, zoom } = settings;
  const [shown, setShown] = useState(null); // null = every sample; a number = stepping through
  const [probMode, setProbMode] = useState('above');
  const [aText, setAText] = useState('');
  const [bText, setBText] = useState('');

  const dist = useMemo(() => makeDistribution(settings.dist, settings.skew), [settings.dist, settings.skew]);
  const center = Number.isFinite(dist.mean) ? dist.mean : dist.center;
  const se = dist.sd / Math.sqrt(n);
  const { raw, means } = useMemo(() => drawSamples(dist, n, samples, seed), [dist, n, samples, seed]);
  const visible = shown === null ? means : means.subarray(0, shown);
  const observed = summarize(visible.length ? visible : means);

  const canZoom = Number.isFinite(se);
  const [lo, hi] = zoom && canZoom
    ? [Math.max(dist.range[0], dist.mean - 4.5 * se), Math.min(dist.range[1], dist.mean + 4.5 * se)]
    : dist.range;
  const hist = histogram(visible, dist, n, lo, hi);
  const outside = visible.length ? 1 - shareBetween(visible, lo - 1e-12, hi + 1e-12) : 0;

  const latest = shown ? shown - 1 : null;
  const sample = latest !== null
    ? { values: Array.from(raw.subarray(latest * n, latest * n + n)), mean: means[latest] }
    : null;

  // Probability panel: defaults sit one standard error above the mean
  const defaultA = Number.isFinite(se) ? +(center + se).toFixed(3) : 1;
  const defaultB = Number.isFinite(se) ? +(center + 2 * se).toFixed(3) : 2;
  const a = aText === '' ? defaultA : Number(aText);
  const b = bText === '' ? defaultB : Number(bText);
  const region = probMode === 'below' ? { lo: -Infinity, hi: a }
    : probMode === 'above' ? { lo: a, hi: Infinity }
    : { lo: Math.min(a, b), hi: Math.max(a, b) };
  const theoryProb = Number.isFinite(se) ? normalProbability(region.lo, region.hi, dist.mean, se) : NaN;
  const simProb = visible.length ? shareBetween(visible, region.lo, region.hi) : NaN;

  const meansDraw = (canvas) =>
    drawMeans(canvas, {
      hist, lo, hi, samples: visible.length, mean: dist.mean, se, shade: region,
      latest: sample ? sample.mean : undefined,
    });

  useEffect(() => {
    drawSource(sourceRef.current, dist, sample);
    meansDraw(meansRef.current);
  });

  const compareSamples = Math.min(samples, 3000);
  const compareNs = COMPARE_NS.includes(n) ? [...COMPARE_NS, 100] : [...COMPARE_NS, n];
  const compareData = useMemo(
    () => compareNs.map((size) => drawSamples(dist, size, compareSamples, `${seed}-n${size}`).means),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dist, compareSamples, seed, compareNs.join()],
  );

  useEffect(() => {
    compareNs.forEach((size, i) => {
      const canvas = compareRefs.current[i];
      const sizeSe = dist.sd / Math.sqrt(size);
      drawMeans(canvas, {
        hist: histogram(compareData[i], dist, size, dist.range[0], dist.range[1], 40),
        lo: dist.range[0], hi: dist.range[1], samples: compareSamples, mean: dist.mean, se: sizeSe,
      });
    });
  });

  const step = (count) => setShown((s) => Math.min(samples, (s ?? 0) + count));
  const exportCsv = () => {
    const withValues = n <= 30;
    const headers = ['sample', 'mean', ...(withValues ? Array.from({ length: n }, (_, i) => `value_${i + 1}`) : [])];
    const rows = Array.from(means, (m, s) => [
      s + 1, m, ...(withValues ? Array.from(raw.subarray(s * n, s * n + n)) : []),
    ]);
    downloadCSV(`clt-${settings.dist}-n${n}.csv`, headers, rows);
  };

  return (
    <ToolPage
      slug="central-limit-theorem"
      title="Central Limit Theorem Simulator"
      intro="Pick any distribution, average n random draws, and repeat thousands of times. Watch each sample being drawn, see the averages pile up into a bell curve, check probabilities against theory, and find out when the theorem breaks."
    >
      <Predict
        question="Average 30 draws from the skewed exponential distribution, thousands of times. What shape will the averages make, and how spread out will they be?"
        answer="Very nearly a bell curve, still slightly skewed to the right. Their spread is σ/√n = 1/√30 ≈ 0.18, much narrower than the original data (σ = 1). Set n to 30 to check."
        placeholder="e.g. bell-shaped, spread about 0.5"
      />

      <section className="controls-panel" aria-label="Simulation settings">
        <div className="control-grid">
          <div className="control-row">
            <label htmlFor="dist-select">Source distribution</label>
            <select id="dist-select" value={settings.dist} onChange={(e) => { set('dist', e.target.value); setShown(null); }}>
              {DISTRIBUTION_KEYS.map((key) => (
                <option key={key} value={key}>{makeDistribution(key, settings.skew).label}</option>
              ))}
            </select>
          </div>
          {settings.dist === 'lognormal' && (
            <RangeControl id="skew-range" label="Skewness of the source" display={lognormalSkewness(settings.skew).toFixed(1)}
              value={settings.skew} min={0.25} max={1.5} step={0.05} onChange={(v) => set('skew', v)} />
          )}
          <RangeControl id="n-range" label="Sample size n (values in each average)" value={n} min={1} max={100}
            onChange={(v) => { set('n', v); setShown(null); }} />
          <RangeControl id="samples-range" label="Number of samples (how many averages)" display={samples.toLocaleString()}
            value={samples} min={100} max={10000} step={100} onChange={(v) => { set('samples', v); setShown(null); }} />
          <SeedControl value={seed} onChange={(v) => set('seed', v)} />
        </div>

        <label className="check-row" htmlFor="zoom-check">
          <input id="zoom-check" type="checkbox" checked={zoom && canZoom} disabled={!canZoom}
            onChange={(e) => set('zoom', e.target.checked)} />
          Zoom in on the sample means
        </label>

        <ToolActions
          image={{ draw: meansDraw, size: MEANS_SIZE, filename: 'central-limit-theorem.png' }}
          onCsv={exportCsv}
          csvLabel="Download sample means (CSV)"
          onReset={() => { reset(); setShown(null); }}
          fullscreenRef={chartsRef}
        >
          <button type="button" onClick={() => { set('seed', randomSeed()); setShown(null); }}>🎲 New samples</button>
        </ToolActions>
      </section>

      <section className="panel" aria-labelledby="step-heading">
        <h2 id="step-heading">Step through one sample at a time</h2>
        <div className="button-row">
          <button type="button" onClick={() => setShown(0)}>Start from zero</button>
          <button type="button" onClick={() => step(1)}>+1 sample</button>
          <button type="button" onClick={() => step(10)}>+10</button>
          <button type="button" onClick={() => step(100)}>+100</button>
          <button type="button" onClick={() => setShown(null)} disabled={shown === null}>Show all</button>
        </div>
        <p className="result-line" aria-live="polite">
          {shown === null
            ? `Showing all ${samples.toLocaleString()} samples × ${n} values each.`
            : `${shown.toLocaleString()} of ${samples.toLocaleString()} samples drawn, ${n} values each.`}
        </p>
        {sample && (
          <p className="sample-strip">
            Sample #{latest + 1}: {sample.values.slice(0, 40).map((v) => +v.toFixed(2)).join(', ')}
            {sample.values.length > 40 ? ', …' : ''} → average <strong>{sample.mean.toFixed(3)}</strong>
          </p>
        )}
      </section>

      <div className="canvas-wrapper chart-wrapper" ref={chartsRef}>
        <h2 className="chart-title">
          {sample ? `The source distribution, with sample #${latest + 1}'s ${n} values` : `One draw from the source: ${dist.label.toLowerCase()}`}
        </h2>
        <canvas ref={sourceRef} width={800} height={200} role="img"
          aria-label={`Shape of the ${dist.label} distribution${sample ? `, with ${n} sampled values averaging ${sample.mean.toFixed(3)}` : ''}.`} />
        <h2 className="chart-title">
          Averages of {n} draws, {visible.length.toLocaleString()} times
        </h2>
        <canvas ref={meansRef} width={MEANS_SIZE.width} height={MEANS_SIZE.height} role="img"
          aria-label={`Histogram of ${visible.length} sample means of ${n} draws, centered at ${fmt(observed.mean)} with spread ${fmt(observed.sd)}.`} />
        <Legend
          items={[
            { color: COLORS.bars, label: 'Sample means' },
            ...(Number.isFinite(se) ? [{ color: COLORS.curve, label: 'Normal curve predicted by the CLT' }] : []),
            { color: '#a78bfa', label: 'Probability region' },
            ...(sample ? [{ color: COLORS.sample, label: 'Latest sample' }] : []),
          ]}
        />
        {outside > 0.001 && (
          <p className="chart-caption">{pct(outside)} of the averages fall outside this view.</p>
        )}
      </div>

      <section className="panel" aria-labelledby="prob-heading">
        <h2 id="prob-heading">Probability calculator</h2>
        <div className="inline-fields">
          <label>
            Chance that the average is
            <select value={probMode} onChange={(e) => setProbMode(e.target.value)}>
              <option value="below">below a</option>
              <option value="above">above a</option>
              <option value="between">between a and b</option>
            </select>
          </label>
          <label>
            a
            <input type="number" step="any" value={aText} placeholder={String(defaultA)} onChange={(e) => setAText(e.target.value)} />
          </label>
          {probMode === 'between' && (
            <label>
              b
              <input type="number" step="any" value={bText} placeholder={String(defaultB)} onChange={(e) => setBText(e.target.value)} />
            </label>
          )}
        </div>
        <p className="result-line" aria-live="polite">
          Normal approximation (μ = {fmt(dist.mean)}, σ/√n = {fmt(se)}):{' '}
          <strong>{Number.isFinite(theoryProb) ? pct(theoryProb) : 'not available, this distribution has no finite mean'}</strong>
          {Number.isFinite(theoryProb) && probMode !== 'between' && (
            <> (z = {((a - dist.mean) / se).toFixed(2)})</>
          )}
          . Your simulated averages: <strong>{Number.isFinite(simProb) ? pct(simProb) : '—'}</strong>.
        </p>
      </section>

      <section className="stats-panel">
        <h2>Results</h2>
        <div className="stats-grid">
          <StatRow label="Source mean (μ):" value={fmt(dist.mean)} />
          <StatRow label="Mean of sample means:" value={fmt(observed.mean)} />
          <StatRow label="Source spread (σ):" value={fmt(dist.sd)} />
          <StatRow label="Spread of means:" value={fmt(observed.sd)} />
          <StatRow label="Predicted σ/√n:" value={fmt(se)} />
          <StatRow label="Skewness of means (normal = 0):" value={observed.skewness.toFixed(2)} />
          <StatRow label="Excess kurtosis (normal = 0):" value={observed.excessKurtosis.toFixed(2)} />
        </div>
        {dist.noClt && (
          <p className="chart-caption">
            The Cauchy distribution has no mean or variance, so the CLT does not apply: averages of 100 values are
            exactly as spread out as single values. Change n and watch the histogram refuse to narrow.
          </p>
        )}
      </section>

      <div className="canvas-wrapper chart-wrapper">
        <h2 className="chart-title">Same source, different sample sizes</h2>
        <div className="small-multiples">
          {compareNs.map((size, i) => (
            <figure key={size}>
              <figcaption>n = {size}</figcaption>
              <canvas ref={(el) => { compareRefs.current[i] = el; }} width={380} height={190} role="img"
                aria-label={`Histogram of ${compareSamples} averages of ${size} draws.`} />
            </figure>
          ))}
        </div>
        <p className="chart-caption">
          Each panel uses {compareSamples.toLocaleString()} samples. Larger samples give narrower, more bell-shaped
          averages, but the center stays at the same place.
        </p>
      </div>

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
          flat bars become a smooth bell. Use the step buttons to watch individual samples: each red dot is one
          draw, and the yellow line is their average, which lands in the histogram below.
        </p>

        <h2>Sample size versus number of samples</h2>
        <p>
          These are easy to mix up. Sample size n is how many values go into each average; it controls how narrow
          and how normal the histogram is. Number of samples is how many averages you collect; it only makes the
          histogram smoother. The center of the histogram does not move toward μ as n grows: it is centered on μ
          for every n, it just gets narrower.
        </p>

        <h2>Why the spread shrinks with √n</h2>
        <p>
          Averaging lets high and low draws cancel out. The standard deviation of an average of n draws is σ/√n, so
          averaging 4 draws halves the spread and averaging 100 cuts it to a tenth. The results compare that
          prediction with the spread of your simulated means.
        </p>

        <h2>When n = 30 is not enough, and when the CLT fails</h2>
        <p>
          The common rule of thumb that n = 30 is enough works for mildly skewed data. Pick the lognormal source and
          push its skewness up: the averages stay lopsided well past 30, and the skewness readout shows it. The Cauchy
          distribution is the classic counterexample: it has no finite mean or variance, and averages never settle.
        </p>

        <h2>Why it matters</h2>
        <p>
          The central limit theorem is why the normal distribution shows up everywhere, from measurement errors to
          polling. It is the reason confidence intervals and many statistical tests work even when the underlying
          data is not normal. It also explains the bell shape on a Galton board, where each ball&apos;s position is
          the sum of many left-or-right bounces.
        </p>
      </section>

      <Faq items={FAQ} />
    </ToolPage>
  );
}

export default App;
