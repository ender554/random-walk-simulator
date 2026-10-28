import { useEffect, useRef, useState } from 'react';
import ToolPage from '../../shared/ToolPage';
import { RangeControl, SeedControl, StatRow } from '../../shared/controls';
import { createAggregation } from '../../utils/dla';
import { clearCanvas, exportCanvasPNG } from '../../utils/canvas';
import { randomSeed } from '../../utils/seed';

const GRID = 400;
const CELL = 2;
const STEPS_PER_FRAME = 400000;

// Color by attachment order: cyan core fading through violet to pink tips.
function colorFor(order, total) {
  const t = Math.min(1, order / total);
  const hue = 172 + t * 160;
  return `hsl(${hue % 360}, 90%, ${60 - t * 8}%)`;
}

function App() {
  const canvasRef = useRef(null);
  const [particles, setParticles] = useState(4000);
  const [stickiness, setStickiness] = useState(1);
  const [seed, setSeed] = useState('coral');
  const [runId, setRunId] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState({ count: 1, radius: 1, done: false, hitEdge: false });
  const pausedRef = useRef(paused);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    clearCanvas(ctx, canvas);
    const sim = createAggregation({ size: GRID, stickiness, maxParticles: particles, seed });
    ctx.fillStyle = colorFor(0, particles);
    ctx.fillRect(sim.center * CELL, sim.center * CELL, CELL, CELL);

    let frame;
    const tick = () => {
      if (!pausedRef.current) {
        for (const { x, y, order } of sim.step(STEPS_PER_FRAME)) {
          ctx.fillStyle = colorFor(order, particles);
          ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
        }
      }
      const done = sim.full;
      setProgress({ count: sim.count, radius: sim.radius, done, hitEdge: done && sim.count < particles });
      if (!done) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [particles, stickiness, seed, runId]);

  const dimension = progress.radius > 8 ? Math.log(progress.count) / Math.log(progress.radius) : null;

  return (
    <ToolPage
      slug="diffusion-limited-aggregation"
      title="Diffusion-Limited Aggregation Simulator"
      intro="Release random walkers one at a time. Each wanders until it touches the growing cluster and sticks. Thousands of random walks build branching, coral-like fractals."
    >
      <section className="controls-panel" aria-label="Simulation settings">
        <div className="control-grid">
          <RangeControl id="particles-range" label="Particles" display={particles.toLocaleString()} value={particles}
            min={500} max={10000} step={250} onChange={setParticles} />
          <RangeControl id="stick-range" label="Stickiness" display={`${Math.round(stickiness * 100)}%`} value={stickiness}
            min={0.05} max={1} step={0.05} onChange={setStickiness} />
          <SeedControl value={seed} onChange={setSeed} />
        </div>
        <div className="button-row">
          <button type="button" onClick={() => setSeed(randomSeed())}>🎲 Grow a new one</button>
          <button type="button" onClick={() => setRunId((id) => id + 1)}>Restart</button>
          <button type="button" onClick={() => setPaused((v) => !v)} disabled={progress.done}>
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button type="button" onClick={() => exportCanvasPNG(canvasRef.current, 'diffusion-limited-aggregation.png')}>
            Export PNG
          </button>
        </div>
      </section>

      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={GRID * CELL}
          height={GRID * CELL}
          role="img"
          aria-label={`A branching cluster of ${progress.count} particles grown by diffusion-limited aggregation.`}
        />
      </div>

      <section className="stats-panel">
        <h2>Cluster</h2>
        <div className="stats-grid">
          <StatRow label="Particles stuck:" value={`${progress.count.toLocaleString()} of ${particles.toLocaleString()}`} />
          <StatRow label="Radius (cells):" value={progress.radius.toFixed(1)} />
          <StatRow label="Estimated fractal dimension:" value={dimension ? dimension.toFixed(2) : 'growing…'} />
          <StatRow label="Theory for DLA in 2D:" value="≈ 1.71" />
          <StatRow label="Status:" value={progress.hitEdge ? 'Stopped at the edge' : progress.done ? 'Finished' : paused ? 'Paused' : 'Growing'} />
        </div>
      </section>

      <section className="canvas-description prose" aria-labelledby="explain-heading">
        <h2 id="explain-heading">What is diffusion-limited aggregation?</h2>
        <p>
          Diffusion-limited aggregation (DLA) starts with a single particle in the middle. A second particle is
          released far away and takes a random walk until it bumps into the first one, where it sticks. Then another,
          and another. Colors here show the order particles arrived: the cyan core is oldest, the pink tips newest.
        </p>

        <h2>Why it branches</h2>
        <p>
          A wandering particle is far more likely to hit the tip of an arm than to squeeze into a gap between arms, so
          tips grow faster and the gaps stay empty. This screening effect turns pure randomness into the branching
          shapes seen in lightning, mineral deposits (dendrites), frost on glass, coral, and electrodeposited metal.
        </p>

        <h2>A fractal dimension of about 1.7</h2>
        <p>
          A solid disk&apos;s mass grows like radius², and a line&apos;s like radius¹. A DLA cluster sits in between:
          its particle count grows like radius to the power of about 1.71, its fractal dimension. The estimate above
          is a rough log(particles) ÷ log(radius) and gets closer as the cluster grows.
        </p>

        <h2>Try this</h2>
        <p>
          Lower the stickiness so particles sometimes bounce off before sticking. They get time to slip into the
          gaps, and the cluster becomes denser and less branchy.
        </p>
      </section>
    </ToolPage>
  );
}

export default App;
