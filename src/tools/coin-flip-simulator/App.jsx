import { useEffect, useMemo, useRef, useState } from 'react';
import ToolPage from '../../shared/ToolPage';
import ToolActions from '../../shared/ToolActions';
import Faq from '../../shared/Faq';
import Predict from '../../shared/Predict';
import { Legend, LogRangeControl, RangeControl, SeedControl, StatRow } from '../../shared/controls';
import { useUrlState } from '../../shared/useUrlState';
import {
  expectedRunsOfLength, headsCounts, runLengths, scoreSequence, simulateRuns, typicalLongestStreak,
} from '../../utils/coinFlips';
import { PALETTE } from '../../utils/chart';
import { binomialPmf } from '../../utils/stats';
import { downloadCSV } from '../../utils/export';
import { randomSeed } from '../../utils/seed';
import { drawBinomial, drawRunLengths, drawRuns } from './drawCharts';
import Sequence from './Sequence';
import './coin.css';

const DEFAULTS = { flips: 10000, p: 0.5, runs: 5, seed: 'heads', mode: 'share', expN: 100 };
const CHART_SIZE = { width: 800, height: 420 };
const EXPERIMENTS = 2000;
const pct = (v, d = 2) => `${(v * 100).toFixed(d)}%`;

const FAQ = [
  {
    q: 'Is a coin flip really 50/50?',
    a: 'An ideal coin is. Real coins are very close: a 2023 study of 350,757 hand-flipped coins found they land on the same side they started on about 50.8% of the time, because of a slight wobble. This simulator uses a fair (or deliberately biased) computer coin, so it shows the ideal case.',
  },
  {
    q: 'Is this coin flip random?',
    a: 'The flips come from a seeded pseudorandom generator (seedrandom), which passes standard statistical tests for randomness. Seeding means the same seed always gives the same flips, so a class can share an exact run. Press "Flip again" for a fresh random seed.',
  },
  {
    q: 'If I flip a coin 100 times, how many heads should I get?',
    a: 'About 50, but rarely exactly 50: the chance of exactly 50 heads is only about 8%. Anything from 40 to 60 is normal (about 96% of the time). Use the probability calculator to check any count.',
  },
  {
    q: 'After five heads in a row, is tails more likely?',
    a: "No. The coin has no memory, so the next flip is still 50/50. Believing tails is 'due' is called the gambler's fallacy. Long-run averages even out because new flips dilute old ones, not because the coin corrects itself.",
  },
  {
    q: 'What is the law of large numbers?',
    a: 'As you flip more coins, the share of heads gets closer and closer to the true probability. After 10 flips 70% heads is common; after 10,000 flips you will almost always be within a percent or two of 50%.',
  },
  {
    q: 'How long a streak is normal in 100 flips?',
    a: 'In 100 fair flips the longest run of the same face is usually 6 or 7. A streak of 5 or more happens in about 97% of sequences. People inventing random-looking sequences almost never include streaks that long, which is how teachers spot fake coin-flip homework.',
  },
];

function parseFlips(text) {
  return [...text.toUpperCase()].filter((c) => 'HT10'.includes(c)).map((c) => (c === 'H' || c === '1' ? 1 : 0));
}

