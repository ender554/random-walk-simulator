import { runLengths } from '../../utils/coinFlips';

const MAX_SHOWN = 1000;

// The flips as H/T cells, newest last, with the longest streak outlined.
function Sequence({ seq, count }) {
  const start = Math.max(0, count - MAX_SHOWN);
  const lengths = runLengths(seq, count);
  // Locate the longest streak's position
  let best = 0;
  let bestStart = 0;
  let pos = 0;
  for (const len of lengths) {
    if (len > best) {
      best = len;
      bestStart = pos;
    }
    pos += len;
  }
  const cells = [];
  for (let i = start; i < count; i += 1) {
    const inBest = i >= bestStart && i < bestStart + best && best > 1;
    cells.push(
      <span key={i} className={`flip ${seq[i] ? 'heads' : 'tails'}${inBest ? ' best' : ''}`}>{seq[i] ? 'H' : 'T'}</span>,
    );
  }
  return (
    <div className="sequence" aria-label={`${count} flips; longest streak ${best}.`}>
      {start > 0 && <span className="muted">…{start.toLocaleString()} earlier flips </span>}
      {cells}
    </div>
  );
}

export default Sequence;
