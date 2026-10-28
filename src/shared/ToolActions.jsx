import { useState } from 'react';
import { exportScaledPNG } from '../utils/export';

const SIZES = [
  { label: 'Standard', scale: 1 },
  { label: 'Large (2×)', scale: 2 },
  { label: 'Poster (4×)', scale: 4 },
];

/**
 * The buttons every tool shares: save image (choice of size), optional CSV data,
 * copy a link to these exact settings, reset, and fullscreen for the chart.
 */
function ToolActions({ image, onCsv, csvLabel = 'Download data (CSV)', onReset, fullscreenRef, children }) {
  const [scale, setScale] = useState(2);
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link:', window.location.href);
    }
  };

  const fullscreen = () => {
    const el = fullscreenRef?.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  return (
    <div className="tool-actions">
      <div className="button-row">
        {children}
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
        {fullscreenRef && <button type="button" onClick={fullscreen}>⛶ Fullscreen</button>}
        {onReset && <button type="button" onClick={onReset}>Reset settings</button>}
      </div>
      <p className="trust-note">
        Runs entirely in your browser, including phones and Chromebooks. Randomness comes from a seeded generator,
        so the same seed and settings always give the same result, and a copied link reproduces this exact run.
      </p>
    </div>
  );
}

export default ToolActions;
