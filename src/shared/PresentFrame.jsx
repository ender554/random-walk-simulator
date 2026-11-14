import { useEffect, useRef, useState } from 'react';
import { presentHref, useCurrentUrl } from './present';

// The address students type or scan: no protocol, no present flag, so phones open the normal page
const shortLink = (href) => {
  const url = new URL(presentHref(false, href));
  return `${url.host}${url.pathname}${url.search}`;
};

// A QR code drawn as one SVG path. The encoder loads only in present mode.
function QrCode({ text, className }) {
  const [qr, setQr] = useState(null);
  useEffect(() => {
    let live = true;
    // ECC level L keeps the modules as large as possible for scanning from across a room;
    // boostEcc raises it when the code would be the same size anyway. 4 modules of quiet zone, per the spec.
    import('uqr').then(({ encode }) => {
      if (live) setQr(encode(text, { ecc: 'L', boostEcc: true, border: 4 }));
    });
    return () => { live = false; };
  }, [text]);
  if (!qr) return <span className={className} />;
  let d = '';
  qr.data.forEach((row, y) => row.forEach((dark, x) => { if (dark) d += `M${x} ${y}h1v1h-1z`; }));
  return (
    <svg className={className} viewBox={`0 0 ${qr.size} ${qr.size}`} shapeRendering="crispEdges" aria-hidden="true">
      <rect width={qr.size} height={qr.size} fill="#ffffff" />
      <path d={d} fill="#000000" />
    </svg>
  );
}

const isTyping = (el) => el?.closest?.('input, textarea, select, [contenteditable="true"]');

/**
 * Present mode (?present=1): the tool's workbench alone, light and large, for a projector or a classroom panel.
 * A title bar with Exit, the predict question when the tool has one, the workbench, then the class link as a
 * QR code. Keys: Space runs, → goes to the next tool (still presenting), R starts over, Q shows the big QR code,
 * Esc leaves. Logic: docs/redesign-2026-11-10/C1-LOGIC.md.
 */
function PresentFrame({ title, question, children }) {
  const href = useCurrentUrl();
  const start = useRef(href);
  const qrDialog = useRef(null);
  const [full, setFull] = useState(() => Boolean(document.fullscreenElement));
  const canFull = typeof document !== 'undefined' && document.fullscreenEnabled;
  const link = shortLink(href);
  const target = presentHref(false, href);

  useEffect(() => {
    const onFull = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFull);
    return () => document.removeEventListener('fullscreenchange', onFull);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
      if (qrDialog.current?.open) return; // the dialog handles its own keys, Esc included
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === ' ') {
        // A focused button or link already acts on Space
        if (e.target.closest?.('button, a, summary')) return;
        const run = document.querySelector('.wb-rail .run-button');
        if (!run) return;
        e.preventDefault();
        run.click();
      } else if (key === 'ArrowRight') {
        const next = document.querySelector('.rail-next a');
        if (next) { e.preventDefault(); next.click(); }
      } else if (key === 'r') {
        window.location.assign(start.current);
      } else if (key === 'q') {
        qrDialog.current?.showModal();
      } else if (key === 'Escape') {
        window.location.assign(presentHref(false));
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  };

  return (
    <div className={question ? 'present-frame has-question' : 'present-frame'}>
      <header className="present-top">
        <h1>{title}</h1>
        {canFull && (
          <button type="button" className="present-chip" onClick={toggleFull}>
            {full ? 'Leave full screen' : 'Full screen'}
          </button>
        )}
        <a className="present-chip" href={target}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          Exit <kbd>Esc</kbd>
        </a>
      </header>

      {question && <p className="present-question">{question}</p>}

      <div className="present-body">{children}</div>

      <footer className="present-foot">
        <button type="button" className="present-qr-small" onClick={() => qrDialog.current?.showModal()}
          aria-label="Show the QR code for this run, large">
          <QrCode text={target} className="present-qr-art" />
        </button>
        <p className="present-link">
          <span>Same run on your device</span>
          <strong>{link}</strong>
        </p>
        <p className="present-keys">
          <span><kbd>Space</kbd> run</span> <span><kbd>→</kbd> next</span> <span><kbd>R</kbd> start over</span>{' '}
          <span><kbd>Q</kbd> QR code</span>
        </p>
      </footer>

      {/* Large enough to scan from the back of a room: about 10 times its width (C1-LOGIC.md) */}
      <dialog className="present-qr" ref={qrDialog} aria-labelledby="present-qr-title">
        <h2 id="present-qr-title">Scan for the same run</h2>
        <QrCode text={target} className="present-qr-big" />
        <p>{link}</p>
        <form method="dialog">
          <button type="submit" className="present-chip">Close <kbd>Esc</kbd></button>
        </form>
      </dialog>
    </div>
  );
}

export default PresentFrame;
