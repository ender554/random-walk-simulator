import { pathGroups, toolPath } from '../tools';
import { SITE_NAME, STUDIO_NAME, STUDIO_URL } from '../site';
import SimulatorsMenu from './SimulatorsMenu';
import { isPresent } from './present';
import './site.css';

const isEmbedded = () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('embed') === '1';

function SiteLayout({ children, wide = false }) {
  // Present mode: the tool page draws its own frame (PresentFrame), with no site header or footer
  if (isPresent()) {
    return (
      <div className="site present-site">
        <main id="main" className="site-main">{children}</main>
      </div>
    );
  }

  // Embedded in a class site or LMS: just the tool, with a link back
  if (isEmbedded()) {
    const full = window.location.href.replace(/([?&])embed=1&?/, '$1').replace(/[?&]$/, '');
    return (
      <div className="site embed">
        <main id="main" className="site-main">{children}</main>
        <p className="footer-line embed-footer">
          <a href={full} target="_blank" rel="noopener noreferrer">Open in {SITE_NAME} ↗</a>
        </p>
      </div>
    );
  }

  return (
    <div className="site">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="site-header">
        <a className="brand" href="/">
          <img src="/favicon.svg" alt="" width="28" height="28" />
          {SITE_NAME}
        </a>
        <SimulatorsMenu>
          <a href="/teachers/" className="header-teachers">
            For teachers
          </a>
          <a href="/about/" className="header-about">
            About
          </a>
        </SimulatorsMenu>
      </header>

      <main id="main" className={wide ? 'site-main site-main-wide' : 'site-main'}>
        {children}
      </main>

      <footer className="site-footer">
        <nav aria-label="All tools" className="footer-tools">
          {pathGroups.map(({ category, steps, also }) => (
            <div key={category.id}>
              <h2>{category.name}</h2>
              <ul>
                {[...steps, ...also].map((t) => (
                  <li key={t.slug}>
                    {t.status === 'live' ? (
                      <a href={toolPath(t.slug)}>{t.name}</a>
                    ) : (
                      <span className="muted">{t.name} (soon)</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <p className="footer-line">
          {SITE_NAME} by{' '}
          <a href={STUDIO_URL} target="_blank" rel="noopener noreferrer">
            {STUDIO_NAME}
          </a>
          {' · '}
          <a href="/about/">About</a>
          {' · '}
          <a href="/teachers/">For teachers</a>
          {' · '}
          <a href="/contact/">Contact</a>
          {' · '}
          <a href="/privacy/">Privacy</a>
        </p>
      </footer>
    </div>
  );
}

export default SiteLayout;
