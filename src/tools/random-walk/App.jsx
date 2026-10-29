import { useEffect, useMemo, useRef, useState } from 'react';
import ToolPage from '../../shared/ToolPage';
import ToolActions from '../../shared/ToolActions';
import Faq from '../../shared/Faq';
import { Legend, LogRangeControl, RangeControl, SeedControl, StatRow } from '../../shared/controls';
import { useUrlState } from '../../shared/useUrlState';
import { MAX_POINTS, RULES, bounds, displacementStats, generateWalks, returnStats } from '../../utils/randomWalks';
import { PALETTE } from '../../utils/chart';
import { downloadCSV, downloadText } from '../../utils/export';
import { randomSeed } from '../../utils/seed';
import { BACKGROUNDS, PALETTES, drawDisplacement, drawWalks, walksToSvg } from './draw';

const DEFAULTS = {
  rule: 'lattice4', walkers: 1, steps: 5000, alpha: 1.5, drift: 0, angle: 0, boundary: 'none', box: 60,
  seed: 'balanced', view: 'paths', color: 'walker', palette: 'neon', width: 1, opacity: 1, bg: 'dark',
};
const SIZE = { width: 800, height: 800 };
const SPEEDS = [
  { label: 'Slow', seconds: 20 },
  { label: 'Normal', seconds: 6 },
  { label: 'Fast', seconds: 1.5 },
];
const fmt = (v) => (Number.isFinite(v) ? v.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '—');

const FAQ = [
  {
    q: 'What is a random walk?',
    a: 'A path made of random steps. Here each walker starts at the center and, at every step, moves in a random direction. Random walks model diffusion, the motion of particles in a fluid (Brownian motion), animal foraging, and, in finance, stock prices.',
  },
  {
    q: 'How far does a random walk travel after n steps?',
    a: 'About √n steps from the start, not n, because steps in opposite directions cancel. Precisely, the mean squared distance is n × (step length)², so the root-mean-square distance is √n × step length and the average distance is about 0.89 × √n × step length in two dimensions. Turn on many walkers and watch the averages match the theory lines.',
  },
  {
    q: 'Does a random walk always return to where it started?',
    a: "In one and two dimensions, yes: a simple random walk on a grid returns to its starting point with probability 1, though it can take a very long time. In three dimensions it only returns about 34% of the time. This is Pólya's recurrence theorem. The return statistics above count how many of your walkers have come back so far.",
  },
  {
    q: 'What is the random walk theory of stock prices?',
    a: 'The idea that day-to-day price changes are random and unpredictable, so past prices cannot be used to predict future ones. The standard model, geometric Brownian motion, is a random walk on the logarithm of the price. Try the Stock Price Simulator to explore it.',
  },
  {
    q: 'What is a Lévy flight?',
    a: 'A random walk whose step lengths have a heavy tail: most steps are short but occasionally there is a huge jump. With tail exponent α of 2 or less the mean squared step is infinite, so it spreads much faster than √n. Lévy flights are used to model animal foraging and some search strategies.',
  },
  {
    q: 'What is a self-avoiding walk?',
    a: 'A walk that never visits the same point twice, used as a model of polymer chains. It spreads further than an ordinary walk, roughly like n^(3/4) instead of n^(1/2), but it can trap itself in a dead end: the simulation shows how many walkers got stuck.',
  },
];

