import { useEffect, useMemo, useRef, useState } from 'react';
import ToolPage from '../../shared/ToolPage';
import ToolActions from '../../shared/ToolActions';
import Faq from '../../shared/Faq';
import { Legend, LogRangeControl, RangeControl, SeedControl, StatRow } from '../../shared/controls';
import { useUrlState } from '../../shared/useUrlState';
import { SPREAD, codeSnippet, dropNeedles, generatePoints, repeatedEstimates } from '../../utils/monteCarloPi';
import { PALETTE } from '../../utils/chart';
import { downloadCSV } from '../../utils/export';
import { randomSeed } from '../../utils/seed';
import { drawConvergence, drawEstimates, drawNeedles, drawSquare } from './draw';

const DEFAULTS = { count: 10000, seed: 'pi', method: 'random', full: false, view: 'estimate', compare: false, mode: 'darts', needle: 0.8 };
const SQUARE = { width: 600, height: 600 };
const SPEEDS = [
  { label: 'Slow', seconds: 12 },
  { label: 'Normal', seconds: 2.5 },
  { label: 'Fast', seconds: 0.6 },
];
const fixed = (v, d = 5) => (Number.isFinite(v) ? v.toFixed(d) : '—');

const FAQ = [
  {
    q: 'How does the Monte Carlo method estimate π?',
    a: 'A quarter circle of radius 1 has area π/4 and fits inside a 1 × 1 square. Throw points uniformly at random into the square: the share that lands inside the circle approaches π/4, so 4 × (inside ÷ total) approaches π. Each point only needs one check, x² + y² ≤ 1.',
  },
  {
    q: 'Why is my Monte Carlo estimate of π so inaccurate?',
    a: 'Because the error only shrinks like 1/√n. With 10,000 points the typical error is about ±0.016, so getting 3.12 or 3.16 is completely normal and not a bug. Use the repeat panel to see the spread of many runs, and the code panel to check your own program against this exact run.',
  },
  {
    q: 'How many points do I need for more digits of π?',
    a: 'Each extra correct digit needs about 100 times more points. Roughly 10,000 points give π to within a few hundredths, a million points within a few thousandths, and 100 million points within a few ten-thousandths. The digits calculator above gives the exact number for a 95% chance.',
  },
  {
    q: 'What are quasi-random (Halton) points?',
    a: 'Low-discrepancy sequences like Halton spread points out evenly instead of randomly, avoiding clumps and gaps. For smooth problems like this one they converge much faster, close to 1/n instead of 1/√n. Switch the method to Halton, or turn on the comparison, to see the difference on the error chart.',
  },
  {
    q: "What is Buffon's needle?",
    a: "Drop needles of length L onto a floor of parallel lines one unit apart. The chance a needle crosses a line is 2L/π, so π ≈ 2L × drops ÷ crossings. It was posed by the Comte de Buffon in the 18th century and is one of the oldest Monte Carlo experiments. Switch to Buffon's needle mode to try it.",
  },
  {
    q: 'How do I code a Monte Carlo π estimate in Python?',
    a: 'Loop n times, draw x and y uniformly between 0 and 1, count how many satisfy x*x + y*y <= 1, and print 4 * inside / n. The code panel above gives a complete Python or JavaScript program that reproduces this page\'s exact run from its seed.',
  },
];

function CodePanel({ seed, count, full }) {
  const [language, setLanguage] = useState('python');
  const [copied, setCopied] = useState(false);
  const code = codeSnippet(language, seed, count, full);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable; the code is still selectable
    }
  };
  return (
    <section className="panel" aria-labelledby="code-heading">
      <h2 id="code-heading">Reproduce this run in code</h2>
      <p className="chart-caption">
        This program uses the same seeded generator as the page, so it prints exactly the same inside count and
        estimate. Use it to check your own code: if yours gives a different but similar number, that is just a
        different random sequence, not a bug.
      </p>
      <div className="mode-tabs" role="group" aria-label="Language">
        <button type="button" aria-pressed={language === 'python'} onClick={() => setLanguage('python')}>Python</button>
        <button type="button" aria-pressed={language === 'js'} onClick={() => setLanguage('js')}>JavaScript</button>
        <button type="button" onClick={copy}>{copied ? '✓ Copied' : 'Copy code'}</button>
      </div>
      <pre className="code-block"><code>{code}</code></pre>
    </section>
  );
}

