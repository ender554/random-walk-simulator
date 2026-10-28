import { useEffect, useMemo, useRef, useState } from 'react';
import seedrandom from 'seedrandom';
import ToolPage from '../../shared/ToolPage';
import { Legend, LogRangeControl, SeedControl, StatRow } from '../../shared/controls';
import { PALETTE, chartFrame, clipToPlot, evenTicks, powersOfTen } from '../../utils/chart';
import { clearCanvas, exportCanvasPNG } from '../../utils/canvas';
import { logCheckpoints } from '../../utils/stats';
import { randomSeed } from '../../utils/seed';

const ANIMATION_MS = 2500;
// Standard deviation of a single point's contribution to the estimate: 4·sqrt(p(1-p)), p = π/4
const SPREAD = 4 * Math.sqrt((Math.PI / 4) * (1 - Math.PI / 4));

function throwPoints(count, seed) {
  const rng = seedrandom(seed ?? '');
  const xs = new Float32Array(count);
  const ys = new Float32Array(count);
  const insideSoFar = new Uint32Array(count + 1);
  for (let i = 0; i < count; i += 1) {
    xs[i] = rng();
    ys[i] = rng();
    insideSoFar[i + 1] = insideSoFar[i] + (xs[i] * xs[i] + ys[i] * ys[i] <= 1 ? 1 : 0);
  }
  return { xs, ys, insideSoFar };
}

function drawSquare(canvas, { xs, ys }, from, to) {
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  if (from === 0) {
    clearCanvas(ctx, canvas);
    ctx.strokeStyle = PALETTE.yellow;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, size, size, -Math.PI / 2, 0);
    ctx.stroke();
  }
  const dot = to > 20000 ? 1.5 : to > 2000 ? 2.5 : 4;
  for (let i = from; i < to; i += 1) {
    ctx.fillStyle = xs[i] * xs[i] + ys[i] * ys[i] <= 1 ? PALETTE.cyan : PALETTE.pink;
    ctx.fillRect(xs[i] * size - dot / 2, (1 - ys[i]) * size - dot / 2, dot, dot);
  }
}

function drawConvergence(canvas, { insideSoFar }, shown, total) {
  const frame = chartFrame(canvas, {
    xMin: 1, xMax: total, yMin: 2.6, yMax: 3.7, logX: true,
    xTicks: powersOfTen(total),
    yTicks: evenTicks(2.6, 3.6, 6),
    formatY: (v) => v.toFixed(1),
    xLabel: 'Points thrown (log scale)',
  });
  const { ctx, x, y } = frame;
  clipToPlot(frame);

  const checkpoints = logCheckpoints(total).filter((n) => n <= shown);

  ctx.fillStyle = 'rgba(255, 209, 102, 0.12)';
  ctx.beginPath();
  checkpoints.forEach((n) => ctx.lineTo(x(n), y(Math.PI + (2 * SPREAD) / Math.sqrt(n))));
  [...checkpoints].reverse().forEach((n) => ctx.lineTo(x(n), y(Math.PI - (2 * SPREAD) / Math.sqrt(n))));
  ctx.fill();

  ctx.strokeStyle = PALETTE.yellow;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(x(1), y(Math.PI));
  ctx.lineTo(x(total), y(Math.PI));
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = PALETTE.cyan;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const n of checkpoints) ctx.lineTo(x(n), y((4 * insideSoFar[n]) / n));
  ctx.stroke();
  ctx.restore();
}

