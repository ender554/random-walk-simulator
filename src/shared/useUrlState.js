import { useEffect, useState } from 'react';

// Read a value from the query string, coerced to the type of its default.
function parse(raw, fallback) {
  if (raw === null) return fallback;
  if (typeof fallback === 'number') {
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  }
  if (typeof fallback === 'boolean') return raw === '1' || raw === 'true';
  return raw;
}

function readUrl(defaults) {
  const params = new URLSearchParams(window.location.search);
  return Object.fromEntries(Object.entries(defaults).map(([key, value]) => [key, parse(params.get(key), value)]));
}

/**
 * Settings that live in the URL, so any run can be shared or bookmarked.
 * Only values that differ from the defaults are written, which keeps links short.
 * Returns [settings, set(key, value), reset()].
 */
export function useUrlState(defaults) {
  const [state, setState] = useState(() => readUrl(defaults));

  useEffect(() => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(state)) {
      if (value === defaults[key]) continue;
      params.set(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value));
    }
    const query = params.toString();
    const url = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
    window.history.replaceState(null, '', url);
    // defaults is a fresh object each render but constant in practice
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const set = (key, value) => setState((s) => ({ ...s, [key]: value }));
  const reset = () => setState(defaults);
  return [state, set, reset];
}
