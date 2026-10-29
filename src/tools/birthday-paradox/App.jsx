import { useEffect, useMemo, useRef, useState } from 'react';
import ToolPage from '../../shared/ToolPage';
import ToolActions from '../../shared/ToolActions';
import Faq from '../../shared/Faq';
import Challenge from '../../shared/Challenge';
import { Legend, LogRangeControl, RangeControl, SeedControl, StatRow } from '../../shared/controls';
import { useUrlState } from '../../shared/useUrlState';
import {
  QUESTIONS, SPACES, canSimulate, parseBirthdays, peopleNeeded, probability, simulateRooms,
} from '../../utils/birthdays';
import { PALETTE, chartFrame, clipToPlot, evenTicks, powersOfTen } from '../../utils/chart';
import { downloadCSV } from '../../utils/export';
import { randomSeed } from '../../utils/seed';
import Calendar from './Calendar';
import { drawRoom } from './drawRoom';
import './birthday.css';

const DEFAULTS = { q: 'anyTwo', space: 'birthdays', custom: 1000, people: 23, window: 1, trials: 2000, seed: 'birthday' };
const CHART_SIZE = { width: 800, height: 380 };
const pct = (v) => (v > 0 && v < 0.001 ? '<0.1%' : v > 0.999 && v < 1 ? '>99.9%' : `${(v * 100).toFixed(1)}%`);
const oneIn = (v) => (v > 0 && v < 0.5 ? ` (1 in ${Math.round(1 / v).toLocaleString()})` : '');

const FAQ = [
  {
    q: 'Why does a room of only 23 people give a 50% chance?',
    a: 'Because the question is about any two people matching, not someone matching you. 23 people make 253 different pairs, and each pair has a 1 in 365 chance of sharing a birthday. With that many chances, a match becomes slightly more likely than not: 50.7%.',
  },
  {
    q: 'What is the birthday paradox formula?',
    a: 'It is easier to compute the chance that everyone is different: 365/365 × 364/365 × 363/365 × … for n people. Subtract that from 1: P(match) = 1 − 365! / ((365 − n)! · 365ⁿ). A good approximation is 1 − e^(−n(n−1)/730).',
  },
  {
    q: 'What is the chance that someone shares my birthday?',
    a: 'Much lower: 1 − (364/365)^(n−1). In a room of 23 it is only about 6%, and you need 253 other people for a 50% chance. This is the most common mix-up with the birthday paradox.',
  },
  {
    q: 'How many people do you need for 99% or 100%?',
    a: '57 people give a 99% chance and 70 give 99.9%. To be certain you need 366 people (367 counting February 29): with more people than days, two must share by the pigeonhole principle.',
  },
  {
    q: 'What does the birthday paradox have to do with hashing and cryptography?',
    a: 'Collisions among N possible values become likely after only about 1.18·√N items. A 32-bit hash has about 4.3 billion values, but you expect a collision after roughly 77,000 items. Attacks that exploit this are called birthday attacks; choose a hash preset above to see the numbers.',
  },
  {
    q: 'Do real birthdays change the answer?',
    a: 'Slightly, and in the direction of more matches. Real birthdays are not evenly spread (some months and days are more common), and any unevenness makes shared birthdays more likely than the uniform 365-day calculation says.',
  },
];

