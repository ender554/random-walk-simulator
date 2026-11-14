import { useContext, useEffect, useRef, useState } from 'react';
import { nextTools, toolPath } from '../tools';
import { ToolSlug } from './toolSlug';

/**
 * Guess, then test it: the guess is a number, and "Test it" sets the tool up for that exact
 * scenario, runs it, and shows the result next to the guess.
 * `onTest(guess)` does the setup and returns { verdict, detail } to display.
 *
 * With `onSkip` it is the workbench's predict card: titled "Predict first", with a one-tap Skip
 * while the tool holds its answer back, and the form folds away once the result shows.
 */
function Challenge({ question, unit = '', placeholder, min, max, onTest, onSkip, title = '🎯 Challenge' }) {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [again, setAgain] = useState(false);
  const resultRef = useRef(null);
  // After the reveal, point to the page's main next pick while the surprise is fresh
  const next = nextTools(useContext(ToolSlug))[0]?.tool;
  const predict = Boolean(onSkip);
  const showForm = !predict || !result || again;

  // The predict card's form folds away on submit, so move focus to the result instead of losing it
  useEffect(() => {
    if (predict && result && !again) resultRef.current?.focus({ preventScroll: true });
  }, [predict, result, again]);

  const test = (e) => {
    e.preventDefault();
    const guess = Number(text);
    if (text.trim() === '' || !Number.isFinite(guess)) return;
    const clamped = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, guess));
    setResult({ guess: clamped, ...onTest(clamped) });
    setHistory((h) => [...h, clamped]);
    setAgain(false);
  };

  const heading = <h2 id="challenge-heading">{title}</h2>;

  return (
    <section className={predict ? 'challenge predict-card' : 'challenge'} aria-labelledby="challenge-heading">
      {predict ? (
        <div className="challenge-head">
          {heading}
          {!result && <button type="button" className="text-button" onClick={onSkip}>Skip</button>}
        </div>
      ) : heading}
      {showForm && (
        <>
          <p>{question}</p>
          <form onSubmit={test}>
            <label className="visually-hidden" htmlFor="challenge-input">Your guess</label>
            <input id="challenge-input" type="number" step="any" min={min} max={max} value={text}
              placeholder={placeholder} onChange={(e) => setText(e.target.value)} />
            {unit && <span>{unit}</span>}
            <button type="submit">{result ? 'Test again' : 'Test it'}</button>
          </form>
        </>
      )}
      {result && (
        <div className="challenge-result" aria-live="polite" ref={resultRef} tabIndex={predict ? -1 : undefined}>
          <p><strong>{result.verdict}</strong></p>
          <p>{result.detail}</p>
          {next && (
            <p className="challenge-next">
              Surprised? <a href={toolPath(next.slug)} data-hop="surprised">Try the {next.name} →</a>
            </p>
          )}
          {predict && !again && (
            <button type="button" className="text-button" onClick={() => setAgain(true)}>Guess again</button>
          )}
        </div>
      )}
      {history.length > 1 && (
        <p className="challenge-history">Your guesses so far: {history.join(', ')}</p>
      )}
    </section>
  );
}

export default Challenge;
