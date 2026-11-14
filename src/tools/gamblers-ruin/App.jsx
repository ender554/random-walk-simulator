import { useMemo, useRef } from 'react';
import ToolPage from '../../shared/ToolPage';
import NextTools, { RailNext } from '../../shared/NextTools';
import ToolActions from '../../shared/ToolActions';
import Faq from '../../shared/Faq';
import { Legend, LogRangeControl, RangeControl, SeedControl, StatRow } from '../../shared/controls';
import { useUrlState } from '../../shared/useUrlState';
import { useScreenCanvas } from '../../shared/useScreenCanvas';
import { STRATEGIES, gamblersRuinTheory, simulateGames, summarize } from '../../utils/gamblersRuin';
import { PALETTE } from '../../utils/chart';
import { downloadCSV } from '../../utils/export';
import { randomSeed } from '../../utils/seed';
import { COLORS, drawGames, drawLengths, drawRuinCurve } from './drawGames';
import './ruin.css';

const DEFAULTS = { start: 20, target: 40, open: false, p: 18 / 37, payout: 1, games: 1000, strategy: 'flat', unit: 1, limit: 500, seed: 'casino' };
const CHART_SIZE = { width: 800, height: 450 };
const PRESETS = [
  { label: 'Fair coin', p: 0.5, payout: 1 },
  { label: 'Roulette red, European (18/37)', p: 18 / 37, payout: 1 },
  { label: 'Roulette red, American (18/38)', p: 18 / 38, payout: 1 },
  { label: 'Craps pass line (244/495)', p: 244 / 495, payout: 1 },
  { label: 'Roulette single number (1/37, pays 35:1)', p: 1 / 37, payout: 35 },
];
const pct = (v) => (Number.isFinite(v) ? `${(v * 100).toFixed(1)}%` : '—');
const money = (v) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const num = (v) => (Number.isFinite(v) ? Math.round(v).toLocaleString() : '∞');

const FAQ = [
  {
    q: "What is the gambler's ruin formula?",
    a: "Betting $1 at a time with win probability p (and q = 1 − p), starting with i dollars and stopping at N, the chance of going broke is ((q/p)^i − (q/p)^N) / (1 − (q/p)^N). In a fair game (p = ½) it simplifies to 1 − i/N. The expected number of bets in a fair game is i × (N − i).",
  },
  {
    q: 'Can a betting system like the Martingale beat the house?',
    a: 'No. Every bet has the same negative expected value, so any combination of bets does too. The Martingale wins small amounts often and loses big amounts rarely; table limits and finite bankrolls make sure the rare losses arrive. Run the strategy comparison: no system reaches the target more often than the math allows, and most lose more on average.',
  },
  {
    q: 'What is the best strategy when the odds are against you?',
    a: 'Bold play: bet as much as you need to reach your target in as few bets as possible. When every bet has a house edge, the fewer bets you place, the less the edge grinds you down. Dubins and Savage proved bold play is optimal in this situation, and the comparison table shows it.',
  },
  {
    q: 'How long does a game last on average?',
    a: 'In a fair game starting with $i and stopping at $N, the expected number of $1 bets is i × (N − i): 400 bets from $20 to $40, and 2,500 from $50 to $100. Games against a house edge end a little sooner, mostly in ruin.',
  },
  {
    q: "What happens if there's no target and I just keep playing?",
    a: 'Against a casino with any edge, or even in a perfectly fair game, you go broke with certainty if you play long enough, because the casino has far more money than you. Tick "Play with no target" to see every game head toward $0.',
  },
];


