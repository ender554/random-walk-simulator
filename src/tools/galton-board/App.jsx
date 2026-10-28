import { useEffect, useMemo, useRef, useState } from 'react';
import seedrandom from 'seedrandom';
import ToolPage from '../../shared/ToolPage';
import { Legend, RangeControl, SeedControl, StatRow } from '../../shared/controls';
import { PALETTE } from '../../utils/chart';
import { binomialPmf } from '../../utils/stats';
import { exportCanvasPNG } from '../../utils/canvas';
import { randomSeed } from '../../utils/seed';
import { drawBoard } from './drawBoard';

const ROWS_PER_SECOND = 10;

function dropBalls(count, rows, p, seed) {
  const rng = seedrandom(seed ?? '');
  const balls = [];
  for (let b = 0; b < count; b += 1) {
    const rights = new Uint8Array(rows + 1);
    for (let r = 1; r <= rows; r += 1) rights[r] = rights[r - 1] + (rng() < p ? 1 : 0);
    balls.push(rights);
  }
  return balls;
}

function App() {
  const canvasRef = useRef(null);
  const skipRef = useRef(false);
  const [rows, setRows] = useState(12);
  const [count, setCount] = useState(1000);
  const [p, setP] = useState(0.5);
  const [seed, setSeed] = useState('galton');
  const [runId, setRunId] = useState(0);
  const [bins, setBins] = useState(() => new Array(13).fill(0));

  const balls = useMemo(() => dropBalls(count, rows, p, seed), [count, rows, p, seed]);
  const landed = bins.reduce((a, b) => a + b, 0);

  useEffect(() => {
    skipRef.current = false;
    const duration = Math.min(8000, Math.max(2000, count * 25));
    const interval = duration / count;
    const fallTime = ((rows + 1) / ROWS_PER_SECOND) * 1000;
    const counts = new Array(rows + 1).fill(0);
    let landedSoFar = 0;
    let frame;
    const start = performance.now();

    const step = (now) => {
      const elapsed = skipRef.current ? Infinity : now - start;
      while (landedSoFar < count && elapsed - landedSoFar * interval >= fallTime) {
        counts[balls[landedSoFar][rows]] += 1;
        landedSoFar += 1;
      }
      const released = Math.min(count, Math.floor(elapsed / interval) + 1);
      const inFlight = [];
      for (let i = landedSoFar; i < released; i += 1) {
        inFlight.push({ rights: balls[i], t: ((elapsed - i * interval) / 1000) * ROWS_PER_SECOND });
      }
      if (canvasRef.current) drawBoard(canvasRef.current, { rows, p, bins: counts, inFlight, total: count });
      setBins([...counts]);
      if (landedSoFar < count) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [balls, rows, p, count, runId]);

  let mean = 0;
  let sq = 0;
  bins.forEach((c, k) => { mean += c * k; });
  mean /= Math.max(landed, 1);
  bins.forEach((c, k) => { sq += c * (k - mean) ** 2; });
  const sd = Math.sqrt(sq / Math.max(landed, 1));
  const middle = Math.round(rows * p);

  return (
    <ToolPage
      slug="galton-board"
      title="Galton Board Simulator"
      intro="Drop balls through rows of pegs. Each bounce is a coin flip, left or right, and together the balls stack into a bell curve: the binomial distribution, live."
    >
      <section className="controls-panel" aria-label="Simulation settings">
        <div className="control-grid">
          <RangeControl id="rows-range" label="Rows of pegs" value={rows} min={4} max={20} onChange={setRows} />
          <RangeControl id="balls-range" label="Balls" display={count.toLocaleString()} value={count}
            min={50} max={5000} step={50} onChange={setCount} />
          <RangeControl id="p-range" label="Chance of bouncing right" display={`${Math.round(p * 100)}%`} value={p}
            min={0.2} max={0.8} step={0.01} onChange={setP} />
          <SeedControl value={seed} onChange={setSeed} />
        </div>
        <div className="button-row">
          <button type="button" onClick={() => setSeed(randomSeed())}>🎲 New balls</button>
          <button type="button" onClick={() => setRunId((id) => id + 1)}>Replay</button>
          <button type="button" onClick={() => { skipRef.current = true; }} disabled={landed >= count}>
            Skip animation
          </button>
          <button type="button" onClick={() => exportCanvasPNG(canvasRef.current, 'galton-board.png')}>Export PNG</button>
        </div>
      </section>

      <div className="canvas-wrapper chart-wrapper">
        <canvas
          ref={canvasRef}
          width={800}
          height={650}
          role="img"
          aria-label={`Galton board with ${rows} rows; ${landed} of ${count} balls have landed, averaging bin ${mean.toFixed(2)}.`}
        />
        <Legend
          items={[
            { color: PALETTE.cyan, label: 'Balls in each bin (number of right bounces)' },
            { color: PALETTE.yellow, label: 'Binomial prediction' },
          ]}
        />
      </div>

      <section className="stats-panel" aria-live="off">
        <h2>Results</h2>
        <div className="stats-grid">
          <StatRow label="Balls landed:" value={`${landed.toLocaleString()} of ${count.toLocaleString()}`} />
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
          A Galton board, or bean machine, is a vertical board with rows of pegs. Balls dropped at the top hit a peg
          at every row and bounce left or right. Francis Galton built one in the 1870s to show how many small random
          effects add up to a predictable pattern.
        </p>

        <h2>Why the balls form a bell curve</h2>
        <p>
          A ball&apos;s final bin is the number of times it bounced right. With 12 rows there is only one way to end
          in the far left bin (left every time) but 924 ways to end in the middle bin. The counts follow the binomial
          distribution, and as the number of rows grows that distribution looks more and more like the normal curve.
          This is the central limit theorem at work: each ball&apos;s position is a sum of many independent coin flips.
        </p>

        <h2>Try this</h2>
        <p>
          Push the chance of bouncing right away from 50% and the whole pile shifts and becomes lopsided, but it
          still forms a hump. Add rows and the hump gets wider, but only like the square root of the number of rows.
        </p>
      </section>
    </ToolPage>
  );
}

export default App;