function App() {
  const canvasRef = useRef(null);
  const distRef = useRef(null);
  const msdRef = useRef(null);
  const wrapRef = useRef(null);
  const drawnRef = useRef(0);
  const [settings, set, reset] = useUrlState(DEFAULTS);
  const { rule, walkers, alpha, boundary, box, seed, view, color, palette, width, opacity, bg } = settings;
  const maxSteps = Math.max(10, Math.min(100000, Math.floor(MAX_POINTS / walkers)));
  const steps = Math.min(settings.steps, maxSteps);
  const drift = rule === 'selfAvoiding' ? 0 : settings.drift;
  const driftX = drift * Math.cos((settings.angle * Math.PI) / 180);
  const driftY = drift * Math.sin((settings.angle * Math.PI) / 180);

  const walk = useMemo(
    () => generateWalks({ walkers, steps, rule, alpha, driftX, driftY, boundary, box, seed }),
    [walkers, steps, rule, alpha, driftX, driftY, boundary, box, seed],
  );
  const extent = useMemo(() => {
    const b = bounds(walk);
    return boundary === 'none' ? b : { minX: -box, maxX: box, minY: -box, maxY: box };
  }, [walk, boundary, box]);

  const [shown, setShown] = useState(steps);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  // New walk: show it whole
  useEffect(() => {
    setShown(steps);
    setPlaying(false);
  }, [walk, steps]);

  const drawOpts = { walk, view, colorMode: color, palette, lineWidth: width, opacity, background: bg, bounds: extent, jumpLimit: boundary === 'wrap' ? box : 0 };

  // Redraw from scratch when anything visual changes; playback then adds only new steps
  useEffect(() => {
    if (!canvasRef.current) return;
    drawWalks(canvasRef.current, { ...drawOpts, from: 0, to: Math.min(shown, steps) });
    drawnRef.current = Math.min(shown, steps);
    // shown is handled incrementally by the next effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walk, view, color, palette, width, opacity, bg, extent]);

  useEffect(() => {
    if (!canvasRef.current || shown === drawnRef.current || shown > steps) return;
    if (shown < drawnRef.current || view === 'heatmap') drawWalks(canvasRef.current, { ...drawOpts, from: 0, to: shown });
    else drawWalks(canvasRef.current, { ...drawOpts, from: drawnRef.current, to: shown });
    drawnRef.current = shown;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown]);

  useEffect(() => {
    if (!playing) return undefined;
    let frame;
    let last = performance.now();
    const perSecond = steps / SPEEDS[speed].seconds;
    let carry = 0;
    const tick = (now) => {
      carry += ((now - last) / 1000) * perSecond;
      last = now;
      const add = Math.floor(carry);
      carry -= add;
      if (add > 0) {
        setShown((s) => {
          const next = Math.min(steps, s + add);
          if (next >= steps) setPlaying(false);
          return next;
        });
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed, steps]);

  const at = Math.min(shown, steps);
  const checkpoints = useMemo(() => {
    const count = Math.min(200, steps);
    return [...new Set(Array.from({ length: count + 1 }, (_, i) => Math.round((steps * i) / count)))];
  }, [steps]);
  const stats = useMemo(() => displacementStats(walk, checkpoints), [walk, checkpoints]);
  const visibleStats = stats.filter((s) => s[0] <= at);
  const current = displacementStats(walk, [at])[0];

  const isLattice = RULES[rule].lattice;
  const hasTheory = rule !== 'levy' && rule !== 'selfAvoiding' && boundary === 'none';
  const drift2 = driftX * driftX + driftY * driftY;
  const msdTheory = hasTheory ? (t) => t + drift2 * t * t : null;
  // Average distance in 2D without drift: Rayleigh mean √(πn)/2
  const distTheory = hasTheory && drift === 0 ? (t) => Math.sqrt(Math.PI * t) / 2 : null;
  const returns = useMemo(
    () => (isLattice && drift === 0 && boundary === 'none' ? returnStats(walk, at) : null),
    [walk, at, isLattice, drift, boundary],
  );
  const trapped = rule === 'selfAvoiding' ? Array.from(walk.trappedAt).filter((t) => t >= 0 && t <= at).length : 0;

  useEffect(() => {
    drawDisplacement(distRef.current, { stats: visibleStats, steps, measure: 'distance', theory: distTheory });
    drawDisplacement(msdRef.current, { stats: visibleStats, steps, measure: 'msd', theory: msdTheory });
  });

  const exportSvg = () => downloadText('random-walk.svg', walksToSvg({ ...drawOpts, colorMode: color === 'time' ? 'walker' : color }), 'image/svg+xml');
  const exportCsv = () => {
    const stride = (walk.steps + 1) * 2;
    const every = Math.max(1, Math.ceil((walkers * (steps + 1)) / 200000));
    const rows = [];
    for (let w = 0; w < walkers; w += 1) {
      for (let t = 0; t <= steps; t += every) rows.push([w + 1, t, walk.pos[w * stride + t * 2].toFixed(4), walk.pos[w * stride + t * 2 + 1].toFixed(4)]);
    }
    downloadCSV('random-walk.csv', ['walker', 'step', 'x', 'y'], rows);
  };

  return (
    <ToolPage
      slug="random-walk"
      title="Random Walk Simulator"
      intro="Release one walker or a thousand, watch them diffuse step by step, and check the √n law against live charts. Switch to Lévy flights, self-avoiding walks or drift, then style the paths as art and export PNG, SVG or data."
    >

      <section className="controls-panel" aria-label="Walk settings">
        <div className="control-grid">
          <div className="control-row">
            <label htmlFor="rule-select">Step rule</label>
            <select id="rule-select" value={rule} onChange={(e) => set('rule', e.target.value)}>
              {Object.entries(RULES).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
            </select>
          </div>
          {rule === 'levy' && (
            <RangeControl id="alpha-range" label="Tail exponent α (smaller = longer jumps)" value={alpha} min={1.1} max={2.5} step={0.1} onChange={(v) => set('alpha', v)} />
          )}
          <LogRangeControl id="walkers-range" label="Walkers" value={walkers} minExp={0} maxExp={3} onChange={(v) => set('walkers', Math.max(1, v))} />
          <LogRangeControl id="steps-range" label="Steps per walker" value={steps} minExp={1} maxExp={Math.log10(maxSteps)} onChange={(v) => set('steps', v)} />
          {rule !== 'selfAvoiding' && (
            <>
              <RangeControl id="drift-range" label="Drift (bias per step)" display={settings.drift === 0 ? 'none' : settings.drift.toFixed(2)} value={settings.drift} min={0} max={0.3} step={0.01} onChange={(v) => set('drift', v)} />
              {settings.drift > 0 && (
                <RangeControl id="angle-range" label="Drift direction" display={`${settings.angle}°`} value={settings.angle} min={0} max={345} step={15} onChange={(v) => set('angle', v)} />
              )}
            </>
          )}
          <div className="control-row">
            <label htmlFor="boundary-select">Edges</label>
            <select id="boundary-select" value={boundary} onChange={(e) => set('boundary', e.target.value)}>
              <option value="none">No walls (zoom to fit)</option>
              <option value="reflect">Walls that reflect</option>
              <option value="wrap">Wrap around (torus)</option>
            </select>
          </div>
          {boundary !== 'none' && (
            <RangeControl id="box-range" label="Box half-width (steps)" value={box} min={5} max={500} step={5} onChange={(v) => set('box', v)} />
          )}
          <SeedControl value={seed} onChange={(v) => set('seed', v)} />
        </div>
        {steps < settings.steps && (
          <p className="chart-caption">Limited to {steps.toLocaleString()} steps with {walkers.toLocaleString()} walkers to keep the page fast.</p>
        )}

        <details className="style-panel">
          <summary>🎨 Style and art options</summary>
          <div className="control-grid">
            <div className="control-row">
              <label htmlFor="color-select">Color</label>
              <select id="color-select" value={color} onChange={(e) => set('color', e.target.value)}>
                <option value="walker">One color per walker</option>
                <option value="time">Gradient along each path (by time)</option>
                <option value="single">Single color</option>
              </select>
            </div>
            <div className="control-row">
              <label htmlFor="palette-select">Palette</label>
              <select id="palette-select" value={palette} onChange={(e) => set('palette', e.target.value)}>
                {Object.keys(PALETTES).map((key) => <option key={key} value={key}>{key[0].toUpperCase() + key.slice(1)}</option>)}
              </select>
            </div>
            <div className="control-row">
              <label htmlFor="bg-select">Background</label>
              <select id="bg-select" value={bg} onChange={(e) => set('bg', e.target.value)}>
                {Object.keys(BACKGROUNDS).map((key) => <option key={key} value={key}>{key[0].toUpperCase() + key.slice(1)}</option>)}
              </select>
            </div>
            <RangeControl id="width-range" label="Line width" value={width} min={0.25} max={6} step={0.25} onChange={(v) => set('width', v)} />
            <RangeControl id="opacity-range" label="Opacity" display={`${Math.round(opacity * 100)}%`} value={opacity} min={0.05} max={1} step={0.05} onChange={(v) => set('opacity', v)} />
          </div>
        </details>

        <ToolActions
          image={{ draw: (c) => drawWalks(c, { ...drawOpts, from: 0, to: at }), size: SIZE, filename: 'random-walk.png' }}
          onCsv={exportCsv}
          csvLabel="Download positions (CSV)"
          onReset={reset}
          fullscreenRef={wrapRef}
        >
          <button type="button" onClick={() => set('seed', randomSeed())}>🎲 New walk</button>
          <button type="button" onClick={exportSvg}>Save SVG</button>
        </ToolActions>
      </section>

      <section className="panel" aria-label="Playback">
        <div className="button-row">
          <button type="button" className="primary" onClick={() => { if (at >= steps) setShown(0); setPlaying((p) => !p); }}>
            {playing ? '⏸ Pause' : at >= steps ? '▶ Replay' : '▶ Play'}
          </button>
          <button type="button" onClick={() => { setShown(0); setPlaying(true); }} disabled={at === 0 && playing}>⏮ Restart</button>
          <button type="button" onClick={() => { setPlaying(false); setShown(0); }} disabled={at === 0}>Back to start</button>
          <button type="button" onClick={() => { setPlaying(false); setShown((s) => Math.min(steps, s + 1)); }}>+1 step</button>
          <button type="button" onClick={() => { setPlaying(false); setShown((s) => Math.min(steps, s + Math.max(10, Math.round(steps / 100)))); }}>+1%</button>
          <button type="button" onClick={() => { setPlaying(false); setShown(steps); }} disabled={at >= steps}>Show all</button>
          <label className="visually-hidden" htmlFor="speed-select">Speed</label>
          <select id="speed-select" className="inline-select" value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
            {SPEEDS.map((s, i) => <option key={s.label} value={i}>{s.label}</option>)}
          </select>
        </div>
        <div className="preset-row" role="group" aria-label="View">
          <button type="button" aria-pressed={view === 'paths'} onClick={() => set('view', 'paths')}>Paths</button>
          <button type="button" aria-pressed={view === 'heatmap'} onClick={() => set('view', 'heatmap')}>Heatmap of visits</button>
        </div>
        <p className="result-line" aria-live="off">Step {at.toLocaleString()} of {steps.toLocaleString()}</p>
      </section>

      <div className="canvas-wrapper" ref={wrapRef}>
        <canvas ref={canvasRef} width={SIZE.width} height={SIZE.height} role="img"
          aria-label={`${walkers} random walk${walkers > 1 ? 's' : ''} of ${at} steps; average distance from start ${fmt(current[1])} steps.`} />
      </div>

      <section className="stats-panel" aria-live="off">
        <h2>After {at.toLocaleString()} steps{walkers > 1 ? `, averaged over ${walkers.toLocaleString()} walkers` : ''}</h2>
        <div className="stats-grid">
          <StatRow label="Average distance from start:" value={`${fmt(current[1])} steps`} />
          <StatRow label="Theory, √(πn)/2:" value={distTheory ? `${fmt(distTheory(at))} steps` : 'no simple formula here'} />
          <StatRow label="Mean squared displacement:" value={fmt(current[2])} />
          <StatRow label="Theory, n (+ drift² · n²):" value={msdTheory ? fmt(msdTheory(at)) : rule === 'levy' ? 'infinite for α ≤ 2' : '—'} />
          <StatRow label="Root-mean-square distance:" value={`${fmt(Math.sqrt(current[2]))} (√n = ${fmt(Math.sqrt(at))})`} />
          {returns && (
            <>
              <StatRow label="Walkers that came back to the start:" value={`${returns.returned.toLocaleString()} of ${walkers.toLocaleString()} (${fmt((returns.returned / walkers) * 100)}%)`} />
              <StatRow label="Returns to the start per walker:" value={fmt(returns.totalReturns / walkers)} />
            </>
          )}
          {rule === 'selfAvoiding' && <StatRow label="Walkers trapped in a dead end:" value={`${trapped} of ${walkers}`} />}
        </div>
        {walkers === 1 && <p className="chart-caption">One walker is noisy; set 100 or more walkers to see the averages lock onto the theory.</p>}
      </section>

      <div className="canvas-wrapper chart-wrapper">
        <h2 className="chart-title">Average distance from the start</h2>
        <canvas ref={distRef} width={800} height={260} role="img" aria-label="Average distance from start against steps, with the theoretical curve." />
        <h2 className="chart-title">Mean squared displacement</h2>
        <canvas ref={msdRef} width={800} height={260} role="img" aria-label="Mean squared displacement against steps, with the theoretical line." />
        <Legend items={[{ color: PALETTE.cyan, label: 'Your walkers' }, ...(hasTheory ? [{ color: PALETTE.yellow, label: 'Theory' }] : [])]} />
        <p className="chart-caption">
          Distance grows like √n but mean squared displacement grows in a straight line: this linear growth is the
          signature of diffusion. Drift bends it upward like n², and Lévy flights blow past it.
        </p>
      </div>

      <section className="canvas-description prose" aria-labelledby="explain-heading">
        <h2 id="explain-heading">What is a random walk?</h2>
        <p>
          A random walk is a path made of random steps. On the grid, a point starts in the center and, at every step,
          moves up, down, left or right with equal chance. Thousands of tiny, unpredictable moves add up to a
          wandering line that looks surprisingly like the path of a pollen grain in water.
        </p>

        <h2>How far does a random walk go?</h2>
        <p>
          Steps in opposite directions cancel out, so the walk travels much less than its total length. After n steps
          the mean squared distance is exactly n (in units of the step length), so a typical walker ends up about √n
          steps from the start: 10,000 steps cover a total length of 10,000 but usually end only around 100 from the
          center. With many walkers, the charts show the averages tracking the theory lines.
        </p>

        <h2>Random walks and Brownian motion</h2>
        <p>
          As the steps get smaller and more frequent, a random walk approaches Brownian motion, the model physicists
          use for diffusion and the jittering of particles in a fluid. Einstein used exactly this mean-squared-
          displacement law in 1905 to explain Brownian motion, and its confirmation helped prove that atoms exist. The
          same idea appears in finance, biology, chemistry and computer science.
        </p>

        <h2>Coming home</h2>
        <p>
          On a two-dimensional grid a walker is certain to come back to its starting point eventually, but the wait
          can be enormous. In three dimensions it is not: there is about a 66% chance it never returns. George Pólya,
          who proved this in 1921, is often paraphrased as saying a drunk man will find his way home, but a drunk bird
          may get lost forever.
        </p>

        <h2>Random walks as art</h2>
        <p>
          Open the style options to color paths by time, change palettes and backgrounds, and export a high-resolution
          PNG or an SVG for pen plotters and vector editors. The seed makes every piece reproducible: share the link and
          anyone gets exactly the same image.
        </p>
      </section>

      <Faq items={FAQ} />
    </ToolPage>
  );
}

export default App;