function RealOrFake() {
  const [text, setText] = useState('');
  const seq = parseFlips(text);
  const score = useMemo(() => (seq.length >= 20 ? scoreSequence(seq) : null), [text]); // eslint-disable-line react-hooks/exhaustive-deps

  const fillRandom = () => {
    const values = new Uint8Array(100);
    crypto.getRandomValues(values);
    setText(Array.from(values, (v) => (v & 1 ? 'H' : 'T')).join(''));
  };

  let verdict = '';
  if (score) {
    const tooFewStreaks = score.shareWithStreakAtLeast > 0.9;
    const tooManySwitches = score.shareWithSwitchesAtMost > 0.95;
    verdict = tooFewStreaks || tooManySwitches
      ? '🕵️ Looks made up. Real random sequences usually have a longer streak and switch faces less often.'
      : '🎲 Looks genuinely random. This could easily have come from a real coin.';
  }

  return (
    <section className="panel" aria-labelledby="fake-heading">
      <h2 id="fake-heading">Real or fake? Can you fake randomness?</h2>
      <p className="chart-caption">
        Type 100 coin flips as H and T, making them up as randomly as you can. Then see how they compare with 10,000
        genuinely random sequences.
      </p>
      <label className="visually-hidden" htmlFor="fake-input">Your flips</label>
      <textarea id="fake-input" className="class-input" rows={3} value={text} onChange={(e) => setText(e.target.value)}
        placeholder="HTTHTHHTHT..." />
      <div className="button-row">
        <button type="button" onClick={fillRandom}>Fill with 100 real random flips</button>
        <button type="button" onClick={() => setText('')}>Clear</button>
      </div>
      <p className="result-line" aria-live="polite">
        {seq.length < 20 ? `${seq.length} flips entered. Enter at least 20 (100 works best).` : (
          <>
            {seq.length} flips. Your longest streak is <strong>{score.longest}</strong>; a typical random sequence of
            this length has a longest streak of about <strong>{score.typicalLongest}</strong>, and{' '}
            {pct(score.shareWithStreakAtLeast, 0)} of them have a streak at least as long as yours. You switched faces{' '}
            <strong>{score.switches}</strong> times; random sequences switch about {Math.round(score.expectedSwitches)}{' '}
            times. {verdict}
          </>
        )}
      </p>
    </section>
  );
}