function Classroom() {
  const [inside, setInside] = useState('');
  const [total, setTotal] = useState('');
  const n = Number(total);
  const k = Number(inside);
  const valid = n > 0 && k >= 0 && k <= n;
  const estimate = valid ? (4 * k) / n : NaN;
  const se = valid ? SPREAD / Math.sqrt(n) : NaN;
  return (
    <section className="panel" aria-labelledby="class-heading">
      <h2 id="class-heading">Throwing real darts? Enter your class&apos;s results</h2>
      <p className="chart-caption">
        Throw darts, rice or beans at a printed square with a quarter circle (or count raindrops on paper). Only count
        throws that land inside the square.
      </p>
      <div className="inline-fields">
        <label>Inside the circle<input type="number" min="0" value={inside} onChange={(e) => setInside(e.target.value)} /></label>
        <label>Total in the square<input type="number" min="1" value={total} onChange={(e) => setTotal(e.target.value)} /></label>
      </div>
      {valid && (
        <p className="result-line" aria-live="polite">
          Your estimate: <strong>{fixed(estimate, 4)}</strong>, off by {fixed(estimate - Math.PI, 4)}. With {n} throws the
          typical error is ±{fixed(se, 3)}, so a fair throw lands between {fixed(Math.PI - 2 * se, 2)} and{' '}
          {fixed(Math.PI + 2 * se, 2)} about 95% of the time.{' '}
          {Math.abs(estimate - Math.PI) <= 2 * se ? 'Your class is within that range. 🎯' : 'Your class is outside that range: were the throws really uniform over the square?'}
        </p>
      )}
    </section>
  );
}

