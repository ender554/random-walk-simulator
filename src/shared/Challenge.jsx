import { useState } from 'react';

/**
 * Guess, then test it: the guess is a number, and "Test it" sets the tool up for that exact
 * scenario, runs it, and shows the result next to the guess. Each try is a fresh run.
 * `onTest(guess)` does the setup and returns { verdict, detail } to display.
 */
function Challenge({ question, unit = '', placeholder, min, max, onTest }) {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const test = (e) => {
    e.preventDefault();
    const guess = Number(text);
    if (text.trim() === '' || !Number.isFinite(guess)) return;
    const clamped = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, guess));
    setResult({ guess: clamped, ...onTest(clamped) });
    setHistory((h) => [...h, clamped]);
  };

  return (
    <section className="challenge" aria-labelledby="challenge-heading">
      <h2 id="challenge-heading">🎯 Challenge</h2>
      <p>{question}</p>
      <form onSubmit={test}>
        <label className="visually-hidden" htmlFor="challenge-input">Your guess</label>
        <input id="challenge-input" type="number" step="any" min={min} max={max} value={text}
          placeholder={placeholder} onChange={(e) => setText(e.target.value)} />
        {unit && <span>{unit}</span>}
        <button type="submit">{result ? 'Test again' : 'Test it'}</button>
      </form>
      {result && (
        <div className="challenge-result" aria-live="polite">
          <p><strong>{result.verdict}</strong></p>
          <p>{result.detail}</p>
        </div>
      )}
      {history.length > 1 && (
        <p className="challenge-history">Your guesses so far: {history.join(', ')}</p>
      )}
    </section>
  );
}

export default Challenge;
