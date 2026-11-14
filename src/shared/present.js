import { useEffect, useState } from 'react';
import { applyLightPalette } from '../utils/theme';

// Present mode: the same tool page with ?present=1, sized for a classroom projector or panel.
// Logic and checks: docs/redesign-2026-11-10/C1-LOGIC.md.

const URL_EVENT = 'chancescope:url';

export const isPresent = () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('present') === '1';

// Called once before the first render: light palette for the charts, the .present class for the CSS.
export function startPresent() {
  if (!isPresent()) return;
  applyLightPalette();
  document.documentElement.classList.add('present');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#ffffff');
}

// Chart text grows with the window height, so it stays about the same share of the screen: 13 px labels
// become about 21 px on a 768 px tall window and stop at 29 px. 1 outside present mode.
export function presentZoom() {
  if (!isPresent()) return 1;
  return Math.min(2.2, Math.max(1.3, window.innerHeight / 480));
}

// This page's address with present mode on or off. Students' links drop it, so phones get the normal page.
export function presentHref(on, href = window.location.href) {
  const url = new URL(href);
  if (on) url.searchParams.set('present', '1');
  else url.searchParams.delete('present');
  url.hash = '';
  return url.toString();
}

// useUrlState rewrites the address with history.replaceState, which fires no event of its own
export const announceUrlChange = () => window.dispatchEvent(new Event(URL_EVENT));

// The current address, kept up to date as settings and seeds change
export function useCurrentUrl() {
  const [href, setHref] = useState(() => (typeof window === 'undefined' ? '' : window.location.href));
  useEffect(() => {
    const update = () => setHref(window.location.href);
    window.addEventListener(URL_EVENT, update);
    window.addEventListener('popstate', update);
    return () => {
      window.removeEventListener(URL_EVENT, update);
      window.removeEventListener('popstate', update);
    };
  }, []);
  return href;
}
