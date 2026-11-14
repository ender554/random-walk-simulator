import { useState } from 'react';
import { exportScaledPNG } from '../utils/export';
import { resultsText } from './resultsText';

const SIZES = [
  { label: 'Standard', scale: 1 },
  { label: 'Large (2×)', scale: 2 },
  { label: 'Poster (4×)', scale: 4 },
];

const TRUST = 'Runs entirely in your browser, including phones and Chromebooks. Randomness comes from a seeded generator, so the same seed and settings always give the same result, and a copied link reproduces this exact run.';

/**
 * The buttons every tool shares: save image (choice of size), optional CSV data,
 * copy a link to these exact settings, reset, and fullscreen for the chart. In the workbench menu, Copy my results
 * comes first: the numbers on the stage, any prediction and the link, as text to hand in (resultsText.js).
 * `menu` folds them into one "Share & export" disclosure, for the workbench layout; extra export buttons
 * (children) go in it too.
 */
function ToolActions({ image, onCsv, csvLabel = 'Download data (CSV)', onReset, fullscreenRef, menu = false, children }) {
  const [scale, setScale] = useState(2);
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [resultsCopied, setResultsCopied] = useState(false);

  const copyResults = async () => {
    const text = resultsText();
    try {
      await navigator.clipboard.writeText(text);
      setResultsCopied(true);
      setTimeout(() => setResultsCopied(false), 2000);
    } catch {
      window.prompt('Copy your results:', text);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link:', window.location.href);
    }
  };

  const copyEmbed = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('embed', '1');
    const code = `<iframe src="${url.href}" width="100%" height="900" style="border:0" title="${document.title}" loading="lazy"></iframe>`;
    try {
      await navigator.clipboard.writeText(code);
      setEmbedCopied(true);
      setTimeout(() => setEmbedCopied(false), 2000);
    } catch {
      window.prompt('Copy this embed code:', code);
    }
  };

  const fullscreen = () => {
    const el = fullscreenRef?.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  const results = (
    <button type="button" onClick={copyResults} aria-live="polite">
      {resultsCopied ? '✓ Results copied' : '📋 Copy my results'}
    </button>
  );

  const buttons = (
    <>
      {image && (
        <span className="export-group">
          <button
            type="button"
            onClick={() => exportScaledPNG(image.draw, image.size, scale, image.filename)}
          >
            Save image
          </button>
          <label className="visually-hidden" htmlFor="export-size">Image size</label>
          <select id="export-size" value={scale} onChange={(e) => setScale(Number(e.target.value))}>
            {SIZES.map((s) => (
              <option key={s.scale} value={s.scale}>
                {s.label} · {image.size.width * s.scale}×{image.size.height * s.scale}
              </option>
            ))}
          </select>
        </span>
      )}
      {onCsv && <button type="button" onClick={onCsv}>{csvLabel}</button>}
      <button type="button" onClick={copyLink} aria-live="polite">
        {copied ? '✓ Link copied' : '🔗 Copy link'}
      </button>
      <button type="button" onClick={copyEmbed}>{embedCopied ? '✓ Embed code copied' : '</> Embed'}</button>
      {fullscreenRef && <button type="button" onClick={fullscreen}>⛶ Fullscreen</button>}
      {onReset && <button type="button" onClick={onReset}>Reset settings</button>}
    </>
  );

  if (menu) {
    return (
      <details className="tool-actions share-menu">
        <summary>Share &amp; export</summary>
        <div className="button-row">{results}{children}{buttons}</div>
        <p className="trust-note">{TRUST}</p>
      </details>
    );
  }

  return (
    <div className="tool-actions">
      <div className="button-row">
        {children}
        {buttons}
      </div>
      <p className="trust-note">{TRUST}</p>
    </div>
  );
}

export default ToolActions;