// The workbench (docs/redesign-2026-11-10/B3-LOGIC.md): the bankroll paths on the stage with the share that went broke
// against the exact formula on top; the rail has Run, the next step, Share & export and the settings.
function App() {
  const stageRef = useRef(null);
  const [settings, set, reset] = useUrlState(DEFAULTS);
  const { start, open, p, payout, games, strategy, unit, limit, seed } = settings;
  const target = open ? Infinity : Math.max(settings.target, start + 1);
  const maxBets = open ? 10000 : 100000;
  const rules = useMemo(
    () => ({ start, target, p, payout, strategy, unit, tableLimit: limit, maxBets }),
    [start, target, p, payout, strategy, unit, limit, maxBets],
  );

  const results = useMemo(() => simulateGames({ games, seed, ...rules }), [games, seed, rules]);
  const s = summarize(results);

  // The closed-form answers only cover flat bets of one unit at even money
  const exact = strategy === 'flat' && payout === 1 && start % unit === 0 && (open || target % unit === 0);
  const theory = exact ? gamblersRuinTheory(start / unit, open ? Infinity : target / unit, p) : null;
  const theoryAt = exact && !open ? (x) => gamblersRuinTheory(x / unit, target / unit, p).ruinProbability : null;

  const curvePoints = useMemo(() => {
    if (open) return [];
    const starts = [...new Set([...Array.from({ length: 9 }, (_, k) => Math.max(1, Math.round((target * (k + 1)) / 10))), start])];
    return starts.map((s0) => {
      const sim = summarize(simulateGames({ games: 400, keepPaths: 0, stepBudget: 4e6, seed: `${seed}-curve`, ...rules, start: s0 }));
      return [s0, sim.ruined / sim.count];
    });
  }, [open, target, start, seed, rules]);

  const comparison = useMemo(() => Object.keys(STRATEGIES).map((key) => {
    if (key === 'kelly' && payout * p - (1 - p) <= 0) return { key, skipped: true };
    return { key, ...summarize(simulateGames({ games: Math.min(games, 2000), keepPaths: 0, stepBudget: 8e6, seed, ...rules, strategy: key })) };
  }), [games, seed, rules, payout, p]);

  const draw = (canvas) => drawGames(canvas, { results, start, target });
  const gamesRef = useScreenCanvas(draw);
  const lengthsRef = useScreenCanvas((canvas) => drawLengths(canvas, { results, expectedBets: theory?.expectedBets }));
  const curveRef = useScreenCanvas((canvas) => drawRuinCurve(canvas, { target, theoryAt, simulated: curvePoints, start }));

  const preset = PRESETS.findIndex((g) => Math.abs(p - g.p) < 1e-9 && payout === g.payout);

  const exportCsv = () => {
    downloadCSV(`gamblers-ruin-${strategy}.csv`, ['game', 'outcome', 'bets', 'total_wagered', 'final_bankroll', 'peak_bankroll'],
      results.map((r, i) => [i + 1, r.outcome, r.bets, r.wagered.toFixed(2), r.final.toFixed(2), r.peak.toFixed(2)]));
  };

  return (
    <ToolPage
      slug="gamblers-ruin"
      workbench
      title="Gambler's Ruin Simulator"
      intro="Start with a bankroll and bet until you reach a target or go broke, then see why no betting system beats a house edge."
    >
      <div className="wb">
        <div className="wb-stage pinned" ref={stageRef}>
          <div className="stage-headline">
            <p><span>Went broke</span> <strong className="s2">{pct(s.ruined / s.count)}</strong></p>
            <p><span>Exact formula</span> <strong>{theory ? pct(theory.ruinProbability) : 'none here'}</strong></p>
            <p className="stage-meta">
              <span>{s.count.toLocaleString()} games, {money(start)} {open ? 'with no target' : `to ${money(target)}`}</span>{' '}
              <span>{num(s.meanBets)} bets on average · seed {seed}</span>
            </p>
          </div>
          <div className="stage-chart">
            <canvas ref={gamesRef} role="img"
              aria-label={`Bankroll over time: ${s.reached} of ${s.count} games reached the target, ${s.ruined} went broke.`} />
          </div>
          <Legend
            items={[
              ...(open ? [] : [{ color: COLORS.target, label: `Reached ${money(target)}` }]),
              { color: COLORS.ruin, label: 'Went broke' },
              ...(s.unfinished ? [{ color: COLORS.unfinished, label: 'Still playing at the bet limit' }] : []),
            ]}
          />
          <p className="chart-caption">
            Bankroll after each bet{s.count > 200 ? `, for the first 200 of ${s.count.toLocaleString()} games` : ''}.
            {s.count < games ? ` Stopped after ${s.count.toLocaleString()} games to keep the page fast.` : ''}
          </p>
        </div>

        <div className="wb-rail">
          <button type="button" className="run-button" onClick={() => set('seed', randomSeed())}>New games</button>

          <RailNext />

          <ToolActions
            menu
            image={{ draw, size: CHART_SIZE, filename: 'gamblers-ruin.png' }}
            onCsv={exportCsv}
            csvLabel="Download every game (CSV)"
            onReset={reset}
            fullscreenRef={stageRef}
          />

          <section className="wb-settings" aria-labelledby="settings-heading">
            <h2 id="settings-heading">Game settings</h2>
            <div className="control-row">
              <label htmlFor="game-select">Game</label>
              <select id="game-select" value={preset} onChange={(e) => {
                const chosen = PRESETS[Number(e.target.value)];
                if (chosen) { set('p', chosen.p); set('payout', chosen.payout); }
              }}>
                {preset < 0 && <option value={-1}>Your own odds</option>}
                {PRESETS.map((g, i) => <option key={g.label} value={i}>{g.label}</option>)}
              </select>
            </div>
            <RangeControl id="start-range" label="Starting bankroll" display={money(start)} value={start} min={1} max={500}
              onChange={(v) => { set('start', v); if (settings.target <= v) set('target', v + 1); }} />
            <RangeControl id="target-range" label="Stop when you reach" display={open ? 'no target' : money(target)} value={Math.max(settings.target, start + 1)}
              min={start + 1} max={1000} onChange={(v) => set('target', v)} />
            <label className="check-row" htmlFor="open-check">
              <input id="open-check" type="checkbox" checked={open} onChange={(e) => set('open', e.target.checked)} />
              Play with no target: keep betting until broke (or 10,000 bets)
            </label>
            <div className="control-row">
              <label htmlFor="strategy-select">Betting strategy</label>
              <select id="strategy-select" value={strategy} onChange={(e) => set('strategy', e.target.value)}>
                {Object.entries(STRATEGIES).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
              </select>
              <p className="setting-note">Strategy: {STRATEGIES[strategy].short}.</p>
            </div>
            <details className="more-settings">
              <summary>More settings</summary>
              <div>
                <RangeControl id="p-range" label="Chance of winning each bet" display={pct(p)} value={p}
                  min={0.01} max={0.7} step={0.001} onChange={(v) => set('p', v)} />
                <div className="control-row">
                  <label htmlFor="payout-input">Wins pay (to 1)</label>
                  <input id="payout-input" type="number" min="0.1" step="any" value={payout} onChange={(e) => set('payout', Math.max(0.1, Number(e.target.value) || 1))} />
                </div>
                <RangeControl id="unit-range" label="Base bet" display={money(unit)} value={unit} min={1} max={50} onChange={(v) => set('unit', v)} />
                {strategy === 'martingale' && (
                  <RangeControl id="limit-range" label="Table limit (largest bet allowed)" display={money(limit)} value={limit} min={10} max={5000} step={10} onChange={(v) => set('limit', v)} />
                )}
                <LogRangeControl id="games-range" label="Games" value={games} minExp={1} maxExp={5} onChange={(v) => set('games', v)} />
                <SeedControl value={seed} onChange={(v) => set('seed', v)} />
              </div>
            </details>
          </section>
        </div>
      </div>

      <NextTools />

      <section className="stats-panel">
        <h2>Results from {s.count.toLocaleString()} games</h2>
        <div className="stats-grid">
          {!open && <StatRow label={`Reached ${money(target)}:`} value={`${s.reached.toLocaleString()} (${pct(s.reached / s.count)})`} />}
          <StatRow label="Went broke:" value={`${s.ruined.toLocaleString()} (${pct(s.ruined / s.count)})`} />
          <StatRow label="Theory, chance of ruin:" value={theory ? pct(theory.ruinProbability) : 'no simple formula for these rules'} />
          <StatRow label="Average bets per game:" value={num(s.meanBets)} />
          <StatRow label="Theory, expected bets:" value={theory ? num(theory.expectedBets) : '—'} />
          <StatRow label="Average total wagered:" value={money(s.meanWagered)} />
          <StatRow label="Average money left:" value={`${money(s.meanFinal)} (started with ${money(start)})`} />
          {s.unfinished > 0 && <StatRow label="Still playing at the limit:" value={s.unfinished.toLocaleString()} />}
        </div>
      </section>

      <section className="panel" aria-labelledby="compare-heading">
        <h2 id="compare-heading">Every strategy on the same coin flips</h2>
        <p className="chart-caption">
          {Math.min(games, 2000).toLocaleString()} games each, with the same random outcomes for every strategy, so the
          only difference is how much is bet.
        </p>
        <div className="table-scroll">
          <table className="case-table">
            <thead>
              <tr><th>Strategy</th>{!open && <th>Reached target</th>}<th>Went broke</th><th>Avg. bets</th><th>Avg. wagered</th><th>Avg. money left</th></tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr key={row.key} className={row.key === strategy ? 'current' : undefined}>
                  <td>{STRATEGIES[row.key].label}</td>
                  {row.skipped ? (
                    <td colSpan={open ? 4 : 5}>No edge in your favor, so Kelly says don&apos;t bet at all.</td>
                  ) : (
                    <>
                      {!open && <td>{pct(row.reached / row.count)}</td>}
                      <td>{pct(row.ruined / row.count)}</td>
                      <td>{num(row.meanBets)}</td>
                      <td>{money(row.meanWagered)}</td>
                      <td>{money(row.meanFinal)}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="canvas-wrapper chart-wrapper">
        <h2 className="chart-title">How long the games lasted</h2>
        <div className="ruin-chart">
          <canvas ref={lengthsRef} role="img" aria-label="Histogram of game lengths, split by outcome." />
        </div>
        <Legend items={[{ color: COLORS.target, label: 'Reached the target' }, { color: COLORS.ruin, label: 'Went broke' }, ...(theory && Number.isFinite(theory.expectedBets) ? [{ color: PALETTE.yellow, label: 'Theoretical average' }] : [])]} />
      </div>

      {!open && (
        <div className="canvas-wrapper chart-wrapper">
          <h2 className="chart-title">Chance of ruin for every starting bankroll (target {money(target)})</h2>
          <div className="ruin-chart">
            <canvas ref={curveRef} role="img" aria-label="Chance of going broke against starting bankroll, exact curve and simulated points." />
          </div>
          <Legend items={[...(theoryAt ? [{ color: PALETTE.yellow, label: 'Exact formula' }] : []), { color: PALETTE.cyan, label: 'Simulated (400 games each)' }, { color: PALETTE.pink, label: 'Your starting bankroll' }]} />
        </div>
      )}

      <section className="canvas-description prose" aria-labelledby="explain-heading">
        <h2 id="explain-heading">What is the gambler&apos;s ruin?</h2>
        <p>
          A gambler starts with a bankroll and bets repeatedly, winning each bet with probability p. They stop when
          they reach a target or lose everything. The gambler&apos;s ruin problem, first posed by Pascal in 1656, asks how
          likely each ending is. With flat $1 bets each game is a one-dimensional <a href="/random-walk/" data-hop="text">random walk</a> that stops at two walls.
        </p>

        <h2>A fair game</h2>
        <p>
          When every bet is a <a href="/coin-flip-simulator/" data-hop="text">coin flip</a> (p = 50%), the chance of reaching the target is simply your starting
          bankroll divided by the target. Starting with $20 and stopping at $40 gives a 50% chance either way. The
          expected number of bets is start × (target − start), so the game lasts longer than most people guess.
        </p>

        <h2>Why the house always wins</h2>
        <p>
          Change p to European roulette&apos;s 18/37 (about 48.6%) and the odds collapse. From $20 aiming for $40
          the chance of ruin jumps to about 75%, and from $50 aiming for $100 it is around 94%. A small edge on
          every bet compounds over a long game, which is why casinos only need a slight advantage. With q = 1 − p,
          the chance of ruin is ((q/p)<sup>start</sup> − (q/p)<sup>target</sup>) / (1 − (q/p)<sup>target</sup>).
        </p>

        <h2>Betting systems don&apos;t change the edge</h2>
        <p>
          The Martingale doubles after every loss so the next win recovers everything. It wins small amounts most of
          the time and occasionally loses a huge amount when a losing streak hits the table limit or the bankroll.
          Every system only rearranges when you win and lose; the expected loss per dollar wagered stays the same, so
          systems that bet more in total lose more. The comparison table runs every system on identical coin flips to
          show it.
        </p>

        <h2>Bold play</h2>
        <p>
          When the odds are against you, the best way to reach a target is to place as few bets as possible: bet just
          enough to reach the target in one win. Dubins and Savage proved this is optimal. Against a house edge, time
          at the table is what ruins you.
        </p>
      </section>

      <Faq items={FAQ} />
    </ToolPage>
  );
}

export default App;
