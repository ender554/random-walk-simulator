import { useState } from 'react';

/**
 * "Predict, then test": students who commit to a guess before watching learn far more
 * than those who just watch (Crouch et al. 2004). The guess stays on this device only.
 */
function Predict({ question, answer, placeholder = 'Your guess' }) {
  const [guess, setGuess] = useState('');
  const [locked, setLocked] = useState(false);
  const [revealed, setRevealed] = useState(false);

  return (
    <details className="predict">
      <summary>🤔 Predict first: {question}</summary>
      {!locked ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (guess.trim()) setLocked(true);
          }}
        >
          <label className="visually-hidden" htmlFor="predict-input">Your prediction</label>
          <input
            id="predict-input"
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder={placeholder}
          />
          <button type="submit">Lock in my guess</button>
        </form>
      ) : (
        <div>
          <p>
            Your guess: <strong>{guess}</strong>. Now run the simulation and see how close you were.
          </p>
          {revealed ? (
            <p className="predict-answer">{answer}</p>
          ) : (
            <button type="button" onClick={() => setRevealed(true)}>Show the answer</button>
          )}
        </div>
      )}
    </details>
  );
}

export default Predict;
