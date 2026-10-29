import { useState } from 'react';
import { hostLeavesClosed } from '../../utils/montyHall';

const randomInt = (n) => Math.floor(Math.random() * n);

function newGame(doors) {
  return { car: randomInt(doors), choice: null, other: null, voided: false, final: null };
}

function chanceLabel(value) {
  if (value === 0) return '0';
  if (value === 1) return '1';
  return value === 0.5 ? '1/2' : value.toFixed(value < 0.1 ? 3 : 2);
}

/**
 * One playable round with the chosen host rule. Each closed door shows its chance of hiding the
 * car, so the "your door vs. all the others" grouping is visible as the host opens doors.
 * The parent remounts it (key) when the doors or rule change.
 */
function PlayGame({ doors, rule, onResult }) {
  const [game, setGame] = useState(() => newGame(doors));
  const phase = game.final !== null ? 'done' : game.voided ? 'void' : game.choice !== null ? 'decide' : 'pick';

  const pick = (i) => {
    const result = hostLeavesClosed(rule, doors, game.car, i, Math.random);
    setGame({ ...game, choice: i, other: result.other, voided: result.voided });
    if (result.voided) onResult(null, false);
  };

  const decide = (switched) => {
    const final = switched ? game.other : game.choice;
    setGame({ ...game, final });
    onResult(switched, final === game.car);
  };

  const isOpen = (i) => phase === 'done' || ((phase === 'decide' || phase === 'void') && i !== game.choice && i !== game.other);

  // Chance each closed door hides the car, given what the player has seen
  const chance = (i) => {
    if (phase === 'pick') return 1 / doors;
    if (isOpen(i) && phase !== 'done') return 0;
    if (rule === 'random') return 0.5;
    return i === game.choice ? 1 / doors : (doors - 1) / doors;
  };

  const goats = doors - 2 === 1 ? 'a door with a goat' : `${doors - 2} doors with goats`;
  const message = {
    pick: `Pick a door. One of the ${doors} hides a car; the rest hide goats. Each door has a 1 in ${doors} chance.`,
    decide:
      rule === 'random'
        ? `The host opened ${goats} by luck. Since he didn't know, your door and door ${game.other + 1} are now equally likely: 1/2 each.`
        : `The host opened ${goats}. Your door still has its original 1 in ${doors} chance. The other ${doors - 1} doors had a ${doors - 1} in ${doors} chance together, and it all now sits on door ${game.other + 1}.`,
    void: '😬 The host opened the car by accident! In the "host doesn\'t know" version these games are thrown out.',
    done: game.final === game.car ? '🎉 You won the car!' : '🐐 A goat. Better luck next time.',
  }[phase];

  return (
    <div className="monty-game">
      <p className="monty-message" aria-live="polite">{message}</p>
      <div className={`door-row${doors > 10 ? ' many' : ''}`}>
        {Array.from({ length: doors }, (_, i) => {
          const open = isOpen(i);
          const prize = i === game.car ? '🚗' : '🐐';
          const classes = ['door'];
          if (i === game.choice) classes.push('chosen');
          if (phase === 'done' && i === game.final) classes.push('final');
          if (open && phase !== 'done') classes.push('opened');
          return (
            <button
              key={i}
              type="button"
              className={classes.join(' ')}
              disabled={phase !== 'pick'}
              onClick={() => pick(i)}
              aria-label={open ? `Door ${i + 1}: ${i === game.car ? 'car' : 'goat'}` : `Door ${i + 1}, chance ${chanceLabel(chance(i))}`}
            >
              <span className="door-face" aria-hidden="true">{open ? prize : '🚪'}</span>
              <span className="door-number">{i + 1}</span>
              {doors <= 10 && phase !== 'done' && phase !== 'void' && (
                <span className="door-chance" aria-hidden="true">{chanceLabel(chance(i))}</span>
              )}
            </button>
          );
        })}
      </div>
      <div className="button-row">
        {phase === 'decide' && (
          <>
            <button type="button" onClick={() => decide(false)}>Stay with door {game.choice + 1}</button>
            <button type="button" onClick={() => decide(true)}>Switch to door {game.other + 1}</button>
          </>
        )}
        {(phase === 'done' || phase === 'void') && (
          <button type="button" onClick={() => setGame(newGame(doors))}>Play again</button>
        )}
      </div>
    </div>
  );
}

export default PlayGame;
