import { categories, tools, toolPath } from '../tools';
import { SITE_NAME, STUDIO_NAME, STUDIO_URL } from '../site';
import './site.css';

function SiteLayout({ children }) {
  return (
    <div className="site">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="site-header">
        <a className="brand" href="/">
          {SITE_NAME}
        </a>
        <nav aria-label="Site">
          <a href="/#tools">Tools</a>
          <a href="/about/">About</a>
        </nav>
      </header>

      <main id="main" className="site-main">
        {children}
      </main>

      <footer className="site-footer">
        <nav aria-label="All tools" className="footer-tools">
          {categories.map((category) => (
            <div key={category.id}>
              <h2>{category.name}</h2>
              <ul>
                {tools
                  .filter((t) => t.category === category.id)
                  .map((t) => (
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
          <a href="/privacy/">Privacy</a>
        </p>
      </footer>
    </div>
  );
}

export default SiteLayout;
