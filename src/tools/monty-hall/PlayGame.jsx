import { useState } from 'react';

const randomInt = (n) => Math.floor(Math.random() * n);

function newGame(doors) {
  return { doors, car: randomInt(doors), choice: null, other: null, final: null };
}

// One playable round: pick a door, the host opens goats, then stay or switch.
// The parent remounts it (key) when the number of doors changes.
function PlayGame({ doors, onResult }) {
  const [game, setGame] = useState(() => newGame(doors));

  const phase = game.final !== null ? 'done' : game.choice !== null ? 'decide' : 'pick';

  const pick = (i) => {
    let other = game.car;
    if (i === game.car) {
      other = randomInt(doors - 1);
      if (other >= i) other += 1;
    }
    setGame({ ...game, choice: i, other });
  };

  const decide = (switched) => {
    const final = switched ? game.other : game.choice;
    setGame({ ...game, final });
    onResult(switched, final === game.car);
  };

  const isOpen = (i) => phase === 'done' || (phase === 'decide' && i !== game.choice && i !== game.other);

  const message = {
    pick: 'Pick a door. One hides a car; the rest hide goats.',
    decide: `The host opened ${doors - 2 === 1 ? 'a door with a goat' : `${doors - 2} doors with goats`}. Stay with door ${game.choice + 1}, or switch to door ${game.other + 1}?`,
    done: game.final === game.car ? '🎉 You won the car!' : '🐐 A goat. Better luck next time.',
  }[phase];

  return (
    <div className="monty-game">
      <p className="monty-message" aria-live="polite">{message}</p>
      <div className="door-row">
        {Array.from({ length: doors }, (_, i) => {
          const open = isOpen(i);
          const prize = i === game.car ? '🚗' : '🐐';
          const classes = ['door'];
          if (i === game.choice) classes.push('chosen');
          if (phase === 'done' && i === game.final) classes.push('final');
          return (
            <button
              key={i}
              type="button"
              className={classes.join(' ')}
              disabled={phase !== 'pick'}
              onClick={() => pick(i)}
              aria-label={open ? `Door ${i + 1}: ${i === game.car ? 'car' : 'goat'}` : `Door ${i + 1}`}
            >
              <span className="door-face" aria-hidden="true">{open ? prize : '🚪'}</span>
              <span className="door-number">{i + 1}</span>
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
        {phase === 'done' && (
          <button type="button" onClick={() => setGame(newGame(doors))}>Play again</button>
        )}
      </div>
    </div>
  );
}

export default PlayGame;
