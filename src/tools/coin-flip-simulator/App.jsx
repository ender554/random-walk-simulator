import { useEffect, useMemo, useRef, useState } from 'react';
import ToolPage from '../../shared/ToolPage';
import { LogRangeControl, RangeControl, SeedControl, StatRow } from '../../shared/controls';
import { simulateRuns, typicalLongestStreak } from '../../utils/coinFlips';
import { PALETTE, SERIES, chartFrame, clipToPlot, evenTicks, powersOfTen } from '../../utils/chart';
import { exportCanvasPNG } from '../../utils/canvas';
import { randomSeed } from '../../utils/seed';

const pct = (v) => `${(v * 100).toFixed(2)}%`;

function draw(canvas, runs, flips, p) {
  if (!canvas) return;
  const frame = chartFrame(canvas, {
    xMin: 1, xMax: flips, yMin: 0, yMax: 1, logX: true,
    xTicks: powersOfTen(flips),
    yTicks: evenTicks(0, 1, 5),
    formatY: (v) => `${Math.round(v * 100)}%`,
    xLabel: 'Number of flips (log scale)',
  });
  const { ctx, x, y } = frame;
  clipToPlot(frame);

  // Band where the running share should fall about 95% of the time: p ± 2·sqrt(p(1-p)/n)
  ctx.fillStyle = 'rgba(255, 209, 102, 0.12)';
  ctx.beginPath();
  const ns = runs[0].points.map(([n]) => n);
  ns.forEach((n) => ctx.lineTo(x(n), y(Math.min(1, p + 2 * Math.sqrt((p * (1 - p)) / n)))));
  [...ns].reverse().forEach((n) => ctx.lineTo(x(n), y(Math.max(0, p - 2 * Math.sqrt((p * (1 - p)) / n)))));
  ctx.fill();

  ctx.strokeStyle = PALETTE.yellow;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(x(1), y(p));
  ctx.lineTo(x(flips), y(p));
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.lineWidth = 2;
  runs.forEach((run, i) => {
    ctx.strokeStyle = SERIES[i % SERIES.length];
    ctx.beginPath();
    for (const [n, share] of run.points) ctx.lineTo(x(n), y(share));
    ctx.stroke();
  });
  ctx.restore();
}

function App() {
  const canvasRef = useRef(null);
  const [flips, setFlips] = useState(10000);
  const [p, setP] = useState(0.5);
  const [runCount, setRunCount] = useState(5);
  const [seed, setSeed] = useState('heads');

  const runs = useMemo(() => simulateRuns({ flips, p, runs: runCount, seed }), [flips, p, runCount, seed]);

  const avgGap = runs.reduce((sum, r) => sum + Math.abs(r.heads / flips - p), 0) / runs.length;
  const expectedGap = Math.sqrt((p * (1 - p)) / flips) * Math.sqrt(2 / Math.PI);
  const avgCountGap = avgGap * flips;

  useEffect(() => {
    draw(canvasRef.current, runs, flips, p);
  }, [runs, flips, p]);

  return (
    <ToolPage
      slug="coin-flip-simulator"
      title="Coin Flip Simulator & Law of Large Numbers"
      intro="Flip up to a million coins and watch the share of heads settle toward 50%. See how fast it converges, why the gap in raw counts keeps growing, and how long streaks really get."
    >
      <section className="controls-panel" aria-label="Simulation settings">
        <div className="control-grid">
          <LogRangeControl id="flips-range" label="Flips per run" value={flips} minExp={1} maxExp={6} onChange={setFlips} />
          <RangeControl id="p-range" label="Chance of heads" display={`${Math.round(p * 100)}%`} value={p}
            min={0.05} max={0.95} step={0.01} onChange={setP} />
          <RangeControl id="runs-range" label="Runs" value={runCount} min={1} max={8} onChange={setRunCount} />
          <SeedControl value={seed} onChange={setSeed} />
        </div>

        <div className="button-row">
          <button type="button" onClick={() => setSeed(randomSeed())}>🎲 Flip again</button>
          <button type="button" onClick={() => exportCanvasPNG(canvasRef.current, 'coin-flips.png')}>Export PNG</button>
        </div>
      </section>

      <div className="canvas-wrapper chart-wrapper">
        <canvas
          ref={canvasRef}
          width={800}
          height={420}
          role="img"
          aria-label={`Running share of heads for ${runCount} runs of ${flips} flips, settling near ${Math.round(p * 100)}%.`}
        />
        <p className="chart-caption">
          Each colored line is one run. The dashed line is the true chance of heads, and the shaded band is where
          the share should be about 95% of the time.
        </p>
      </div>

      <section className="stats-panel">
        <h2>Results</h2>
        <div className="stats-grid">
          {runs.slice(0, 4).map((run, i) => (
            <StatRow
              key={i}
              label={`Run ${i + 1} heads:`}
              value={`${run.heads.toLocaleString()} (${pct(run.heads / flips)})`}
            />
          ))}
          <StatRow label="Average gap from true share:" value={pct(avgGap)} />
          <StatRow label="Theory, expected gap:" value={pct(expectedGap)} />
          <StatRow label="Average gap in heads count:" value={Math.round(avgCountGap).toLocaleString()} />
          <StatRow label="Longest heads streak (run 1):" value={runs[0].longestHeadsStreak} />
          <StatRow label="Theory, typical longest streak:" value={`≈ ${Math.max(1, typicalLongestStreak(flips, p)).toFixed(1)}`} />
        </div>
      </section>

      <section className="canvas-description prose" aria-labelledby="explain-heading">
        <h2 id="explain-heading">The law of large numbers</h2>
        <p>
          Flip a fair coin a few times and you might get 70% heads. Flip it ten thousand times and you will almost
          certainly be within a percent or two of 50%. The law of large numbers says that the share of heads gets
          closer and closer to the true probability as the number of flips grows. On the chart, every run starts out
          wild and then funnels into the shaded band.
        </p>

        <h2>The share converges, the count does not</h2>
        <p>
          The gap between the share of heads and 50% shrinks like 1/√n, but the gap in the raw count of heads versus
          tails grows like √n. After a million flips you might be 500 heads ahead and still be at 50.05%. The
          coin never &quot;corrects&quot; for a run of tails; earlier imbalances are simply diluted by later flips.
          Believing otherwise is the gambler&apos;s fallacy.
        </p>

        <h2>Streaks are longer than you think</h2>
        <p>
          In n fair flips, the longest run of heads is usually close to log₂ n. A hundred flips typically contain a
          streak of about six heads in a row, which is why made-up sequences, where people avoid long streaks, are
          easy to tell apart from real ones.
        </p>
      </section>
    </ToolPage>
  );
}

export default App;
