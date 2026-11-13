import { useContext, useEffect, useRef } from 'react';
import { categories, paths, tools, toolPath } from '../tools';
import { ToolSlug } from './toolSlug';

// Groups in path order (puzzles first), each tool in its path's order, extras last.
const groups = paths.map((path) => ({
  category: categories.find((c) => c.id === path.category),
  tools: [...path.steps, ...(path.also ?? [])]
    .map((slug) => tools.find((t) => t.slug === slug))
    .filter((t) => t?.status === 'live'),
}));

// The header's site nav (the Simulators button, then `children`) and the menu the button opens: a native
// modal <dialog>, so the browser keeps focus inside, closes it on Esc and returns focus to the button.
// Full screen on phones, a centred panel on tablets, three columns with hooks from 1000 px
// (docs/redesign-2026-11-10/A4-LOGIC.md).
function SimulatorsMenu({ children }) {
  const current = useContext(ToolSlug);
  const dialog = useRef(null);
  const close = () => dialog.current?.close();

  // Coming back with the Back button can restore the page with the menu still open
  useEffect(() => {
    const onShow = (e) => e.persisted && close();
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);

  return (
    <>
      <nav aria-label="Site">
        <button
          type="button"
          className="menu-button"
          aria-haspopup="dialog"
          aria-controls="sim-menu"
          onClick={() => dialog.current?.showModal()}
        >
          Simulators
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {children}
      </nav>

      {/* A click outside the panel lands on the dialog itself (its backdrop): close */}
      <dialog
        id="sim-menu"
        ref={dialog}
        className="sim-menu"
        aria-labelledby="sim-menu-title"
        onClick={(e) => e.target === dialog.current && close()}
      >
        <div className="sim-menu-inner">
          <div className="sim-menu-head">
            <h2 id="sim-menu-title">Simulators</h2>
            <button type="button" className="sim-menu-close" aria-label="Close menu" onClick={close}>
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <nav aria-label="All simulators">
            <div className="sim-menu-groups">
              {groups.map(({ category, tools: list }) => (
                <div key={category.id}>
                  <h3>{category.name}</h3>
                  <ul>
                    {list.map((t) => {
                      const here = t.slug === current;
                      return (
                        <li key={t.slug}>
                          <a href={toolPath(t.slug)} data-hop="menu" aria-current={here ? 'page' : undefined}>
                            <img src={`/og/thumb/${t.slug}.png`} width="48" height="48" loading="lazy" alt="" />
                            <span className="sim-menu-text">
                              <span className="sim-menu-name">
                                {t.label}
                                {here && <span className="sim-menu-here" aria-hidden="true">You are here</span>}
                              </span>
                              <span className="sim-menu-hook">{t.short}</span>
                            </span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
            <ul className="sim-menu-more">
              <li>
                <a href="/">Home: all simulators</a>
              </li>
              <li>
                <a href="/about/">About</a>
              </li>
            </ul>
          </nav>
        </div>
      </dialog>
    </>
  );
}

export default SimulatorsMenu;
