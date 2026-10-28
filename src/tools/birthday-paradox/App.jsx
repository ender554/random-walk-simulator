import { useEffect, useMemo, useRef, useState } from 'react';
import ToolPage from '../../shared/ToolPage';
import { Legend, RangeControl, SeedControl, StatRow } from '../../shared/controls';
import { MONTHS, dayLabel, sharedChance, simulateRooms, smallestGroupFor } from '../../utils/birthdays';
import { PALETTE, chartFrame, clipToPlot, evenTicks } from '../../utils/chart';
import { exportCanvasPNG } from '../../utils/canvas';
import { randomSeed } from '../../utils/seed';
import './birthday.css';

const MAX_PEOPLE = 100;
const pct = (v) => `${(v * 100).toFixed(1)}%`;

function draw(canvas, people, simulated) {
  if (!canvas) return;
  const frame = chartFrame(canvas, {
    xMin: 1, xMax: MAX_PEOPLE, yMin: 0, yMax: 1,
    xTicks: [1, 23, 50, 75, 100],
    yTicks: evenTicks(0, 1, 5),
    formatY: (v) => `${Math.round(v * 100)}%`,
    xLabel: 'People in the room',
  });
  const { ctx, x, y } = frame;
  clipToPlot(frame);

  ctx.strokeStyle = PALETTE.muted;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(x(1), y(0.5));
  ctx.lineTo(x(MAX_PEOPLE), y(0.5));
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = PALETTE.cyan;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let n = 1; n <= MAX_PEOPLE; n += 1) ctx.lineTo(x(n), y(sharedChance(n)));
  ctx.stroke();

  ctx.strokeStyle = PALETTE.yellow;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x(people), y(0));
  ctx.lineTo(x(people), y(1));
  ctx.stroke();

  ctx.fillStyle = PALETTE.yellow;
  ctx.beginPath();
  ctx.arc(x(people), y(simulated), 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function Calendar({ room }) {
  const counts = new Map();
  for (const day of room) counts.set(day, (counts.get(day) ?? 0) + 1);
  const shared = [...counts].filter(([, c]) => c > 1).sort((a, b) => a[0] - b[0]);

  return (
    <>
      <div className="calendar" aria-hidden="true">
        {MONTHS.map(([name, length], m) => {
          const monthStart = MONTHS.slice(0, m).reduce((sum, [, days]) => sum + days, 0);
          const cells = [];
          for (let d = 0; d < 31; d += 1) {
            if (d >= length) {
              cells.push(<span key={d} className="day blank" />);
              continue;
            }
            const c = counts.get(monthStart + d) ?? 0;
            cells.push(
              <span key={d} className={`day${c > 1 ? ' shared' : c === 1 ? ' taken' : ''}`} title={`${name} ${d + 1}`} />,
            );
          }
          return (
            <div key={name} className="month">
              <span className="month-name">{name}</span>
              {cells}
            </div>
          );
        })}
      </div>
      <p className="chart-caption">
        {shared.length
          ? `Shared birthdays in this room: ${shared.map(([day, c]) => `${dayLabel(day)} (${c} people)`).join(', ')}.`
          : 'Nobody in this room shares a birthday.'}
      </p>
    </>
  );
}

function App() {
  const canvasRef = useRef(null);
  const [people, setPeople] = useState(23);
  const [trials, setTrials] = useState(2000);
  const [seed, setSeed] = useState('birthday');

  const sim = useMemo(() => simulateRooms({ people, trials, seed }), [people, trials, seed]);
  const exact = sharedChance(people);
  const simulated = sim.hits / trials;
  const pairs = (people * (people - 1)) / 2;

  useEffect(() => {
    draw(canvasRef.current, people, simulated);
  }, [people, simulated]);

  return (
    <ToolPage
      slug="birthday-paradox"
      title="Birthday Paradox Calculator"
      intro="How many people need to be in a room before two of them probably share a birthday? Only 23. Check the exact odds for any group size and fill thousands of random rooms to see it happen."
    >
      <section className="controls-panel" aria-label="Simulation settings">
        <div className="control-grid">
          <RangeControl id="people-range" label="People in the room" value={people} min={2} max={MAX_PEOPLE} onChange={setPeople} />
          <RangeControl id="trials-range" label="Random rooms to simulate" display={trials.toLocaleString()} value={trials}
            min={100} max={10000} step={100} onChange={setTrials} />
          <SeedControl value={seed} onChange={setSeed} />
        </div>
        <div className="button-row">
          <button type="button" onClick={() => setSeed(randomSeed())}>🎲 New rooms</button>
          <button type="button" onClick={() => exportCanvasPNG(canvasRef.current, 'birthday-paradox.png')}>Export PNG</button>
        </div>
      </section>

      <section className="stats-panel">
        <h2>With {people} people</h2>
        <div className="stats-grid">
          <StatRow label="Exact chance of a shared birthday:" value={pct(exact)} />
          <StatRow label={`Rooms with a match (of ${trials.toLocaleString()}):`} value={`${sim.hits.toLocaleString()} (${pct(simulated)})`} />
          <StatRow label="Pairs of people:" value={pairs.toLocaleString()} />
          <StatRow label="People needed for 50%:" value={smallestGroupFor(0.5)} />
          <StatRow label="People needed for 99%:" value={smallestGroupFor(0.99)} />
        </div>
      </section>

      <div className="canvas-wrapper chart-wrapper">
        <h2 className="chart-title">Chance of a shared birthday by group size</h2>
        <canvas
          ref={canvasRef}
          width={800}
          height={380}
          role="img"
          aria-label={`Chance of a shared birthday rises from 0 to nearly 100% between 1 and 100 people; with ${people} people it is ${pct(exact)}.`}
        />
        <Legend
          items={[
            { color: PALETTE.cyan, label: 'Exact chance' },
            { color: PALETTE.yellow, label: 'Your simulated rooms' },
          ]}
        />
      </div>

      <div className="canvas-wrapper chart-wrapper">
        <h2 className="chart-title">One random room of {people}</h2>
        <Calendar room={sim.sampleRoom} />
      </div>

      <section className="canvas-description prose" aria-labelledby="explain-heading">
        <h2 id="explain-heading">Why 23 people is enough</h2>
        <p>
          Most people guess you would need around 180 people, half of 365. The trick is that the question is about
          any two people matching, not someone matching you. In a room of 23 there are 253 different pairs, and each
          pair has a 1 in 365 chance of sharing a birthday. With that many chances, a match becomes more likely than
          not: about 50.7%.
        </p>

        <h2>The exact formula</h2>
        <p>
          It is easier to work out the chance that everyone&apos;s birthday is different. The second person must
          miss the first (364/365), the third must miss both (363/365), and so on. Multiply those together and
          subtract from 1: P(match) = 1 − (365 × 364 × … × (365 − n + 1)) / 365ⁿ. By 57 people the chance passes 99%,
          and by 70 it is 99.9%.
        </p>

        <h2>Where it shows up</h2>
        <p>
          The same math explains hash collisions in computer science and the &quot;birthday attack&quot; on
          cryptographic signatures: collisions among n random values become likely after only about √n of them. The
          calculation assumes 365 equally likely birthdays and ignores leap days; real birthdays are slightly uneven,
          which makes matches a little more likely, not less.
        </p>
      </section>
    </ToolPage>
  );
}

export default App;