function App() {
  const squareRef = useRef(null);
  const chartRef = useRef(null);
  const histRef = useRef(null);
  const needleRef = useRef(null);
  const boardWrapRef = useRef(null);
  const [settings, set, reset] = useUrlState(DEFAULTS);
  const { count, seed, method, full, view, compare, mode, needle } = settings;
  const [shown, setShown] = useState(0);
  const [goal, setGoal] = useState(count);
  const [speed, setSpeed] = useState(1);
  const [repeats, setRepeats] = useState(null);
  const [digits, setDigits] = useState(3);

  const points = useMemo(() => generatePoints(method, count, seed, full), [method, count, seed, full]);
  const other = useMemo(
    () => (compare ? generatePoints(method === 'random' ? 'halton' : 'random', count, seed, full) : null),
    [compare, method, count, seed, full],
  );

  // New settings: throw everything again
  useEffect(() => {
    setGoal(count);
    setShown(0);
  }, [points, count]);

  // Animate the dartboard toward the goal, drawing only new points each frame
  useEffect(() => {
    if (mode !== 'darts' || !squareRef.current) return undefined;
    let frame;
    let drawn = shown;
    if (drawn === 0) drawSquare(squareRef.current, points, 0, 0, full);
    const from = drawn;
    const start = performance.now();
    const duration = SPEEDS[speed].seconds * 1000 * Math.min(1, (goal - from) / Math.max(count, 1)) + 1;
    const step = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const target = Math.max(drawn, Math.min(goal, Math.ceil(from + (goal - from) * progress)));
      if (target > drawn) {
        drawSquare(squareRef.current, points, drawn, target, full);
        drawn = target;
        setShown(drawn);
      }
      if (drawn < goal) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
    // shown is the starting point only; including it would restart every frame
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal, points, mode, full, speed]);

  const n = Math.max(shown, 1);
  const inside = points.insideSoFar[n];
  const estimate = shown ? (4 * inside) / n : NaN;
  const se = SPREAD / Math.sqrt(n);

  const drawChart = (canvas) => drawConvergence(canvas, {
    series: [
      { insideSoFar: points.insideSoFar, color: PALETTE.cyan },
      ...(other ? [{ insideSoFar: other.insideSoFar, color: PALETTE.violet }] : []),
    ],
    shown: Math.max(shown, 1), total: count, view,
  });

  useEffect(() => {
    if (mode !== 'darts') return;
    if (chartRef.current && shown > 0) drawChart(chartRef.current);
    if (histRef.current && repeats) drawEstimates(histRef.current, { estimates: repeats.estimates, n: repeats.n, current: shown >= repeats.n ? (4 * points.insideSoFar[repeats.n]) / repeats.n : NaN });
  });

  const needleRun = useMemo(() => (mode === 'needles' ? dropNeedles(Math.min(count, 20000), needle, seed) : null), [mode, count, needle, seed]);
  useEffect(() => {
    if (needleRun && needleRef.current) drawNeedles(needleRef.current, needleRun);
  }, [needleRun]);
  const needleEstimate = needleRun && needleRun.hits ? (2 * needle * needleRun.needles.length) / needleRun.hits : NaN;

  const runRepeats = (runs) => {
    const repN = Math.min(count, 10000);
    setRepeats({ n: repN, estimates: repeatedEstimates(runs, repN, seed) });
  };
  const within = repeats ? repeats.estimates.filter((e) => Math.abs(e - Math.PI) <= (2 * SPREAD) / Math.sqrt(repeats.n)).length / repeats.estimates.length : 0;

  // Points needed for a 95% chance of being within half a unit in the last decimal place
  const neededForDigits = Math.ceil(((1.96 * SPREAD) / (0.5 * 10 ** -digits)) ** 2);

  const throwMore = (k) => setGoal((g) => Math.min(count, Math.max(g === count && shown >= count ? count : g, shown) + k));

  const squareDraw = (canvas) => drawSquare(canvas, points, 0, Math.max(shown, 1), full);
  const exportCsv = () => {
    const rows = [];
    for (let i = 0; i < shown; i += 1) {
      rows.push([i + 1, points.xs[i].toFixed(6), points.ys[i].toFixed(6), points.xs[i] ** 2 + points.ys[i] ** 2 <= 1 ? 1 : 0, ((4 * points.insideSoFar[i + 1]) / (i + 1)).toFixed(6)]);
    }
    downloadCSV(`monte-carlo-pi-${shown}.csv`, ['point', 'x', 'y', 'inside', 'running_estimate'], rows);
  };

  return (
    <ToolPage
      slug="monte-carlo-pi"
      title="Monte Carlo π Estimator"
      intro="Throw random points at a square with a circle inside it, and estimate π from the share that lands inside. See how wrong you should expect to be, compare quasi-random points, try Buffon's needle, and get code that reproduces your exact run."
    >

      <section className="controls-panel" aria-label="Simulation settings">
        <div className="mode-tabs" role="group" aria-label="Experiment">
          <button type="button" aria-pressed={mode === 'darts'} onClick={() => set('mode', 'darts')}>Random darts</button>
          <button type="button" aria-pressed={mode === 'needles'} onClick={() => set('mode', 'needles')}>Buffon&apos;s needle</button>
        </div>
        <div className="control-grid">
          <LogRangeControl id="points-range" label={mode === 'darts' ? 'Points to throw' : 'Needles to drop'} value={count}
            minExp={2} maxExp={mode === 'darts' ? 5.3 : 4.3} onChange={(v) => set('count', v)} />
          {mode === 'darts' ? (
            <div className="control-row">
              <label htmlFor="method-select">Points</label>
              <select id="method-select" value={method} onChange={(e) => set('method', e.target.value)}>
                <option value="random">Random (seeded)</option>
                <option value="halton">Quasi-random (Halton sequence)</option>
              </select>
            </div>
          ) : (
            <RangeControl id="needle-range" label="Needle length (line spacing = 1)" value={needle} min={0.1} max={1}
              step={0.05} onChange={(v) => set('needle', v)} />
          )}
          <SeedControl value={seed} onChange={(v) => set('seed', v)} />
          {mode === 'darts' && (
            <div className="control-row">
              <label htmlFor="speed-select">Animation speed</label>
              <select id="speed-select" value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                {SPEEDS.map((s, i) => <option key={s.label} value={i}>{s.label}</option>)}
              </select>
            </div>
          )}
        </div>
        {mode === 'darts' && (
          <>
            <label className="check-row" htmlFor="full-check">
              <input id="full-check" type="checkbox" checked={full} onChange={(e) => set('full', e.target.checked)} />
              Use a full circle in a 2 × 2 square instead of a quarter circle
            </label>
            <label className="check-row" htmlFor="compare-check">
              <input id="compare-check" type="checkbox" checked={compare} onChange={(e) => set('compare', e.target.checked)} />
              Compare with {method === 'random' ? 'quasi-random Halton' : 'random'} points on the chart
            </label>
          </>
        )}
        <ToolActions
          image={mode === 'darts' ? { draw: squareDraw, size: SQUARE, filename: 'monte-carlo-pi.png' } : { draw: (c) => needleRun && drawNeedles(c, needleRun), size: { width: 800, height: 480 }, filename: 'buffons-needle.png' }}
          onCsv={mode === 'darts' ? exportCsv : undefined}
          csvLabel="Download points (CSV)"
          onReset={reset}
          fullscreenRef={boardWrapRef}
        >
          <button type="button" onClick={() => set('seed', randomSeed())}>🎲 New throw</button>
        </ToolActions>
      </section>

      {mode === 'darts' ? (
        <>
          <section className="panel" aria-label="Throw controls">
            <div className="button-row">
              <button type="button" onClick={() => { setShown(0); setGoal(0); }}>Clear</button>
              <button type="button" onClick={() => throwMore(1)}>+1 point</button>
              <button type="button" onClick={() => throwMore(10)}>+10</button>
              <button type="button" onClick={() => throwMore(100)}>+100</button>
              <button type="button" onClick={() => throwMore(1000)}>+1,000</button>
              <button type="button" className="primary" onClick={() => { setShown(0); setGoal(count); }}>Throw all {count.toLocaleString()}</button>
              <button type="button" onClick={() => { drawSquare(squareRef.current, points, 0, count, full); setShown(count); setGoal(count); }} disabled={shown >= count}>
                Skip animation
              </button>
            </div>
          </section>

          <div className="canvas-wrapper chart-wrapper square-chart" ref={boardWrapRef}>
            <canvas ref={squareRef} width={SQUARE.width} height={SQUARE.height} role="img"
              aria-label={`${shown.toLocaleString()} points; ${inside.toLocaleString()} inside the circle, estimating pi as ${fixed(estimate, 4)}.`} />
            <Legend items={[{ color: PALETTE.cyan, label: 'Inside the circle' }, { color: PALETTE.pink, label: 'Outside' }]} />
          </div>

          <section className="stats-panel" aria-live="polite">
            <h2>Estimate</h2>
            <div className="stats-grid">
              <StatRow label="Points thrown:" value={shown.toLocaleString()} />
              <StatRow label="Inside the circle:" value={shown ? inside.toLocaleString() : '—'} />
              <StatRow label="Estimate of π (4 × inside ÷ total):" value={fixed(estimate)} />
              <StatRow label="Error:" value={shown ? `${estimate - Math.PI >= 0 ? '+' : ''}${fixed(estimate - Math.PI)}` : '—'} />
              <StatRow label="Typical error (1 standard error):" value={`± ${fixed(se)}`} />
              <StatRow label="95% interval:" value={shown ? `${fixed(estimate - 1.96 * se, 4)} to ${fixed(estimate + 1.96 * se, 4)} ${Math.abs(estimate - Math.PI) <= 1.96 * se ? '(contains π ✓)' : '(misses π)'}` : '—'} />
            </div>
            {method === 'halton' && (
              <p className="chart-caption">Halton points are not random, so the standard error and interval describe random points, not this run.</p>
            )}
          </section>

          <div className="canvas-wrapper chart-wrapper">
            <div className="preset-row" role="group" aria-label="Chart view">
              <button type="button" aria-pressed={view === 'estimate'} onClick={() => set('view', 'estimate')}>Estimate</button>
              <button type="button" aria-pressed={view === 'error'} onClick={() => set('view', 'error')}>Error (log–log)</button>
            </div>
            <canvas ref={chartRef} width={800} height={360} role="img"
              aria-label={`The estimate of pi as points are added; currently ${fixed(estimate, 4)}.`} />
            <Legend
              items={[
                { color: PALETTE.cyan, label: method === 'random' ? 'Random points' : 'Halton points' },
                ...(compare ? [{ color: PALETTE.violet, label: method === 'random' ? 'Halton points' : 'Random points' }] : []),
                { color: PALETTE.yellow, label: view === 'error' ? 'Typical random error, 1.64/√n' : 'π and the 95% band' },
              ]}
            />
            <p className="chart-caption">
              {view === 'error'
                ? 'On log–log axes the random error falls along a line of slope −½: ten times fewer errors needs a hundred times more points. Halton points fall much faster.'
                : 'The shaded band shrinks like 1/√n: the estimate should stay inside it about 95% of the time.'}
            </p>
          </div>

          <section className="panel" aria-labelledby="repeat-heading">
            <h2 id="repeat-heading">Is my estimate normal? Repeat the experiment</h2>
            <div className="button-row">
              <button type="button" onClick={() => runRepeats(100)}>Run 100 times</button>
              <button type="button" onClick={() => runRepeats(1000)}>Run 1,000 times</button>
            </div>
            {repeats && (
              <>
                <canvas ref={histRef} width={800} height={300} className="panel-canvas" role="img"
                  aria-label={`Histogram of ${repeats.estimates.length} estimates of pi from ${repeats.n} points each.`} />
                <Legend items={[{ color: PALETTE.cyan, label: 'Runs' }, { color: PALETTE.yellow, label: 'Predicted spread and π' }, { color: PALETTE.pink, label: 'This run' }]} />
                <p className="result-line">
                  <strong>{(within * 100).toFixed(1)}%</strong> of runs landed within ±{fixed((2 * SPREAD) / Math.sqrt(repeats.n), 4)} of π
                  (theory: about 95%). Runs use {repeats.n.toLocaleString()} points each.
                </p>
              </>
            )}
          </section>

          <section className="panel" aria-labelledby="digits-heading">
            <h2 id="digits-heading">How many points for more digits?</h2>
            <RangeControl id="digits-range" label="Correct decimal places" value={digits} min={1} max={8} onChange={setDigits} />
            <p className="result-line">
              For a 95% chance of π correct to {digits} decimal place{digits > 1 ? 's' : ''} (3.{'1415926535'.slice(0, digits)}…) you
              need about <strong>{neededForDigits.toLocaleString()}</strong> random points.
            </p>
          </section>

          {method === 'random' && <CodePanel seed={seed} count={count} full={full} />}
          <Classroom />
        </>
      ) : (
        <>
          <div className="canvas-wrapper chart-wrapper" ref={boardWrapRef}>
            <canvas ref={needleRef} width={800} height={480} role="img"
              aria-label={`${needleRun?.needles.length} needles; ${needleRun?.hits} cross a line, estimating pi as ${fixed(needleEstimate, 4)}.`} />
            <Legend items={[{ color: PALETTE.cyan, label: 'Crosses a line' }, { color: PALETTE.pink, label: 'Misses' }]} />
          </div>
          <section className="stats-panel">
            <h2>Buffon&apos;s needle estimate</h2>
            <div className="stats-grid">
              <StatRow label="Needles dropped:" value={needleRun.needles.length.toLocaleString()} />
              <StatRow label="Crossing a line:" value={needleRun.hits.toLocaleString()} />
              <StatRow label="Estimate (2L × drops ÷ crossings):" value={fixed(needleEstimate)} />
              <StatRow label="Error:" value={fixed(needleEstimate - Math.PI)} />
            </div>
            <p className="chart-caption">
              The needle directions are drawn without using π (from random points in a disk), so the experiment does not
              assume its own answer.
            </p>
          </section>
        </>
      )}

      <section className="canvas-description prose" aria-labelledby="explain-heading">
        <h2 id="explain-heading">How random points can find π</h2>
        <p>
          A quarter circle of radius 1 fits inside a 1 × 1 square. The square has area 1 and the quarter circle has
          area π/4. If you throw points uniformly at random into the square, the fraction that lands inside the
          circle approaches π/4, so four times that fraction approaches π. Each point checks one thing: is x² + y² ≤ 1?
        </p>

        <h2>How wrong should you expect to be?</h2>
        <p>
          The error shrinks like 1/√n, so each extra correct digit costs about 100 times more points. Ten thousand
          points usually land within a few hundredths of π, and a million points within a few thousandths. If your own
          program gives 3.135 after 10,000 points, that is normal: run the repeat panel to see how widely honest runs
          spread, and the code panel to compare with this exact run.
        </p>

        <h2>Random versus quasi-random points</h2>
        <p>
          Random points clump and leave gaps by chance. Quasi-random sequences such as Halton&apos;s place each new
          point in the biggest remaining gap, so they cover the square evenly. On the log–log error chart their error
          falls far faster than the 1/√n of random points. This is the idea behind quasi-Monte Carlo methods used in
          finance and computer graphics.
        </p>

        <h2>What Monte Carlo methods are used for</h2>
        <p>
          Nobody computes π this way in practice, but the same idea, answering a question by random sampling, is
          used to price financial options, model particle physics, render realistic lighting in films, and estimate
          risks too complicated to calculate exactly. The name comes from the Monte Carlo casino; the method was
          developed by Stanisław Ulam and John von Neumann at Los Alamos in the 1940s.
        </p>
      </section>

      <Faq items={FAQ} />
    </ToolPage>
  );
}

export default App;
