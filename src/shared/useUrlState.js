import { useEffect, useState } from 'react';
import { announceUrlChange } from './present';

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

function readUrl(defaults, choices) {
  // The build-time prerender has no URL: it renders the defaults
  if (typeof window === 'undefined') return { ...defaults };
  const params = new URLSearchParams(window.location.search);
  return Object.fromEntries(Object.entries(defaults).map(([key, value]) => {
    const parsed = parse(params.get(key), value);
    // A link can carry any text; a value the tool doesn't offer (a typo, "Knows" for "knows", an old
    // option name) falls back to the default instead of reaching code that looks it up
    return [key, choices[key] && !choices[key].includes(parsed) ? value : parsed];
  }));
}

/**
 * Settings that live in the URL, so any run can be shared or bookmarked.
 * Only values that differ from the defaults are written, which keeps links short.
 * `choices` lists the allowed values of each text setting that is picked from a list.
 * Returns [settings, set(key, value), reset()].
 */
export function useUrlState(defaults, choices = {}) {
  const [state, setState] = useState(() => readUrl(defaults, choices));

  useEffect(() => {
    const params = new URLSearchParams();
    // Keep page-level flags: embed and present mode
    const flags = new URLSearchParams(window.location.search);
    for (const flag of ['embed', 'present']) if (flags.get(flag) === '1') params.set(flag, '1');
    for (const [key, value] of Object.entries(state)) {
      if (value === defaults[key]) continue;
      params.set(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value));
    }
    const query = params.toString();
    const url = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
    window.history.replaceState(null, '', url);
    announceUrlChange();
    // defaults is a fresh object each render but constant in practice
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const set = (key, value) => setState((s) => ({ ...s, [key]: value }));
  const reset = () => setState(defaults);
  return [state, set, reset];
}
