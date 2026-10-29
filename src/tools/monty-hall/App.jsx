import { useEffect, useMemo, useRef, useState } from 'react';
import ToolPage from '../../shared/ToolPage';
import ToolActions from '../../shared/ToolActions';
import Faq from '../../shared/Faq';
import Challenge from '../../shared/Challenge';
import { Legend, LogRangeControl, RangeControl, SeedControl, StatRow } from '../../shared/controls';
import { useUrlState } from '../../shared/useUrlState';
import { HOST_RULES, simulateGames, theory } from '../../utils/montyHall';
import { PALETTE, chartFrame, clipToPlot, evenTicks, powersOfTen } from '../../utils/chart';
import { downloadCSV } from '../../utils/export';
import { randomSeed } from '../../utils/seed';
import PlayGame from './PlayGame';
import PlayAsHost from './PlayAsHost';
import Race from './Race';
import './monty.css';

const DEFAULTS = { doors: 3, host: 'knows', games: 1000, seed: 'montyhall' };
const CHART_SIZE = { width: 800, height: 380 };
const pct = (v) => `${(v * 100).toFixed(1)}%`;

const FAQ = [
  {
    q: 'Why is switching 2/3 and not 50/50?',
    a: 'Your first pick is right 1 time in 3, and the host opening a goat door does not change that, because he always can. So staying wins 1/3 of the time. In the other 2/3 of games your first pick was a goat, the host is forced to leave the car closed, and switching wins. The two remaining doors are not equally likely because the host chose which one to leave closed.',
  },
  {
    q: 'Is the Monty Hall problem wrong?',
    a: 'No. The 2/3 answer is correct under the standard rules: the host knows where the car is, always opens a goat door, and always offers the switch. Run 10,000 simulated games above and switching wins about 66.7%. Disagreements usually come from changing those rules, for example a host who opens doors at random.',
  },
  {
    q: "Does it matter if the host knows where the car is?",
    a: "Yes. If the host opens a door at random and it happens to show a goat, switching and staying each win half the time. Choose \"Host doesn't know\" above: some games are thrown out because the host reveals the car, and among the rest the two strategies tie.",
  },
  {
    q: 'What happens with more doors?',
    a: 'With 100 doors you pick one, and the host opens 98 goat doors, leaving one other door closed. Your door had a 1 in 100 chance; the other door now carries the remaining 99 in 100. Switching wins (d − 1)/d of the time with d doors.',
  },
  {
    q: "Did this happen on Let's Make a Deal?",
    a: "The puzzle is named after Monty Hall, host of Let's Make a Deal, but the show did not follow these exact rules: Monty did not always open a door or offer a switch. The version above is the one Marilyn vos Savant answered in Parade magazine in 1990, which drew thousands of letters insisting she was wrong.",
  },
];