function drawChart(canvas, { question, size, window, people, maxPeople, simulated }) {
  if (!canvas) return;
  const logX = maxPeople > 1000;
  const frame = chartFrame(canvas, {
    xMin: 1, xMax: maxPeople, yMin: 0, yMax: 1, logX,
    xTicks: logX ? powersOfTen(maxPeople) : evenTicks(1, maxPeople, 5).map(Math.round),
    yTicks: evenTicks(0, 1, 5),
    formatY: (v) => `${Math.round(v * 100)}%`,
    xLabel: logX ? 'Group size (log scale)' : 'Group size',
  });
  const { ctx, x, y } = frame;
  clipToPlot(frame);

  ctx.strokeStyle = PALETTE.muted;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(x(1), y(0.5));
  ctx.lineTo(x(maxPeople), y(0.5));
  ctx.stroke();
  ctx.setLineDash([]);

  const curve = (q, color, width) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    // Whole numbers of people, so the curve joins real values instead of rounding into steps
    const steps = 300;
    const points = logX
      ? [...new Set(Array.from({ length: steps + 1 }, (_, i) => Math.round(maxPeople ** (i / steps))))]
      : Array.from({ length: maxPeople }, (_, i) => i + 1);
    for (const n of points) ctx.lineTo(x(n), y(probability(q, n, size, window)));
    ctx.stroke();
  };
  if (question !== 'anyTwo') curve('anyTwo', 'rgba(138, 150, 179, 0.7)', 1.5);
  curve(question, PALETTE.cyan, 2.5);

  ctx.strokeStyle = PALETTE.yellow;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x(people), y(0));
  ctx.lineTo(x(people), y(1));
  ctx.stroke();
  if (Number.isFinite(simulated)) {
    ctx.fillStyle = PALETTE.yellow;
    ctx.beginPath();
    ctx.arc(x(people), y(simulated), 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function ClassBirthdays({ size }) {
  const [text, setText] = useState('');
  const { days, bad } = parseBirthdays(text);
  const chance = days.length > 1 ? probability('anyTwo', days.length, size) : 0;

  return (
    <section className="panel" aria-labelledby="class-heading">
      <h2 id="class-heading">Try it with your class</h2>
      <p className="chart-caption">
        Paste or type birthdays, one per line or separated by commas, for example &quot;Mar 14&quot;, &quot;3/14&quot;
        or &quot;14 March&quot;. Nothing leaves your browser.
      </p>
      <label className="visually-hidden" htmlFor="class-input">Class birthdays</label>
      <textarea
        id="class-input"
        className="class-input"
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={'Mar 14\nJul 4\n12/25'}
      />
      {days.length > 0 && (
        <>
          <p className="result-line" aria-live="polite">
            {days.length} birthdays entered. For a group this size the chance of a shared birthday is{' '}
            <strong>{pct(chance)}</strong>.
            {bad.length > 0 && ` Couldn't read: ${bad.slice(0, 5).join(', ')}${bad.length > 5 ? '…' : ''}.`}
          </p>
          <Calendar days={days} emptyText="No shared birthdays in this group." />
        </>
      )}
    </section>
  );
}

function App() {
  const chartRef = useRef(null);
  const roomRef = useRef(null);
  const chartWrapRef = useRef(null);
  const [settings, set, reset] = useUrlState(DEFAULTS);
  const { q: question, people, window, trials, seed } = settings;
  const space = SPACES.find((s) => s.key === settings.space);
  const size = space ? space.size : Math.max(2, Math.round(settings.custom));
  const isCalendar = size === 365 || size === 366;

  const maxPeople = useMemo(() => {
    const needed = peopleNeeded(question, 0.999, size, window);
    return Math.max(10, Math.min(Number.isFinite(needed) ? Math.ceil(needed * 1.2) : 1e10, question === 'three' ? 2 * size : 1e12));
  }, [question, size, window]);
  const n = Math.min(people, maxPeople);

  const exact = probability(question, n, size, window);
  const simulatable = canSimulate(size, n, trials);
  const sim = useMemo(
    () => simulateRooms({ question, people: n, size, window, trials, seed }),
    [question, n, size, window, trials, seed],
  );
  const simulated = simulatable ? sim.hits / trials : NaN;
  const [roomSize, setRoomSize] = useState(null); // null = whole room
  const roomPeople = sim.sampleRoom.slice(0, roomSize ?? Math.min(n, 120));

  const [target, setTarget] = useState('50');
  const targetValue = Math.min(99.999, Math.max(0.001, Number(target) || 50)) / 100;
  const needed = peopleNeeded(question, targetValue, size, window);

  const draw = (canvas) => drawChart(canvas, { question, size, window, people: n, maxPeople, simulated });
  useEffect(() => {
    draw(chartRef.current);
    if (sim.sampleRoom.length) drawRoom(roomRef.current, roomPeople);
  });

  const exportCsv = () => {
    const limit = Math.min(maxPeople, 2000);
    const rows = [];
    for (let k = 1; k <= limit; k += 1) {
      rows.push([
        k,
        probability('anyTwo', k, size),
        probability('mine', k, size),
        size <= 5000 ? probability('three', k, size) : '',
        probability('near', k, size, window),
      ]);
    }
    downloadCSV(`birthday-paradox-${size}.csv`, ['people', 'any_two_share', 'someone_shares_mine', 'three_share', `within_${window}_days`], rows);
  };

  const unit = isCalendar ? 'birthday' : 'value';
  const GENERIC = { anyTwo: 'two items share a value (a collision)', mine: 'another item matches one specific value', three: 'three items share a value', near: 'two values fall within the window' };
  const shortText = isCalendar ? QUESTIONS[question].short : GENERIC[question];
  return (
    <ToolPage
      slug="birthday-paradox"
      title="Birthday Paradox Calculator"
      intro="How many people need to be in a room before two of them probably share a birthday? Fewer than you think. Get exact odds for any group, for your own birthday, for three people or near-birthdays, and for hash collisions, then check them against thousands of random rooms or your own class."
    >
      <Challenge
        question="How many people need to be in a room for a better than even chance that two of them share a birthday?"
        placeholder="e.g. 180"
        unit="people"
        min={2}
        max={400}
        onTest={(guess) => {
          const people = Math.round(guess);
          set('q', 'anyTwo');
          set('space', 'birthdays');
          set('people', Math.min(people, 100));
          set('seed', randomSeed());
          setRoomSize(null);
          const chance = probability('anyTwo', people, 365);
          return {
            verdict: people === 23 ? '🎉 Exactly right!' : Math.abs(people - 23) <= 3 ? 'Very close!' : people > 23 ? 'Fewer than that!' : 'A few more than that.',
            detail: `With ${people} people the chance is ${chance >= 0.999 && people < 366 ? "over 99.9%" : pct(chance)}${people <= 100 ? ' (the calculator below is now set to your guess)' : ''}. The answer is 23 people, for 50.7%: 23 people make 253 pairs, and each pair is a 1 in 365 chance.`,
          };
        }}
      />

      <section className="controls-panel" aria-label="Calculator settings">
        <div className="control-grid">
          <div className="control-row">
            <label htmlFor="question-select">Question</label>
            <select id="question-select" value={question} onChange={(e) => set('q', e.target.value)}>
              {Object.entries(QUESTIONS).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
            </select>
          </div>
          <div className="control-row">
            <label htmlFor="space-select">Possible values</label>
            <select id="space-select" value={settings.space} onChange={(e) => set('space', e.target.value)}>
              {SPACES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              <option value="custom">Custom number…</option>
            </select>
          </div>
          {settings.space === 'custom' && (
            <div className="control-row">
              <label htmlFor="custom-size">Number of possible values</label>
              <input id="custom-size" type="number" min="2" value={settings.custom} onChange={(e) => set('custom', Number(e.target.value))} />
            </div>
          )}
          {maxPeople > 1000 ? (
            <LogRangeControl id="people-range" label="People (or items)" value={Math.max(2, n)} minExp={0.31}
              maxExp={Math.log10(maxPeople)} onChange={(v) => { set('people', Math.max(2, v)); setRoomSize(null); }} />
          ) : (
            <RangeControl id="people-range" label="People in the room" value={n} min={2} max={maxPeople}
              onChange={(v) => { set('people', v); setRoomSize(null); }} />
          )}
          {question === 'near' && (
            <RangeControl id="window-range" label="Within how many days" value={window} min={0} max={7}
              display={window === 0 ? 'same day' : `±${window} day${window > 1 ? 's' : ''}`} onChange={(v) => set('window', v)} />
          )}
          <RangeControl id="trials-range" label="Random rooms to simulate" display={trials.toLocaleString()} value={trials}
            min={100} max={10000} step={100} onChange={(v) => set('trials', v)} />
          <SeedControl value={seed} onChange={(v) => set('seed', v)} />
        </div>
        <ToolActions
          image={{ draw, size: CHART_SIZE, filename: 'birthday-paradox.png' }}
          onCsv={exportCsv}
          csvLabel="Download probability table (CSV)"
          onReset={() => { reset(); setRoomSize(null); }}
          fullscreenRef={chartWrapRef}
        >
          <button type="button" onClick={() => set('seed', randomSeed())}>🎲 New rooms</button>
        </ToolActions>
      </section>

      <section className="stats-panel" aria-live="polite">
        <h2>With {n.toLocaleString()} {isCalendar ? 'people' : 'items'}</h2>
        <div className="stats-grid">
          <StatRow label={`Exact chance that ${shortText}:`} value={`${pct(exact)}${oneIn(exact)}`} />
          <StatRow
            label={`Simulated rooms with a match (of ${trials.toLocaleString()}):`}
            value={simulatable ? `${sim.hits.toLocaleString()} (${pct(simulated)})` : 'exact math only above a million values'}
          />
          <StatRow label="Pairs of people:" value={((n * (n - 1)) / 2).toLocaleString()} />
          {question !== 'anyTwo' && <StatRow label="For comparison, any two share:" value={pct(probability('anyTwo', n, size))} />}
          {question !== 'mine' && <StatRow label="Someone shares a specific one:" value={pct(probability('mine', n, size))} />}
        </div>
      </section>

      <section className="panel" aria-labelledby="reverse-heading">
        <h2 id="reverse-heading">How many people do I need?</h2>
        <div className="inline-fields">
          <label>
            For a chance of (%)
            <input type="number" min="0.001" max="99.999" step="any" value={target} onChange={(e) => setTarget(e.target.value)} />
          </label>
        </div>
        <p className="result-line" aria-live="polite">
          You need <strong>{Number.isFinite(needed) ? needed.toLocaleString() : 'more than 10 trillion'}</strong>{' '}
          {isCalendar ? 'people' : 'items'} for a {pct(targetValue)} chance that {shortText}
          {question === 'mine' ? ' (counting you)' : ''}, with {size.toLocaleString()} possible {unit}s.
        </p>
      </section>

      <div className="canvas-wrapper chart-wrapper" ref={chartWrapRef}>
        <h2 className="chart-title">Chance by group size: {QUESTIONS[question].label.toLowerCase()}</h2>
        <canvas ref={chartRef} width={CHART_SIZE.width} height={CHART_SIZE.height} role="img"
          aria-label={`Probability curve; with ${n} people the chance is ${pct(exact)}.`} />
        <Legend
          items={[
            { color: PALETTE.cyan, label: 'Exact chance' },
            ...(question !== 'anyTwo' ? [{ color: PALETTE.muted, label: 'Any two share (for comparison)' }] : []),
            ...(simulatable ? [{ color: PALETTE.yellow, label: 'Your simulated rooms' }] : []),
          ]}
        />
      </div>

      {sim.sampleRoom.length > 0 && (
        <div className="canvas-wrapper chart-wrapper square-chart">
          <h2 className="chart-title">One random room: every line is a pair that could match</h2>
          <div className="button-row">
            <button type="button" onClick={() => setRoomSize(0)}>Empty the room</button>
            <button type="button" onClick={() => setRoomSize((k) => Math.min(sim.sampleRoom.length, (k ?? 0) + 1))}>+1 person</button>
            <button type="button" onClick={() => setRoomSize((k) => Math.min(sim.sampleRoom.length, (k ?? 0) + 5))}>+5 people</button>
            <button type="button" onClick={() => setRoomSize(null)}>Fill to {Math.min(n, 120)}</button>
          </div>
          <canvas ref={roomRef} width={600} height={600} role="img"
            aria-label={`${roomPeople.length} people in a circle with ${(roomPeople.length * (roomPeople.length - 1)) / 2} pair lines; matching pairs highlighted.`} />
          <Legend items={[{ color: PALETTE.yellow, label: `Pairs that share a ${unit}` }, { color: PALETTE.muted, label: 'Every other pair' }]} />
          {isCalendar && <Calendar days={roomPeople} emptyText="Nobody in this room shares a birthday yet." />}
        </div>
      )}

      {isCalendar && <ClassBirthdays size={size} />}

      <section className="canvas-description prose" aria-labelledby="explain-heading">
        <h2 id="explain-heading">Why 23 people is enough</h2>
        <p>
          Most people guess you would need around 180 people, half of 365. The trick is that the question is about
          any two people matching, not someone matching you. In a room of 23 there are 253 different pairs, and each
          pair has a 1 in 365 chance of sharing a birthday. With that many chances, a match becomes more likely than
          not: about 50.7%. Add people one at a time in the room above and watch the number of pairs grow.
        </p>

        <h2>The exact formula</h2>
        <p>
          It is easier to work out the chance that everyone&apos;s birthday is different. The second person must
          miss the first (364/365), the third must miss both (363/365), and so on. Multiply those together and
          subtract from 1: P(match) = 1 − (365 × 364 × … × (365 − n + 1)) / 365ⁿ. By 57 people the chance passes 99%,
          and by 70 it is 99.9%.
        </p>

        <h2>My birthday versus any birthday</h2>
        <p>
          The chance that someone shares your particular birthday is far lower: 1 − (364/365)ⁿ⁻¹, about 6% in a room
          of 23. You would need 253 other people for even odds. Switch the question above to compare the two curves.
        </p>

        <h2>Three people, and near-birthdays</h2>
        <p>
          For three people to share a birthday you need 88 people for a 50% chance. If &quot;close&quot; counts, it
          is even faster: 14 people give even odds that two birthdays fall within a day of each other, and 11 people
          within two days.
        </p>

        <h2>Hash collisions and birthday attacks</h2>
        <p>
          The same math applies to anything drawn at random from N possibilities. Collisions become likely after about
          1.18 × √N items: about 77,000 for a 32-bit hash and about 5 billion for a 64-bit hash. That is why
          cryptographic hashes need twice as many bits as you might expect. The calculation assumes 365 equally likely
          birthdays; real birthdays are slightly uneven, which makes matches a little more likely, not less.
        </p>
      </section>

      <Faq items={FAQ} />
    </ToolPage>
  );
}

export default App;
