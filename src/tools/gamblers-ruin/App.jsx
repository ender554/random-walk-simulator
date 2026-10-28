import { useEffect, useMemo, useRef, useState } from 'react';
import SiteLayout from '../../shared/SiteLayout';
import RelatedTools from '../../shared/RelatedTools';
import FurtherReading from '../../shared/FurtherReading';
import { gamblersRuinTheory, simulateGames } from '../../utils/gamblersRuin';
import { exportCanvasPNG } from '../../utils/canvas';
import { randomSeed } from '../../utils/seed';
import { COLORS, drawGames } from './drawGames';
import '../../shared/tool.css';

const PRESETS = [
  { label: 'Fair coin', p: 0.5 },
  { label: 'European roulette (18/37)', p: 18 / 37 },
  { label: 'American roulette (18/38)', p: 18 / 38 },
];

const pct = (v) => `${(v * 100).toFixed(1)}%`;
const num = (v) => Math.round(v).toLocaleString();

function App() {
  const canvasRef = useRef(null);
  const [start, setStart] = useState(20);
  const [target, setTarget] = useState(40);
  const [p, setP] = useState(18 / 37);
  const [games, setGames] = useState(100);
  const [seed, setSeed] = useState('casino');

  const results = useMemo(
    () => simulateGames({ start, target, p, games, seed }),
    [start, target, p, games, seed],
  );
  const theory = gamblersRuinTheory(start, target, p);

  const count = (outcome) => results.filter((r) => r.outcome === outcome).length;
  const ruined = count('ruin');
  const reached = count('target');
  const unfinished = count('unfinished');
  const meanBets = results.reduce((sum, r) => sum + r.path.length - 1, 0) / results.length;

  useEffect(() => {
    drawGames(canvasRef.current, results, start, target);
  }, [results, start, target]);

  const handleStart = (value) => {
    setStart(value);
    if (target <= value) setTarget(value + 1);
  };

  return (
    <SiteLayout>
      <div className="tool-main">
        <header className="page-header">
          <h1>Gambler&apos;s Ruin Simulator</h1>
          <p>
            Start with a bankroll, bet $1 at a time, and stop when you double up or go broke. Run hundreds of games
            and see how even a small house edge decides who walks away.
          </p>
        </header>

        <section className="controls-panel" aria-label="Simulation settings">
          <div className="control-grid">
            <div className="control-row">
              <label htmlFor="start-range">
                Starting bankroll <span>${start}</span>
              </label>
              <input
                id="start-range"
                type="range"
                min="1"
                max="100"
                value={start}
                onChange={(e) => handleStart(Number(e.target.value))}
              />
            </div>

            <div className="control-row">
              <label htmlFor="target-range">
                Stop when you reach <span>${target}</span>
              </label>
              <input
                id="target-range"
                type="range"
                min={start + 1}
                max="200"
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
              />
            </div>

            <div className="control-row">
              <label htmlFor="p-range">
                Chance of winning each bet <span>{pct(p)}</span>
              </label>
              <input
                id="p-range"
                type="range"
                min="0.4"
                max="0.6"
                step="0.001"
                value={p}
                onChange={(e) => setP(Number(e.target.value))}
              />
            </div>

            <div className="control-row">
              <label htmlFor="games-range">
                Games <span>{games}</span>
              </label>
              <input
                id="games-range"
                type="range"
                min="1"
                max="200"
                value={games}
                onChange={(e) => setGames(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="preset-row" role="group" aria-label="Win chance presets">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                aria-pressed={Math.abs(p - preset.p) < 1e-9}
                onClick={() => setP(preset.p)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="control-row">
            <label htmlFor="seed-input">Seed</label>
            <input
              id="seed-input"
              type="text"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="Enter seed"
            />
          </div>

          <div className="button-row">
            <button type="button" onClick={() => setSeed(randomSeed())}>
              🎲 New games
            </button>
            <button type="button" onClick={() => exportCanvasPNG(canvasRef.current, 'gamblers-ruin.png')}>
              Export PNG
            </button>
          </div>

        </section>

        <div className="canvas-wrapper chart-wrapper">
          <canvas
            ref={canvasRef}
            width={800}
            height={450}
            role="img"
            aria-label={`Bankroll over time for ${games} games: ${reached} reached $${target}, ${ruined} went broke.`}
          />
          <p className="chart-caption">
            Bankroll after each bet.
            <span className="legend-swatch" style={{ background: COLORS.target }} />
            Reached ${target}
            <span className="legend-swatch" style={{ background: COLORS.ruin }} />
            Went broke
            {unfinished > 0 && (
              <>
                <span className="legend-swatch" style={{ background: COLORS.unfinished }} />
                Still playing
              </>
            )}
          </p>
        </div>

        <section className="stats-panel">
          <h2>Results</h2>
          <div className="stats-grid">
            <div className="stat-row"><span>Reached ${target}:</span><span>{reached} ({pct(reached / games)})</span></div>
            <div className="stat-row"><span>Went broke:</span><span>{ruined} ({pct(ruined / games)})</span></div>
            <div className="stat-row"><span>Theory, chance of ruin:</span><span>{pct(theory.ruinProbability)}</span></div>
            <div className="stat-row"><span>Average bets per game:</span><span>{num(meanBets)}</span></div>
            <div className="stat-row"><span>Theory, expected bets:</span><span>{num(theory.expectedBets)}</span></div>
            <div className="stat-row"><span>Seed:</span><span>{seed || 'N/A'}</span></div>
          </div>
        </section>

        <section className="canvas-description prose" aria-labelledby="explain-heading">
          <h2 id="explain-heading">What is the gambler&apos;s ruin?</h2>
          <p>
            A gambler starts with a bankroll and bets $1 at a time, winning each bet with probability p. They stop
            when they reach a target or lose everything. The gambler&apos;s ruin problem asks how likely each ending
            is. Each game is a one-dimensional random walk that stops at two walls.
          </p>

          <h2>A fair game</h2>
          <p>
            When every bet is a coin flip (p = 50%), the chance of reaching the target is simply your starting
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

          <h2>Try this</h2>
          <p>
            Keep the roulette odds and raise both the starting bankroll and the target: the chance of ruin gets
            worse, not better. Then set p a little above 50% and watch the same effect work in your favor.
          </p>
        </section>

        <FurtherReading slug="gamblers-ruin" />
        <RelatedTools slug="gamblers-ruin" />
      </div>
    </SiteLayout>
  );
}

export default App;
