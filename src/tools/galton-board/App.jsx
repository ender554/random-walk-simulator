import { useEffect, useMemo, useRef, useState } from 'react';
import seedrandom from 'seedrandom';
import ToolPage from '../../shared/ToolPage';
import ToolActions from '../../shared/ToolActions';
import Faq from '../../shared/Faq';
import { Legend, RangeControl, SeedControl, StatRow } from '../../shared/controls';
import { useUrlState } from '../../shared/useUrlState';
import { PALETTE } from '../../utils/chart';
import { binomialPmf } from '../../utils/stats';
import { downloadCSV } from '../../utils/export';
import { randomSeed } from '../../utils/seed';
import { HEIGHT, WIDTH, drawBoard } from './drawBoard';

const MAX_BALLS = 10000;
const SPEEDS = [
  { label: '¼× (one ball at a time)', factor: 0.25 },
  { label: '½×', factor: 0.5 },
  { label: '1×', factor: 1 },
  { label: '4×', factor: 4 },
  { label: '16×', factor: 16 },
];
const DEFAULTS = { rows: 12, p: 0.5, seed: 'galton', view: 'count', pascal: false, normal: false, speed: 2, start: 500 };

const FAQ = [
  {
    q: 'Why does a Galton board make a bell curve?',
    a: "Each peg is a coin flip: the ball bounces left or right. Its final bin is the number of right bounces, which follows the binomial distribution. There is only one path to each edge bin but many paths to the middle ones (Pascal's triangle counts them), so most balls pile up in the middle. With many rows the binomial looks like a normal curve.",
  },
  {
    q: "How is the Galton board related to Pascal's triangle?",
    a: "The number of different paths a ball can take to reach each peg is the number in Pascal's triangle at that position. Turn on the Pascal's triangle overlay: the bottom row, divided by 2 to the power of the number of rows, gives the exact chance of each bin for a fair board.",
  },
  {
    q: 'Is the result exactly a normal distribution?',
    a: 'No. It is a binomial distribution, which is discrete and has a fixed range from 0 to the number of rows. It is very close to a normal curve when there are many rows, which is what the central limit theorem predicts. Turn on the normal curve to compare the two.',
  },
  {
    q: 'What happens if the pegs are biased?',
    a: 'If balls bounce right more often than left, the pile shifts toward the right and becomes slightly lopsided, but it still forms a hump. The average bin moves to rows × p and the spread becomes √(rows × p × (1 − p)).',
  },
  {
    q: 'What is a quincunx or bean machine? What about Plinko?',
    a: 'They are other names for the same device. Francis Galton called it a quincunx after the pattern of the pegs; it is also called a bean machine. The game show Plinko and the PhET "Plinko Probability" simulation use the same idea.',
  },
];

function generatePaths(rows, p, seed) {
  const rng = seedrandom(`${seed}-${rows}-${p}`);
  return Array.from({ length: MAX_BALLS }, () => {
    const rights = new Uint8Array(rows + 1);
    for (let r = 1; r <= rows; r += 1) rights[r] = rights[r - 1] + (rng() < p ? 1 : 0);
    return rights;
  });
}