function App() {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const binomialRef = useRef(null);
  const runLengthRef = useRef(null);
  const [settings, set, reset] = useUrlState(DEFAULTS);
  const { flips, p, runs: runCount, seed, mode, expN } = settings;
  const [handsOn, setHandsOn] = useState(0);
  const [flipKey, setFlipKey] = useState(0);
  const [calc, setCalc] = useState({ op: 'eq', k: '' });

  const { runs, sequence } = useMemo(() => simulateRuns({ flips, p, runs: runCount, seed }), [flips, p, runCount, seed]);
  const counts = useMemo(() => headsCounts({ flipsPerExperiment: expN, experiments: EXPERIMENTS, p, seed }), [expN, p, seed]);

  const lengths = useMemo(() => runLengths(sequence), [sequence]);
  const maxL = Math.min(20, Math.max(8, ...lengths));
  const observed = new Array(maxL + 1).fill(0);
  for (const len of lengths) if (len <= maxL) observed[len] += 1;
  const expected = Array.from({ length: maxL + 1 }, (_, L) => (L === 0 ? 0 : expectedRunsOfLength(flips, L, p)));

  const k = calc.k === '' ? Math.round(expN * p) : Math.min(expN, Math.max(0, Math.round(Number(calc.k))));
  const range = calc.op === 'eq' ? [k, k] : calc.op === 'ge' ? [k, expN] : [0, k];
  let exactProb = 0;
  for (let i = range[0]; i <= range[1]; i += 1) exactProb += binomialPmf(expN, i, p);
  let simHits = 0;
  for (let i = range[0]; i <= range[1]; i += 1) simHits += counts[i];

  const draw = (canvas) => drawRuns(canvas, { runs, flips, p, mode });
  useEffect(() => {
    draw(canvasRef.current);
    drawBinomial(binomialRef.current, { counts, n: expN, p, experiments: EXPERIMENTS, highlight: range });
    drawRunLengths(runLengthRef.current, { observed, expected });
  });

  const avgGap = runs.reduce((sum, r) => sum + Math.abs(r.heads / flips - p), 0) / runs.length;
  const expectedGap = Math.sqrt((p * (1 - p)) / flips) * Math.sqrt(2 / Math.PI);

  // Hands-on flips walk through run 1's sequence, so they match the big chart
  const flip = (count) => {
    setHandsOn((h) => Math.min(flips, h + count));
    setFlipKey((key) => key + 1);
  };
  const handHeads = sequence.subarray(0, handsOn).reduce((a, b) => a + b, 0);
  const handLengths = runLengths(sequence, handsOn);
  const currentStreak = handsOn ? handLengths[handLengths.length - 1] : 0;
  const last = handsOn ? sequence[handsOn - 1] : null;

  const exportCsv = () => {
    const limit = Math.min(flips, 100000);
    const rows = [];
    let heads = 0;
    for (let i = 0; i < limit; i += 1) {
      heads += sequence[i];
      rows.push([i + 1, sequence[i] ? 'H' : 'T', heads, (heads / (i + 1)).toFixed(5)]);
    }
    downloadCSV(`coin-flips-${limit}.csv`, ['flip', 'outcome', 'heads_so_far', 'share_heads'], rows);
  };

  return (
    <ToolPage
      slug="coin-flip-simulator"
      title="Coin Flip Simulator & Law of Large Numbers"
      intro="Flip one coin or a million. Watch the share of heads settle toward 50%, see real streaks in the sequence, check any probability exactly, and test whether you can fake randomness."
    >
      <section className="panel coin-panel" aria-labelledby="flip-heading">
        <h2 id="flip-heading">Flip a coin</h2>
        <div className="coin-row">
          <div key={flipKey} className={`coin ${last === null ? '' : last ? 'heads' : 'tails'} ${handsOn ? 'spin' : ''}`} aria-live="polite">
            {last === null ? '?' : last ? 'H' : 'T'}
          </div>
          <div>
            <div className="button-row">
              <button type="button" className="primary" onClick={() => flip(1)}>Flip</button>
              <button type="button" onClick={() => flip(10)}>Flip 10</button>
              <button type="button" onClick={() => flip(100)}>Flip 100</button>
              <button type="button" onClick={() => setHandsOn(0)} disabled={!handsOn}>Start over</button>
            </div>
            <p className="result-line">
              {handsOn
                ? <>{handsOn.toLocaleString()} flips: <strong>{handHeads}</strong> heads ({pct(handHeads / handsOn, 1)}),{' '}
                  {handsOn - handHeads} tails. Current streak: {currentStreak}. Longest streak: {Math.max(...handLengths)}.</>
                : 'Press Flip to start.'}
            </p>
          </div>
        </div>
        {handsOn > 0 && <Sequence seq={sequence} count={handsOn} />}
      </section>

      <Predict
        question="Flip a fair coin 100 times. What is the longest run of the same face in a row you would expect?"
        answer="Usually 6 or 7. A run of at least 5 shows up in about 97% of 100-flip sequences. Most people guess 3 or 4, which is why invented sequences look too tidy."
        placeholder="e.g. 4"
      />

      <section className="controls-panel" aria-label="Simulation settings">
        <div className="control-grid">
          <LogRangeControl id="flips-range" label="Flips per run" value={flips} minExp={1} maxExp={6} onChange={(v) => { set('flips', v); setHandsOn(0); }} />
          <RangeControl id="p-range" label="Chance of heads" display={`${Math.round(p * 100)}%`} value={p}
            min={0.05} max={0.95} step={0.01} onChange={(v) => set('p', v)} />
          <RangeControl id="runs-range" label="Runs" value={runCount} min={1} max={8} onChange={(v) => set('runs', v)} />
          <SeedControl value={seed} onChange={(v) => { set('seed', v); setHandsOn(0); }} />
        </div>
        <div className="preset-row" role="group" aria-label="Chart view">
          <button type="button" aria-pressed={mode === 'share'} onClick={() => set('mode', 'share')}>Share of heads</button>
          <button type="button" aria-pressed={mode === 'diff'} onClick={() => set('mode', 'diff')}>Heads minus tails</button>
        </div>
        <ToolActions
          image={{ draw, size: CHART_SIZE, filename: 'coin-flips.png' }}
          onCsv={exportCsv}
          csvLabel="Download run 1 flips (CSV)"
          onReset={() => { reset(); setHandsOn(0); }}
          fullscreenRef={chartRef}
        >
          <button type="button" onClick={() => { set('seed', randomSeed()); setHandsOn(0); }}>🎲 Flip again</button>
        </ToolActions>
      </section>

      <div className="canvas-wrapper chart-wrapper" ref={chartRef}>
        <canvas ref={canvasRef} width={CHART_SIZE.width} height={CHART_SIZE.height} role="img"
          aria-label={`${mode === 'share' ? 'Running share of heads' : 'Heads minus tails'} for ${runCount} runs of ${flips} flips.`} />
        <p className="chart-caption">
          {mode === 'share'
            ? 'Each colored line is one run. The dashed line is the true chance of heads, and the shaded band is where the share should be about 95% of the time. The share converges.'
            : 'The same runs as heads minus tails. The band widens like √n: the raw gap keeps growing even while the share converges.'}
        </p>
      </div>

      <section className="stats-panel">
        <h2>Results</h2>
        <div className="stats-grid">
          {runs.slice(0, 4).map((run, i) => (
            <StatRow key={i} label={`Run ${i + 1} heads:`} value={`${run.heads.toLocaleString()} (${pct(run.heads / flips)})`} />
          ))}
          <StatRow label="Average gap from true share:" value={pct(avgGap)} />
          <StatRow label="Theory, expected gap:" value={pct(expectedGap)} />
          <StatRow label="Average gap in heads count:" value={Math.round(avgGap * flips).toLocaleString()} />
          <StatRow label="Longest heads streak (run 1):" value={runs[0].longestHeadsStreak} />
          <StatRow label="Theory, typical longest heads streak:" value={`≈ ${Math.max(1, typicalLongestStreak(flips, p)).toFixed(1)}`} />
        </div>
      </section>

      <div className="canvas-wrapper chart-wrapper">
        <h2 className="chart-title">Streaks in run 1: how many of each length</h2>
        <canvas ref={runLengthRef} width={800} height={300} role="img"
          aria-label={`Number of streaks of each length in ${flips} flips, compared with the expected number.`} />
        <Legend items={[{ color: PALETTE.cyan, label: 'Streaks found' }, { color: PALETTE.yellow, label: 'Expected' }]} />
      </div>

      <section className="panel" aria-labelledby="binomial-heading">
        <h2 id="binomial-heading">Repeat an experiment: heads in {expN} flips, {EXPERIMENTS.toLocaleString()} times</h2>
        <RangeControl id="expn-range" label="Flips per experiment" value={expN} min={10} max={1000} step={10} onChange={(v) => set('expN', v)} />
        <canvas ref={binomialRef} width={800} height={300} role="img" className="panel-canvas"
          aria-label={`Histogram of heads in ${expN} flips over ${EXPERIMENTS} experiments, with the exact binomial distribution.`} />
        <Legend items={[{ color: PALETTE.cyan, label: 'Experiments' }, { color: PALETTE.yellow, label: 'Exact binomial prediction' }, { color: PALETTE.violet, label: 'Your range' }]} />
        <div className="inline-fields">
          <label>
            Chance of getting
            <select value={calc.op} onChange={(e) => setCalc({ ...calc, op: e.target.value })}>
              <option value="eq">exactly</option>
              <option value="ge">at least</option>
              <option value="le">at most</option>
            </select>
          </label>
          <label>
            heads
            <input type="number" min="0" max={expN} value={calc.k} placeholder={String(Math.round(expN * p))}
              onChange={(e) => setCalc({ ...calc, k: e.target.value })} />
          </label>
        </div>
        <p className="result-line" aria-live="polite">
          Exact: <strong>{pct(exactProb)}</strong>{exactProb > 0 && exactProb < 0.5 ? ` (about 1 in ${Math.round(1 / exactProb).toLocaleString()})` : ''}.
          In the simulated experiments: <strong>{pct(simHits / EXPERIMENTS)}</strong>.
        </p>
      </section>

      <RealOrFake />

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
          tails grows like √n. Switch the chart to &quot;Heads minus tails&quot; to see it. After a million flips you
          might be 500 heads ahead and still be at 50.05%. The coin never &quot;corrects&quot; for a run of tails;
          earlier imbalances are simply diluted by later flips. Believing otherwise is the gambler&apos;s fallacy.
        </p>

        <h2>Streaks are longer than you think</h2>
        <p>
          In n fair flips, the longest run of heads is usually close to log₂ n. A hundred flips typically contain a
          streak of about six of the same face in a row. The streak chart shows how many streaks of each length a run
          really contains, and the real-or-fake game shows why made-up sequences, where people avoid long streaks,
          are easy to spot.
        </p>

        <h2>From coin flips to the bell curve</h2>
        <p>
          Count the heads in 100 flips and repeat that thousands of times, and the counts form a binomial
          distribution, which looks like a bell curve. That is the central limit theorem at work, and the same idea as
          a Galton board.
        </p>
      </section>

      <Faq items={FAQ} />
    </ToolPage>
  );
}

export default App;
