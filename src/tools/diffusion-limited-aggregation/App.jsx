import { useEffect, useRef, useState } from 'react';
import ToolPage from '../../shared/ToolPage';
import ToolActions from '../../shared/ToolActions';
import Faq from '../../shared/Faq';
import { Legend, RangeControl, SeedControl, StatRow } from '../../shared/controls';
import { useUrlState } from '../../shared/useUrlState';
import { SEEDS, createAggregation, massRadius } from '../../utils/dla';
import { BACKGROUNDS, PALETTES } from '../../utils/palettes';
import { PALETTE } from '../../utils/chart';
import { downloadCSV, downloadText } from '../../utils/export';
import { randomSeed } from '../../utils/seed';
import { clusterToSvg, drawCluster, drawMassRadius, drawWalkers, normalizers } from './draw';
import './dla.css';

const GRID = 400;
const SIZE = { width: 800, height: 800 };
const SPEEDS = [
  { label: 'Slow (watch each walker)', steps: 4000 },
  { label: 'Normal', steps: 400000 },
  { label: 'Fast', steps: 3000000 },
];
const DEFAULTS = {
  particles: 4000, stickiness: 1, seed: 'coral', shape: 'point', bias: 0, angle: 90,
  color: 'order', palette: 'neon', bg: 'dark', speed: 1,
};

const FAQ = [
  {
    q: 'What is diffusion-limited aggregation?',
    a: 'A growth process where particles drift around randomly (diffuse) and stick when they touch a growing cluster. Because growth is limited by how fast particles diffuse in, the cluster becomes a branching fractal. It was introduced by Thomas Witten and Leonard Sander in 1981.',
  },
  {
    q: 'Why does DLA look like coral, lightning or frost?',
    a: 'A wandering particle is much more likely to hit the tip of an arm than to reach the gaps between arms, so tips grow faster and gaps stay empty. The same screening effect shapes mineral dendrites, frost on windows, electrodeposited metal, lightning (Lichtenberg figures) and some corals and bacterial colonies.',
  },
  {
    q: 'What is the fractal dimension of a DLA cluster?',
    a: 'In two dimensions about 1.71: the number of particles within radius r grows like r^1.71, between a line (1) and a filled disk (2). The mass–radius chart fits this slope from your cluster. On a square grid large clusters slowly become diamond-shaped and the measured value can drift, so expect roughly 1.6 to 1.8.',
  },
  {
    q: 'How does the DLA algorithm work?',
    a: 'Place a seed particle. Release a walker on a circle just outside the cluster and move it one random grid step at a time. If it touches the cluster it sticks (with probability equal to the stickiness); if it wanders too far it is released again. Repeat for thousands of particles. Download the CSV to get every particle with the neighbor it stuck to.',
  },
  {
    q: 'Can I use DLA for generative art or 3D printing?',
    a: 'Yes. Choose a palette and background, color by branch depth or distance, and export a PNG up to 3200 × 3200 pixels or an SVG of every branch for pen plotters and laser cutters. The CSV of particle positions and parent links can be imported into Grasshopper, Houdini or Blender to build geometry.',
  },
];