function App() {
  const squareRef = useRef(null);
  const chartRef = useRef(null);
  const [count, setCount] = useState(10000);
  const [seed, setSeed] = useState('pi');
  const [shown, setShown] = useState(0);
  const [runId, setRunId] = useState(0);

  const points = useMemo(() => throwPoints(count, seed), [count, seed]);

  // Animate: reveal points over a couple of seconds, drawing only the new ones each frame.
  useEffect(() => {
    let frame;
    let drawn = 0;
    const startTime = performance.now();
    const step = (now) => {
      const target = Math.min(count, Math.ceil(count * Math.min(1, (now - startTime) / ANIMATION_MS)));
      if (squareRef.current) drawSquare(squareRef.current, points, drawn, Math.max(target, 1));
      drawn = Math.max(target, 1);
      setShown(drawn);
      if (drawn < count) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [points, count, runId]);

  useEffect(() => {
    if (chartRef.current && shown > 0) drawConvergence(chartRef.current, points, shown, count);
  }, [points, shown, count]);

  const n = Math.max(shown, 1);
  const inside = points.insideSoFar[n];
  const estimate = (4 * inside) / n;

  const showAll = () => {
    drawSquare(squareRef.current, points, 0, count);
    setShown(count);
  };

  return (
    <ToolPage
      slug="monte-carlo-pi"
      title="Monte Carlo π Estimator"
      intro="Throw random points at a square with a quarter circle inside it. The share that lands inside the circle gives an estimate of π, and more points give a better one."
    >
      <section className="controls-panel" aria-label="Simulation settings">
        <div className="control-grid">
          <LogRangeControl id="points-range" label="Points to throw" value={count} minExp={2} maxExp={5.3} onChange={setCount} />
          <SeedControl value={seed} onChange={setSeed} />
        </div>
        <div className="button-row">
          <button type="button" onClick={() => setSeed(randomSeed())}>🎲 New throw</button>
          <button type="button" onClick={() => setRunId((id) => id + 1)}>Replay</button>
          <button type="button" onClick={showAll} disabled={shown >= count}>Skip animation</button>
          <button type="button" onClick={() => exportCanvasPNG(squareRef.current, 'monte-carlo-pi.png')}>Export PNG</button>
        </div>
      </section>

      <div className="canvas-wrapper chart-wrapper square-chart">
        <canvas
          ref={squareRef}
          width={600}
          height={600}
          role="img"
          aria-label={`${n.toLocaleString()} random points in a unit square; ${inside.toLocaleString()} inside the quarter circle, estimating pi as ${estimate.toFixed(4)}.`}
        />
        <Legend
          items={[
            { color: PALETTE.cyan, label: 'Inside the quarter circle' },
            { color: PALETTE.pink, label: 'Outside' },
          ]}
        />
      </div>

      <section className="stats-panel" aria-live="polite">
        <h2>Estimate</h2>
        <div className="stats-grid">
          <StatRow label="Points thrown:" value={n.toLocaleString()} />
          <StatRow label="Inside the circle:" value={inside.toLocaleString()} />
          <StatRow label="Estimate of π (4 × inside ÷ total):" value={estimate.toFixed(5)} />
          <StatRow label="Actual π:" value={Math.PI.toFixed(5)} />
          <StatRow label="Error:" value={`${(estimate - Math.PI >= 0 ? '+' : '')}${(estimate - Math.PI).toFixed(5)}`} />
          <StatRow label="Typical error at this many points:" value={`± ${(SPREAD / Math.sqrt(n)).toFixed(5)}`} />
        </div>
      </section>

      <div className="canvas-wrapper chart-wrapper">
        <h2 className="chart-title">Estimate as points are added</h2>
        <canvas
          ref={chartRef}
          width={800}
          height={360}
          role="img"
          aria-label={`The estimate of pi converging toward 3.14159 as points are added; currently ${estimate.toFixed(4)}.`}
        />
        <p className="chart-caption">
          The dashed line is π. The shaded band shrinks like 1/√n: the estimate should stay inside it about 95% of
          the time.
        </p>
      </div>

      <section className="canvas-description prose" aria-labelledby="explain-heading">
        <h2 id="explain-heading">How random points can find π</h2>
        <p>
          A quarter circle of radius 1 fits inside a 1 × 1 square. The square has area 1 and the quarter circle has
          area π/4. If you throw points uniformly at random into the square, the fraction that lands inside the
          circle approaches π/4, so four times that fraction approaches π. Each point checks one thing: is x² + y² ≤ 1?
        </p>

        <h2>Why it converges slowly</h2>
        <p>
          The error shrinks like 1/√n, so each extra correct digit costs about 100 times more points. Ten thousand
          points usually land within a few hundredths of π, and a million points within a few thousandths. That slow but
          steady convergence is typical of all Monte Carlo methods.
        </p>

        <h2>What Monte Carlo methods are used for</h2>
        <p>
          Nobody computes π this way in practice, but the same idea, answering a question by random sampling, is
          used to price financial options, model particle physics, render realistic lighting in films, and estimate
          risks too complicated to calculate exactly. The name comes from the Monte Carlo casino.
        </p>
      </section>
    </ToolPage>
  );
}

export default App;