function drawChart(canvas, running, games, rule, doors) {
  if (!canvas || !running.length) return;
  const t = theory(rule, doors);
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
  for (const [value, color] of [[t.switch, PALETTE.cyan], [t.stay, PALETTE.pink]]) {
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

// Range the true win rate could plausibly be in, given a handful of games (±2 standard errors)
function plausibleRange({ plays, wins }) {
  const p = wins / plays;
  const margin = 2 * Math.sqrt((p * (1 - p) || 0.25) / plays);
  return `${Math.max(0, Math.round((p - margin) * 100))}% to ${Math.min(100, Math.round((p + margin) * 100))}%`;
}

function TallyRow({ label, tally }) {
  if (!tally.plays) return <StatRow label={label} value="not played yet" />;
  const rate = tally.wins / tally.plays;
  return (
    <div className="stat-row">
      <span>{label}</span>
      <span>
        {tally.wins} of {tally.plays} ({pct(rate)})
        {tally.plays < 100 && <small className="muted"> · could really be {plausibleRange(tally)}</small>}
      </span>
    </div>
  );
}

function App() {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const [settings, set, reset] = useUrlState(DEFAULTS);
  const { doors, host, games, seed } = settings;
  const [mode, setMode] = useState('play');
  const empty = { stay: { plays: 0, wins: 0 }, switch: { plays: 0, wins: 0 }, voided: 0 };
  const [tally, setTally] = useState(empty);

  const sim = useMemo(() => simulateGames({ games, doors, rule: host, seed }), [games, doors, host, seed]);
  const t = theory(host, doors);
  const draw = (canvas) => drawChart(canvas, sim.running, games, host, doors);

  useEffect(() => {
    draw(canvasRef.current);
  });

  const recordResult = (switched, won) => {
    if (switched === null) {
      setTally((s) => ({ ...s, voided: s.voided + 1 }));
      return;
    }
    const key = switched ? 'switch' : 'stay';
    setTally((s) => ({ ...s, [key]: { plays: s[key].plays + 1, wins: s[key].wins + (won ? 1 : 0) } }));
  };

  const exportCsv = () => {
    const rows = Array.from(sim.car, (car, g) => {
      const voided = sim.voided[g] === 1;
      return [g + 1, car + 1, sim.pick[g] + 1, sim.other[g] + 1, voided ? 1 : 0,
        voided ? '' : sim.pick[g] === car ? 1 : 0, voided ? '' : sim.other[g] === car ? 1 : 0];
    });
    downloadCSV(`monty-hall-${doors}-doors-${host}.csv`,
      ['game', 'car_door', 'first_pick', 'other_door_left_closed', 'thrown_out', 'stay_wins', 'switch_wins'], rows);
  };

  const playKey = `${doors}-${host}`;

  return (
    <ToolPage
      slug="monty-hall"
      title="Monty Hall Problem Simulator"
      intro="Three doors, one car, two goats. You pick a door, the host opens another to show a goat, and offers you the switch. Play it, play the host, race the two strategies, and change the host's rules to see exactly when switching stops helping."
    >
      <Challenge
        question="You pick a door, the host opens a goat door, and offers a switch. Out of 100 games, how many would you win by always switching?"
        placeholder="e.g. 50"
        unit="of 100"
        min={0}
        max={100}
        onTest={(guess) => {
          const testSeed = randomSeed();
          set('doors', 3);
          set('host', 'knows');
          set('games', 1000);
          set('seed', testSeed);
          const run = simulateGames({ games: 1000, doors: 3, rule: 'knows', seed: testSeed });
          const actual = (run.switchWins / run.counted) * 100;
          const off = Math.abs(guess - actual);
          return {
            verdict: off <= 5 ? '🎉 Spot on!' : off <= 15 ? 'Close!' : 'Not quite. Most people guess 50.',
            detail: `You guessed ${guess}. Always switching won ${actual.toFixed(1)} of every 100 games (${run.switchWins} of 1,000 simulated games, now on the chart below). Theory says 66.7: your first pick is right only 1 time in 3, and switching wins every time it was wrong.`,
          };
        }}
      />

      <section className="controls-panel" aria-label="Game settings">
        <div className="control-grid">
          <div className="control-row">
            <label htmlFor="host-select">Host rules</label>
            <select id="host-select" value={host} onChange={(e) => set('host', e.target.value)}>
              {Object.entries(HOST_RULES).map(([key, rule]) => <option key={key} value={key}>{rule.label}</option>)}
            </select>
          </div>
          <RangeControl id="doors-range" label="Doors" value={doors} min={3} max={100} onChange={(v) => set('doors', v)} />
          <LogRangeControl id="games-range" label="Games to simulate" value={games} minExp={1} maxExp={5} onChange={(v) => set('games', v)} />
          <SeedControl value={seed} onChange={(v) => set('seed', v)} />
        </div>
        <div className="preset-row" role="group" aria-label="Door presets">
          {[3, 10, 100].map((d) => (
            <button key={d} type="button" aria-pressed={doors === d} onClick={() => set('doors', d)}>{d} doors</button>
          ))}
        </div>
        <p className="chart-caption">The host {HOST_RULES[host].short}.</p>
        <ToolActions
          image={{ draw, size: CHART_SIZE, filename: 'monty-hall.png' }}
          onCsv={exportCsv}
          csvLabel="Download games (CSV)"
          onReset={() => { reset(); setTally(empty); }}
          fullscreenRef={chartRef}
        >
          <button type="button" onClick={() => set('seed', randomSeed())}>🎲 New simulation</button>
        </ToolActions>
      </section>

      <section className="monty-play" aria-labelledby="play-heading">
        <h2 id="play-heading">Play it yourself</h2>
        <div className="mode-tabs" role="group" aria-label="Play mode">
          <button type="button" aria-pressed={mode === 'play'} onClick={() => setMode('play')}>Be the contestant</button>
          <button type="button" aria-pressed={mode === 'host'} onClick={() => setMode('host')}>Be the host</button>
        </div>
        {mode === 'play' ? (
          <>
            <PlayGame key={playKey} doors={doors} rule={host} onResult={recordResult} />
            <div className="tally">
              <TallyRow label="When you stayed:" tally={tally.stay} />
              <TallyRow label="When you switched:" tally={tally.switch} />
              {tally.voided > 0 && <StatRow label="Thrown out (host showed the car):" value={tally.voided} />}
            </div>
          </>
        ) : (
          <PlayAsHost key={doors} doors={doors} />
        )}
      </section>

      <section className="panel" aria-labelledby="race-heading">
        <h2 id="race-heading">Race: always stay vs. always switch</h2>
        <Race key={`${playKey}-${games}-${seed}`} sim={sim} games={games} />
      </section>

      <div className="canvas-wrapper chart-wrapper" ref={chartRef}>
        <h2 className="chart-title">Win rate over {games.toLocaleString()} simulated games with {doors} doors</h2>
        <canvas
          ref={canvasRef}
          width={CHART_SIZE.width}
          height={CHART_SIZE.height}
          role="img"
          aria-label={`Switching won ${pct(sim.switchWins / sim.counted)} and staying won ${pct(sim.stayWins / sim.counted)} of ${sim.counted} counted games.`}
        />
        <Legend items={[{ color: PALETTE.cyan, label: 'Always switch' }, { color: PALETTE.pink, label: 'Always stay' }]} />
        <p className="chart-caption">Dashed lines show the theoretical win rates for these host rules.</p>
      </div>

      <section className="panel" aria-labelledby="cases-heading">
        <h2 id="cases-heading">Why: every simulated game, sorted by your first pick</h2>
        <table className="case-table">
          <thead>
            <tr><th>Your first pick was…</th><th>Games</th><th>Staying wins</th><th>Switching wins</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>the car (should be about 1 in {doors})</td>
              <td>{sim.pickedCar.toLocaleString()} ({pct(sim.pickedCar / sim.counted)})</td>
              <td>all of them</td>
              <td>none</td>
            </tr>
            <tr>
              <td>a goat (about {doors - 1} in {doors})</td>
              <td>{sim.pickedGoat.toLocaleString()} ({pct(sim.pickedGoat / sim.counted)})</td>
              <td>none</td>
              <td>{host === 'random' ? 'all of them (the host was lucky not to show the car)' : 'all of them: the host had to leave the car closed'}</td>
            </tr>
            {sim.voidedCount > 0 && (
              <tr>
                <td>any door, but the host showed the car</td>
                <td>{sim.voidedCount.toLocaleString()} thrown out</td>
                <td colSpan={2}>Throwing these out removes mostly &quot;picked a goat&quot; games, which is why the odds even out.</td>
              </tr>
            )}
          </tbody>
        </table>
        {host === 'lazy' && doors === 3 && sim.passedOver > 0 && (
          <p className="result-line">
            When the lazy host skipped the lower door and opened the higher one ({sim.passedOver.toLocaleString()} games),
            switching won <strong>{pct(sim.passedOverSwitchWins / sim.passedOver)}</strong>: he only does that when the lower
            door hides the car. When he opened the lower door, switching won{' '}
            <strong>{pct((sim.switchWins - sim.passedOverSwitchWins) / (sim.counted - sim.passedOver))}</strong>.
          </p>
        )}
      </section>

      <section className="stats-panel">
        <h2>Simulation results</h2>
        <div className="stats-grid">
          <StatRow label="Switching won:" value={`${sim.switchWins.toLocaleString()} (${pct(sim.switchWins / sim.counted)})`} />
          <StatRow label="Theory, switching:" value={pct(t.switch)} />
          <StatRow label="Staying won:" value={`${sim.stayWins.toLocaleString()} (${pct(sim.stayWins / sim.counted)})`} />
          <StatRow label="Theory, staying:" value={pct(t.stay)} />
          {host === 'random' && <StatRow label="Thrown out (car shown):" value={`${sim.voidedCount.toLocaleString()} (theory ${pct(t.voided)})`} />}
        </div>
      </section>

      <section className="canvas-description prose" aria-labelledby="explain-heading">
        <h2 id="explain-heading">The Monty Hall problem</h2>
        <p>
          The puzzle comes from the game show Let&apos;s Make a Deal and became famous in 1990, when Marilyn vos Savant
          answered it in Parade magazine and thousands of readers, many with math degrees, wrote in to say she was
          wrong. She was right: switching wins 2/3 of the time. Even the mathematician Paul Erdős reportedly stayed
          unconvinced until he saw a simulation.
        </p>

        <h2>Why switching wins</h2>
        <p>
          Your first pick is right 1 time in 3, and nothing the host does changes that. The host knows where the car
          is and always opens a goat door, so when your first pick was wrong (2 times in 3), the one door left closed
          must be the car. The table above sorts your simulated games exactly this way.
        </p>

        <h2>Your door versus all the others</h2>
        <p>
          Another way to see it: switching is like trading your one door for all the other doors at once. The host
          opening goats from that group doesn&apos;t change the group&apos;s 2/3 chance; it just tells you which
          door in the group to take. The numbers on the doors while you play show this happening.
        </p>

        <h2>Play the host</h2>
        <p>
          In &quot;Be the host&quot; mode you know where the car is. Notice that most of the time you have no choice
          about which door to leave closed: you must keep the car hidden. Those forced rounds are exactly the ones
          where the contestant should switch.
        </p>

        <h2>The host&apos;s rules matter</h2>
        <p>
          The 2/3 answer depends on the host knowing where the car is and always revealing a goat. If the host opens a
          door at random and happens to show a goat, switching and staying each win half the time. A lazy host who
          always opens the lowest-numbered goat door still gives switching a 2/3 overall win rate, but which door he
          opens can tell you even more.
        </p>

        <h2>Don&apos;t trust a handful of games</h2>
        <p>
          After a dozen games, staying can easily look as good as switching. Your tally shows the range the true win
          rate could be in; it takes about a hundred games for the 2/3 pattern to stand out. Use the race or the
          simulation to play thousands.
        </p>
      </section>

      <Faq items={FAQ} />
    </ToolPage>
  );
}

export default App;
