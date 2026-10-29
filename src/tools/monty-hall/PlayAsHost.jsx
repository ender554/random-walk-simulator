import { useState } from 'react';

const randomInt = (n) => Math.floor(Math.random() * n);

function newRound(doors) {
  return { car: randomInt(doors), pick: randomInt(doors), opened: [], mistake: false };
}

/**
 * Play the host: you know where the car is and must open goat doors until one other door is left.
 * Seeing the game from the host's side is one of the explanations that convinces people
 * (Scientific American, citing a 2003 study).
 */
function PlayAsHost({ doors }) {
  const [round, setRound] = useState(() => newRound(doors));
  const [forced, setForced] = useState({ rounds: 0, forced: 0 });
  const toOpen = doors - 2;
  const done = round.opened.length >= toOpen;
  const pickedCar = round.pick === round.car;

  const open = (i) => {
    if (done || i === round.pick || round.opened.includes(i)) return;
    if (i === round.car) {
      setRound({ ...round, mistake: true });
      return;
    }
    const opened = [...round.opened, i];
    setRound({ ...round, opened, mistake: false });
    if (opened.length >= toOpen) {
      setForced((f) => ({ rounds: f.rounds + 1, forced: f.forced + (pickedCar ? 0 : 1) }));
    }
  };

  const closedOther = done ? Array.from({ length: doors }, (_, i) => i).find((i) => i !== round.pick && !round.opened.includes(i)) : null;

  let message = `The contestant picked door ${round.pick + 1}. The car is behind door ${round.car + 1}. Open ${toOpen === 1 ? 'one goat door' : `${toOpen} goat doors`}.`;
  if (round.mistake) message = "You can't open the car door: the host never reveals the car. Pick a goat door.";
  else if (done && pickedCar) message = `The contestant happened to pick the car, so you could leave any goat door closed. Switching to door ${closedOther + 1} loses.`;
  else if (done) message = `You had no choice: you had to leave door ${closedOther + 1} closed, because it hides the car. Switching wins.`;

  return (
    <div className="monty-game">
      <p className="monty-message" aria-live="polite">{message}</p>
      <div className={`door-row${doors > 10 ? ' many' : ''}`}>
        {Array.from({ length: doors }, (_, i) => {
          const isOpen = round.opened.includes(i);
          const classes = ['door'];
          if (i === round.pick) classes.push('chosen');
          if (isOpen) classes.push('opened');
          return (
            <button
              key={i}
              type="button"
              className={classes.join(' ')}
              disabled={done || i === round.pick || isOpen}
              onClick={() => open(i)}
              aria-label={`Door ${i + 1}${i === round.pick ? ', contestant\'s pick' : ''}, ${i === round.car ? 'car' : 'goat'}${isOpen ? ', opened' : ''}`}
            >
              <span className="door-face" aria-hidden="true">{isOpen ? '🐐' : i === round.car ? '🚗' : '🚪'}</span>
              <span className="door-number">{i + 1}</span>
            </button>
          );
        })}
      </div>
      <div className="button-row">
        {done && <button type="button" onClick={() => setRound(newRound(doors))}>Next contestant</button>}
      </div>
      {forced.rounds > 0 && (
        <p className="result-line">
          You were forced to leave the car closed in <strong>{forced.forced} of {forced.rounds}</strong> rounds
          ({Math.round((forced.forced / forced.rounds) * 100)}%). Those are exactly the rounds where switching wins:
          about {doors - 1} in {doors}.
        </p>
      )}
    </div>
  );
}

export default PlayAsHost;