function App() {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const mrRef = useRef(null);
  const wrapRef = useRef(null);
  const simRef = useRef(null);
  const [settings, set, reset] = useUrlState(DEFAULTS);
  const { particles, stickiness, seed, shape, bias, angle, color, palette, bg, speed } = settings;
  const [runId, setRunId] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showWalkers, setShowWalkers] = useState(false);
  const [progress, setProgress] = useState({ count: 0, radius: 0, done: false, depth: 0 });
  const live = useRef({ paused, showWalkers, speed });
  useEffect(() => {
    live.current = { paused, showWalkers, speed };
  });

  const style = { colorMode: color, palette, background: bg };

  useEffect(() => {
    const canvas = canvasRef.current;
    const sim = createAggregation({ size: GRID, stickiness, maxParticles: particles, seed, seedShape: shape, biasStrength: bias, biasAngle: angle });
    simRef.current = sim;
    let norm = normalizers(sim, particles);
    drawCluster(canvas, { sim, from: 0, to: sim.count, ...style, norm });
    let drawn = sim.count;
    let frame;
    const tick = () => {
      const { paused: isPaused, showWalkers: walkersOn, speed: speedIndex } = live.current;
      if (!isPaused) {
        sim.step(SPEEDS[speedIndex].steps);
        if (sim.count > drawn) {
          drawCluster(canvas, { sim, from: drawn, to: sim.count, ...style, norm });
          drawn = sim.count;
        }
      }
      if (overlayRef.current) {
        if (walkersOn && !sim.done) drawWalkers(overlayRef.current, sim);
        else overlayRef.current.getContext('2d').clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
      }
      if (sim.done) {
        // Final redraw with color ranges taken from the finished cluster
        norm = { ...norm, depth: Math.max(10, sim.maxDepth), order: Math.max(1, sim.count - sim.seeds) };
        drawCluster(canvas, { sim, from: 0, to: sim.count, ...style, norm });
      }
      setProgress({ count: sim.count - sim.seeds, radius: sim.radius, done: sim.done, depth: sim.maxDepth });
      if (!sim.done) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // style changes after growth are handled by the redraw effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [particles, stickiness, seed, shape, bias, angle, runId]);

  // Restyle the cluster without regrowing it
  useEffect(() => {
    const sim = simRef.current;
    if (!sim || !canvasRef.current) return;
    drawCluster(canvasRef.current, { sim, from: 0, to: sim.count, ...style, norm: currentNorm(sim) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color, palette, bg]);

  const currentNorm = (sim) => ({ ...normalizers(sim, particles), ...(sim.done ? { depth: Math.max(10, sim.maxDepth), order: Math.max(1, sim.count - sim.seeds) } : {}) });

  // Measured once the cluster is finished
  const mr = progress.done && simRef.current ? massRadius(simRef.current) : null;
  useEffect(() => {
    if (mr && mrRef.current) drawMassRadius(mrRef.current, mr);
  });

  const skipToEnd = () => {
    const sim = simRef.current;
    if (!sim) return;
    const started = performance.now();
    while (!sim.done && performance.now() - started < 8000) sim.step(5e6);
    setPaused(false);
  };

  const imageDraw = (c) => {
    const sim = simRef.current;
    if (sim) drawCluster(c, { sim, from: 0, to: sim.count, ...style, norm: currentNorm(sim) });
  };
  const exportSvg = () => {
    const sim = simRef.current;
    if (sim) downloadText('dla-branches.svg', clusterToSvg({ sim, ...style, norm: currentNorm(sim) }), 'image/svg+xml');
  };
  const exportCsv = () => {
    const sim = simRef.current;
    if (!sim) return;
    const rows = [];
    for (let i = 0; i < sim.count; i += 1) rows.push([i, sim.parent[i], sim.px[i], GRID - 1 - sim.py[i], sim.depth[i]]);
    downloadCSV('dla-particles.csv', ['id', 'parent_id', 'x', 'y', 'branch_depth'], rows);
  };

  const dimension = mr && Number.isFinite(mr.slope) ? mr.slope : null;

  return (
    <ToolPage
      slug="diffusion-limited-aggregation"
      title="Diffusion-Limited Aggregation Simulator"
      intro="Release random walkers one at a time; each wanders until it touches the growing cluster and sticks. Grow coral, frost and lightning-like fractals from different seeds, measure the fractal dimension properly, and export the result as high-resolution art, SVG or data."
    >

      <section className="controls-panel" aria-label="Growth settings">
        <div className="control-grid">
          <div className="control-row">
            <label htmlFor="shape-select">Seed</label>
            <select id="shape-select" value={shape} onChange={(e) => set('shape', e.target.value)}>
              {Object.entries(SEEDS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </div>
          <RangeControl id="particles-range" label="Particles" display={particles.toLocaleString()} value={particles}
            min={500} max={20000} step={500} onChange={(v) => set('particles', v)} />
          <RangeControl id="stick-range" label="Stickiness" display={`${Math.round(stickiness * 100)}%`} value={stickiness}
            min={0.05} max={1} step={0.05} onChange={(v) => set('stickiness', v)} />
          <RangeControl id="bias-range" label="Drift (wind)" display={bias === 0 ? 'none' : `${Math.round(bias * 100)}%`} value={bias}
            min={0} max={0.3} step={0.01} onChange={(v) => set('bias', v)} />
          {bias > 0 && (
            <RangeControl id="angle-range" label="Drift direction" display={`${angle}°`} value={angle} min={0} max={345} step={15} onChange={(v) => set('angle', v)} />
          )}
          <div className="control-row">
            <label htmlFor="speed-select">Speed</label>
            <select id="speed-select" value={speed} onChange={(e) => set('speed', Number(e.target.value))}>
              {SPEEDS.map((s, i) => <option key={s.label} value={i}>{s.label}</option>)}
            </select>
          </div>
          <SeedControl value={seed} onChange={(v) => set('seed', v)} />
        </div>

        <details className="style-panel">
          <summary>🎨 Style and art options</summary>
          <div className="control-grid">
            <div className="control-row">
              <label htmlFor="color-select">Color by</label>
              <select id="color-select" value={color} onChange={(e) => set('color', e.target.value)}>
                <option value="order">Arrival order (age)</option>
                <option value="distance">Distance from the seed</option>
                <option value="depth">Branch depth (steps from the seed)</option>
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
          </div>
        </details>

        <ToolActions
          image={{ draw: imageDraw, size: SIZE, filename: 'diffusion-limited-aggregation.png' }}
          onCsv={exportCsv}
          csvLabel="Download particles (CSV)"
          onReset={reset}
          fullscreenRef={wrapRef}
        >
          <button type="button" onClick={() => set('seed', randomSeed())}>🎲 Grow a new one</button>
          <button type="button" onClick={exportSvg} disabled={!progress.done}>Save SVG</button>
        </ToolActions>
      </section>

      <section className="panel" aria-label="Growth controls">
        <div className="button-row">
          <button type="button" onClick={() => setPaused((v) => !v)} disabled={progress.done}>{paused ? '▶ Resume' : '⏸ Pause'}</button>
          <button type="button" onClick={skipToEnd} disabled={progress.done}>Skip to the end</button>
          <button type="button" onClick={() => { setPaused(false); setRunId((id) => id + 1); }}>Restart</button>
        </div>
        <label className="check-row" htmlFor="walkers-check">
          <input id="walkers-check" type="checkbox" checked={showWalkers} onChange={(e) => setShowWalkers(e.target.checked)} />
          Show the wandering particle (use the slow speed)
        </label>
      </section>

      <div className="canvas-wrapper dla-stack" ref={wrapRef}>
        <div className="dla-layers">
          <canvas ref={canvasRef} width={SIZE.width} height={SIZE.height} role="img"
            aria-label={`A branching cluster of ${progress.count} particles grown by diffusion-limited aggregation.`} />
          <canvas ref={overlayRef} className="dla-overlay" width={SIZE.width} height={SIZE.height} aria-hidden="true" />
        </div>
      </div>

      <section className="stats-panel" aria-live="off">
        <h2>Cluster</h2>
        <div className="stats-grid">
          <StatRow label="Particles stuck:" value={`${progress.count.toLocaleString()} of ${particles.toLocaleString()}`} />
          <StatRow label={shape === 'line' ? 'Height (cells):' : shape === 'ring' ? 'Closest to center (cells):' : 'Radius (cells):'} value={progress.radius.toFixed(1)} />
          <StatRow label="Longest branch (particles):" value={progress.depth.toLocaleString()} />
          <StatRow label="Fractal dimension (mass–radius fit):" value={dimension ? dimension.toFixed(2) : shape === 'point' ? 'growing…' : 'needs the single center seed'} />
          <StatRow label="Theory for DLA in 2D:" value="≈ 1.71" />
          <StatRow label="Status:" value={progress.done ? 'Finished' : paused ? 'Paused' : 'Growing'} />
        </div>
      </section>

      {shape === 'point' && (
        <div className="canvas-wrapper chart-wrapper">
          <h2 className="chart-title">Mass–radius: particles within radius r</h2>
          <canvas ref={mrRef} width={800} height={300} role="img" aria-label="Log–log plot of the number of particles within each radius, with the fitted slope." />
          <Legend items={[{ color: PALETTE.cyan, label: 'Your cluster' }, { color: PALETTE.yellow, label: `Fitted slope${dimension ? ` ${dimension.toFixed(2)}` : ''}` }, { color: PALETTE.violet, label: 'Slope 1.71 for reference' }]} />
          <p className="chart-caption">
            The slope of this line is the fractal dimension. A filled disk would give 2 and a straight line 1. The fit
            skips the innermost cells and the outer edge, which is still growing.
          </p>
        </div>
      )}

      <section className="canvas-description prose" aria-labelledby="explain-heading">
        <h2 id="explain-heading">What is diffusion-limited aggregation?</h2>
        <p>
          Diffusion-limited aggregation (DLA) starts with a seed. A particle is released some distance away and takes
          a random walk until it bumps into the seed, where it sticks. Then another, and another. Colors here can show
          the order particles arrived, their distance from the seed, or how many links separate them from it along the
          branch.
        </p>

        <h2>Why it branches</h2>
        <p>
          A wandering particle is far more likely to hit the tip of an arm than to squeeze into a gap between arms, so
          tips grow faster and the gaps stay empty. This screening effect turns pure randomness into the branching
          shapes seen in lightning, mineral deposits (dendrites), frost on glass, coral, and electrodeposited metal.
          Try the bottom-edge seed to grow frost or a metal deposit, or add drift to bend the growth like wind.
        </p>

        <h2>A fractal dimension of about 1.7</h2>
        <p>
          A solid disk&apos;s mass grows like radius², and a line&apos;s like radius¹. A DLA cluster sits in between:
          its particle count grows like radius to the power of about 1.71, its fractal dimension. The mass–radius chart
          measures it from your cluster. On a square grid large clusters slowly grow along the grid axes, so measured
          values can wander between about 1.6 and 1.8.
        </p>

        <h2>Try this</h2>
        <p>
          Lower the stickiness so particles sometimes bounce off before sticking. They get time to slip into the
          gaps, and the cluster becomes denser and less branchy, with a higher dimension. Slow the speed down and
          turn on the wandering particle to see how long each one searches before it lands.
        </p>
      </section>

      <Faq items={FAQ} />
    </ToolPage>
  );
}

export default App;
