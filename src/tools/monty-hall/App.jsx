import { useEffect, useMemo, useRef, useState } from 'react';
import ToolPage from '../../shared/ToolPage';
import { Legend, LogRangeControl, RangeControl, SeedControl, StatRow } from '../../shared/controls';
import { simulateGames, switchWinChance } from '../../utils/montyHall';
import { PALETTE, chartFrame, clipToPlot, evenTicks, powersOfTen } from '../../utils/chart';
import { exportCanvasPNG } from '../../utils/canvas';
import { randomSeed } from '../../utils/seed';
import PlayGame from './PlayGame';
import './monty.css';

const pct = (v) => `${(v * 100).toFixed(1)}%`;
const rate = ({ plays, wins }) => (plays ? `${wins} of ${plays} (${pct(wins / plays)})` : 'not played yet');

function draw(canvas, running, games, doors) {
  if (!canvas) return;
  const frame = chartFrame(canvas, {
    xMin: 1, xMax: games, yMin: 0, yMax: 1, logX: true,
    xTicks: powersOfTen(games),
    yTicks: evenTicks(0, 1, 5),
    formatY: (v) => `${Math.round(v * 100)}%`,
    xLabel: 'Games played (log scale)',
  });
  const { ctx, x, y } = frame;
  clipToPlot(frame);

  ctx.setLineDash([6, 5]);
  ctx.lineWidth = 1.5;
  for (const [value, color] of [[switchWinChance(doors), PALETTE.cyan], [1 / doors, PALETTE.pink]]) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x(1), y(value));
    ctx.lineTo(x(games), y(value));
    ctx.stroke();
  }
  ctx.setLineDash([]);

  ctx.lineWidth = 2.5;
  for (const [index, color] of [[2, PALETTE.cyan], [1, PALETTE.pink]]) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    for (const point of running) ctx.lineTo(x(point[0]), y(point[index]));
    ctx.stroke();
  }
  ctx.restore();
}

function App() {
  const canvasRef = useRef(null);
  const [doors, setDoors] = useState(3);
  const [games, setGames] = useState(1000);
  const [seed, setSeed] = useState('montyhall');
  const [tally, setTally] = useState({ stay: { plays: 0, wins: 0 }, switch: { plays: 0, wins: 0 } });

  const sim = useMemo(() => simulateGames({ games, doors, seed }), [games, doors, seed]);

  useEffect(() => {
    draw(canvasRef.current, sim.running, games, doors);
  }, [sim, games, doors]);

  const recordResult = (switched, won) => {
    const key = switched ? 'switch' : 'stay';
    setTally((t) => ({ ...t, [key]: { plays: t[key].plays + 1, wins: t[key].wins + (won ? 1 : 0) } }));
  };

  return (
    <ToolPage
      slug="monty-hall"
      title="Monty Hall Problem Simulator"
      intro="Three doors, one car, two goats. You pick a door, the host opens another to reveal a goat, and offers you the chance to switch. Play it yourself, then run thousands of games to see why switching wins two times out of three."
    >
      <section className="controls-panel" aria-label="Game settings">
        <div className="control-grid">
          <RangeControl id="doors-range" label="Doors" value={doors} min={3} max={10} onChange={setDoors} />
          <LogRangeControl id="games-range" label="Games to simulate" value={games} minExp={1} maxExp={5} onChange={setGames} />
          <SeedControl value={seed} onChange={setSeed} />
        </div>
        <div className="button-row">
          <button type="button" onClick={() => setSeed(randomSeed())}>🎲 New simulation</button>
          <button type="button" onClick={() => exportCanvasPNG(canvasRef.current, 'monty-hall.png')}>Export PNG</button>
        </div>
      </section>

      <section className="monty-play" aria-labelledby="play-heading">
        <h2 id="play-heading">Play it yourself</h2>
        <PlayGame key={doors} doors={doors} onResult={recordResult} />
        <div className="tally">
          <StatRow label="When you stayed:" value={rate(tally.stay)} />
          <StatRow label="When you switched:" value={rate(tally.switch)} />
        </div>
      </section>

      <div className="canvas-wrapper chart-wrapper">
        <h2 className="chart-title">
          Win rate over {games.toLocaleString()} simulated games with {doors} doors
        </h2>
        <canvas
          ref={canvasRef}
          width={800}
          height={380}
          role="img"
          aria-label={`Switching won ${pct(sim.switchWins / games)} and staying won ${pct(sim.stayWins / games)} of ${games} games.`}
        />
        <Legend
          items={[
            { color: PALETTE.cyan, label: 'Always switch' },
            { color: PALETTE.pink, label: 'Always stay' },
          ]}
        />
      </div>

      <section className="stats-panel">
        <h2>Simulation results</h2>
        <div className="stats-grid">
          <StatRow label="Switching won:" value={`${sim.switchWins.toLocaleString()} (${pct(sim.switchWins / games)})`} />
          <StatRow label="Theory, switching:" value={pct(switchWinChance(doors))} />
          <StatRow label="Staying won:" value={`${sim.stayWins.toLocaleString()} (${pct(sim.stayWins / games)})`} />
          <StatRow label="Theory, staying:" value={pct(1 / doors)} />
        </div>
      </section>

      <section className="canvas-description prose" aria-labelledby="explain-heading">
        <h2 id="explain-heading">The Monty Hall problem</h2>
        <p>
          The puzzle comes from the game show Let&apos;s Make a Deal and became famous in 1990, when Marilyn vos Savant
          answered it in Parade magazine and thousands of readers, many with math degrees, wrote in to say she was
          wrong. She was right: switching wins 2/3 of the time.
        </p>

        <h2>Why switching wins</h2>
        <p>
          Your first pick is right 1 time in 3, and nothing the host does changes that. The host knows where the car
          is and always opens a goat door, so when your first pick was wrong (2 times in 3), the one door left closed
          must be the car. Staying wins only when your first guess was right; switching wins every time it was wrong.
        </p>

        <h2>More doors make it obvious</h2>
        <p>
          Set the doors to 10. You pick one, and the host opens 8 goat doors, leaving just one other door closed.
          Your first pick had a 1 in 10 chance, so the other door has the remaining 9 in 10. The same logic is
          hiding in the three-door version.
        </p>

        <h2>The host&apos;s knowledge matters</h2>
        <p>
          The 2/3 answer depends on the host knowing where the car is and always revealing a goat. If the host opened
          a door at random and happened to show a goat, switching and staying would each win half the time.
        </p>
      </section>
    </ToolPage>
  );
}

export default App;