function App() {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const [settings, set, reset] = useUrlState(DEFAULTS);
  const { rows, p, seed, view, pascal, normal, speed } = settings;
  const paths = useMemo(() => generatePaths(rows, p, seed), [rows, p, seed]);

  // Mutable simulation state read by the animation loop; React state mirrors it for display.
  const sim = useRef(null);
  const [display, setDisplay] = useState({ bins: [], landed: 0, lastPath: null, playing: false, queued: 0 });
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  });

  useEffect(() => {
    sim.current = { released: 0, landed: 0, queue: settings.start, playing: false, inFlight: [], bins: new Array(rows + 1).fill(0), lastPath: null, lastRelease: 0, finish: false };
    let frame;
    let previous = performance.now();
    const step = (now) => {
      const s = sim.current;
      const { factor } = SPEEDS[settingsRef.current.speed];
      const dt = Math.min(0.1, (now - previous) / 1000);
      previous = now;
      const rowsPerSecond = 9 * Math.sqrt(factor);
      const interval = 0.12 / factor;

      if (s.finish) {
        // Land everything in flight and still queued
        while (s.inFlight.length) {
          const ball = s.inFlight.shift();
          s.bins[ball.rights[rows]] += 1;
          s.landed += 1;
          s.lastPath = ball.rights;
        }
        const extra = s.playing ? MAX_BALLS - s.released : Math.min(s.queue, MAX_BALLS - s.released);
        for (let i = 0; i < extra; i += 1) {
          const rights = paths[s.released];
          s.bins[rights[rows]] += 1;
          s.released += 1;
          s.landed += 1;
          s.lastPath = rights;
        }
        s.queue = 0;
        s.playing = false;
        s.finish = false;
      }

      // Release new balls
      s.lastRelease += dt;
      while ((s.queue > 0 || s.playing) && s.released < MAX_BALLS && s.lastRelease >= interval) {
        s.lastRelease -= interval;
        s.inFlight.push({ rights: paths[s.released], t: 0 });
        s.released += 1;
        if (s.queue > 0) s.queue -= 1;
      }
      if (s.queue === 0 && !s.playing) s.lastRelease = Math.min(s.lastRelease, interval);
      if (s.released >= MAX_BALLS) s.playing = false;

      // Move balls; land those that reach the bins
      for (const ball of s.inFlight) ball.t += dt * rowsPerSecond;
      while (s.inFlight.length && s.inFlight[0].t >= rows + 1) {
        const ball = s.inFlight.shift();
        s.bins[ball.rights[rows]] += 1;
        s.landed += 1;
        s.lastPath = ball.rights;
      }

      const { view: v, pascal: pas, normal: nor } = settingsRef.current;
      if (canvasRef.current) {
        drawBoard(canvasRef.current, { rows, p, bins: s.bins, inFlight: s.inFlight, lastPath: s.lastPath, view: v, pascal: pas, normal: nor });
      }
      setDisplay((d) => (d.landed === s.landed && d.playing === s.playing && d.queued === s.queue + s.inFlight.length && d.bins.length === s.bins.length
        ? d
        : { bins: [...s.bins], landed: s.landed, lastPath: s.lastPath, playing: s.playing, queued: s.queue + s.inFlight.length }));
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
    // The loop reads speed and display options through settingsRef
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paths, rows, p]);

  const drop = (count) => {
    if (sim.current) sim.current.queue += count;
  };
  const togglePlay = () => {
    if (sim.current) sim.current.playing = !sim.current.playing;
  };
  const finish = () => {
    if (sim.current) sim.current.finish = true;
  };
  const empty = () => {
    if (!sim.current) return;
    Object.assign(sim.current, { released: 0, landed: 0, queue: 0, playing: false, inFlight: [], bins: new Array(rows + 1).fill(0), lastPath: null });
  };

  const { bins, landed, lastPath } = display;
  let mean = 0;
  let sq = 0;
  bins.forEach((c, k) => { mean += c * k; });
  mean /= Math.max(landed, 1);
  bins.forEach((c, k) => { sq += c * (k - mean) ** 2; });
  const sd = Math.sqrt(sq / Math.max(landed, 1));
  const middle = Math.round(rows * p);
  const pathText = lastPath
    ? Array.from({ length: rows }, (_, r) => (lastPath[r + 1] > lastPath[r] ? 'R' : 'L')).join(' ')
    : '';

  const imageDraw = (canvas) =>
    drawBoard(canvas, { rows, p, bins, inFlight: [], lastPath, view, pascal, normal });

  const exportCsv = () => {
    downloadCSV(`galton-board-${rows}-rows.csv`, ['bin_right_bounces', 'count', 'share', 'exact_probability', 'expected_count'],
      bins.map((c, k) => [k, c, landed ? (c / landed).toFixed(5) : 0, binomialPmf(rows, k, p).toFixed(6), (landed * binomialPmf(rows, k, p)).toFixed(2)]));
  };

  return (
    <ToolPage
      slug="galton-board"
      title="Galton Board Simulator"
      intro="Drop balls through rows of pegs. Each bounce is a coin flip, left or right, and together the balls stack into a bell curve. Follow a single ball's path, see Pascal's triangle count the routes, and compare the bins with the binomial and normal curves."
    >

      <div className="workbench">
        <div className="workbench-controls">
          <section className="controls-panel" aria-label="Board settings">
            <div className="button-row">
              <button type="button" className="primary" onClick={() => drop(1)}>Drop 1 ball</button>
              <button type="button" onClick={() => drop(10)}>Drop 10</button>
              <button type="button" onClick={() => drop(100)}>Drop 100</button>
              <button type="button" onClick={togglePlay}>{display.playing ? '⏸ Pause' : '▶ Keep dropping'}</button>
              <button type="button" onClick={finish} disabled={!display.queued && !display.playing}>Finish now</button>
              <button type="button" onClick={empty}>Empty the board</button>
            </div>
            <div className="control-grid">
              <RangeControl id="rows-range" label="Rows of pegs" value={rows} min={1} max={20} onChange={(v) => set('rows', v)} />
              <RangeControl id="p-range" label="Chance of bouncing right" display={`${Math.round(p * 100)}%`} value={p}
                min={0.1} max={0.9} step={0.01} onChange={(v) => set('p', v)} />
              <div className="control-row">
                <label htmlFor="speed-select">Speed</label>
                <select id="speed-select" value={speed} onChange={(e) => set('speed', Number(e.target.value))}>
                  {SPEEDS.map((s, i) => <option key={s.label} value={i}>{s.label}</option>)}
                </select>
              </div>
              <SeedControl value={seed} onChange={(v) => set('seed', v)} />
            </div>
            <div className="preset-row" role="group" aria-label="Bar labels">
              {[['count', 'Counts'], ['fraction', 'Share of balls'], ['probability', 'Exact probability'], ['none', 'No labels']].map(([key, label]) => (
                <button key={key} type="button" aria-pressed={view === key} onClick={() => set('view', key)}>{label}</button>
              ))}
            </div>
            <label className="check-row" htmlFor="pascal-check">
              <input id="pascal-check" type="checkbox" checked={pascal} onChange={(e) => set('pascal', e.target.checked)} />
              Show Pascal&apos;s triangle (number of paths to each peg)
            </label>
            <label className="check-row" htmlFor="normal-check">
              <input id="normal-check" type="checkbox" checked={normal} onChange={(e) => set('normal', e.target.checked)} />
              Show the normal curve, mean and ±1 standard deviation
            </label>
            <ToolActions
              image={{ draw: imageDraw, size: { width: WIDTH, height: HEIGHT }, filename: 'galton-board.png' }}
              onCsv={exportCsv}
              csvLabel="Download bin counts (CSV)"
              onReset={reset}
              fullscreenRef={chartRef}
            >
              <button type="button" onClick={() => set('seed', randomSeed())}>🎲 New balls</button>
            </ToolActions>
          </section>
        </div>
        <div className="workbench-stage">
          <div className="canvas-wrapper chart-wrapper" ref={chartRef}>
            <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} role="img"
              aria-label={`Galton board with ${rows} rows; ${landed} balls have landed, averaging bin ${mean.toFixed(2)}.`} />
            <Legend
              items={[
                { color: PALETTE.cyan, label: 'Balls in each bin (number of right bounces)' },
                { color: PALETTE.yellow, label: 'Binomial prediction' },
                ...(normal ? [{ color: PALETTE.violet, label: 'Normal curve, mean, ±1σ' }] : []),
                { color: PALETTE.pink, label: 'Last ball\'s path' },
              ]}
            />
            {lastPath && (
              <p className="chart-caption" aria-live="off">
                Last ball: {pathText} → {lastPath[rows]} right bounce{lastPath[rows] === 1 ? '' : 's'} → bin {lastPath[rows]}
              </p>
            )}
          </div>
        </div>
      </div>

      <section className="stats-panel">
        <h2>Results</h2>
        <div className="stats-grid">
          <StatRow label="Balls landed:" value={landed.toLocaleString()} />
          <StatRow label="Average bin:" value={mean.toFixed(2)} />
          <StatRow label="Theory, rows × p:" value={(rows * p).toFixed(2)} />
          <StatRow label="Spread (standard deviation):" value={sd.toFixed(2)} />
          <StatRow label="Theory, √(rows·p·(1−p)):" value={Math.sqrt(rows * p * (1 - p)).toFixed(2)} />
          <StatRow
            label={`In bin ${middle}:`}
            value={`${(((bins[middle] ?? 0) / Math.max(landed, 1)) * 100).toFixed(1)}% (theory ${(binomialPmf(rows, middle, p) * 100).toFixed(1)}%)`}
          />
        </div>
      </section>

      <section className="canvas-description prose" aria-labelledby="explain-heading">
        <h2 id="explain-heading">What is a Galton board?</h2>
        <p>
          A Galton board, also called a bean machine or quincunx, is a vertical board with rows of pegs. Balls
          dropped at the top hit a peg at every row and bounce left or right. Francis Galton built one in the 1870s to
          show how many small random effects add up to a predictable pattern. Set the rows to 1 and it is just a
          coin flip; add rows and the bell curve appears.
        </p>

        <h2>Why the balls form a bell curve</h2>
        <p>
          A ball&apos;s final bin is the number of times it bounced right. With 12 rows there is only one way to end
          in the far left bin (left every time) but 924 ways to end in the middle bin. Turn on Pascal&apos;s triangle
          to see these path counts on every peg. The counts follow the binomial distribution, and as the number of
          rows grows that distribution looks more and more like the normal curve. This is the central limit theorem
          at work: each ball&apos;s position is a sum of many independent coin flips.
        </p>

        <h2>Try this</h2>
        <p>
          Drop one ball at a time at slow speed and predict each landing spot: single balls are unpredictable. Then
          keep dropping and watch the shape become predictable. Push the chance of bouncing right away from 50% and
          the pile shifts and becomes lopsided, but it still forms a hump. Add rows and the hump gets wider, but only
          like the square root of the number of rows.
        </p>
      </section>

      <Faq items={FAQ} />
    </ToolPage>
  );
}

export default App;
