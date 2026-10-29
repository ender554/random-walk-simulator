import { useEffect, useRef, useState } from 'react';

const SPEEDS = [
  { label: 'Slow (5 games/s)', perSecond: 5 },
  { label: 'Medium (30 games/s)', perSecond: 30 },
  { label: 'Fast (200 games/s)', perSecond: 200 },
];

/**
 * "Always stay" and "always switch" play the same simulated games side by side, at a watchable
 * speed. Bridges the gap between one slow game and an instant 100,000-game run.
 */
function Race({ sim, games }) {
  const [played, setPlayed] = useState(0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const startRef = useRef(null);

  useEffect(() => {
    if (!running) return undefined;
    let frame;
    const from = played;
    startRef.current = performance.now();
    const tick = (now) => {
      const target = Math.min(games, from + Math.floor(((now - startRef.current) / 1000) * SPEEDS[speed].perSecond));
      setPlayed(target);
      if (target < games) frame = requestAnimationFrame(tick);
      else setRunning(false);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // Restart the clock only when play/pause or speed changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, speed, games]);

  let stay = 0;
  let swap = 0;
  let counted = 0;
  for (let g = 0; g < played; g += 1) {
    if (sim.voided[g]) continue;
    counted += 1;
    if (sim.pick[g] === sim.car[g]) stay += 1;
    if (sim.other[g] === sim.car[g]) swap += 1;
  }
  const lanes = [
    { label: 'Always stay', wins: stay, color: '#ff6b8b' },
    { label: 'Always switch', wins: swap, color: '#1de5d0' },
  ];

  return (
    <div className="race">
      <div className="button-row">
        <button type="button" onClick={() => { if (played >= games) setPlayed(0); setRunning((r) => !r); }}>
          {running ? 'Pause' : played >= games ? 'Race again' : played ? 'Resume' : '▶ Start the race'}
        </button>
        <button type="button" onClick={() => { setRunning(false); setPlayed(games); }}>Finish now</button>
        <label className="visually-hidden" htmlFor="race-speed">Race speed</label>
        <select id="race-speed" value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
          {SPEEDS.map((s, i) => <option key={s.label} value={i}>{s.label}</option>)}
        </select>
      </div>
      <p className="result-line" aria-live="off">
        Game {played.toLocaleString()} of {games.toLocaleString()}
        {played - counted > 0 ? ` (${(played - counted).toLocaleString()} thrown out because the host showed the car)` : ''}
      </p>
      {lanes.map((lane) => (
        <div key={lane.label} className="race-lane">
          <span className="race-label">{lane.label}</span>
          <span className="race-track">
            <span className="race-bar" style={{ width: `${counted ? (lane.wins / counted) * 100 : 0}%`, background: lane.color }} />
          </span>
          <span className="race-value">
            {lane.wins.toLocaleString()} wins{counted ? ` (${((lane.wins / counted) * 100).toFixed(1)}%)` : ''}
          </span>
        </div>
      ))}
    </div>
  );
}

export default Race;
