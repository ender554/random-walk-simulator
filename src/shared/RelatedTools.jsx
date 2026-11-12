import { nextTools, relatedTools, toolPath } from '../tools';

// More tools, after the article. Skips the page's Next experiment picks so the two lists don't repeat.
function RelatedTools({ slug }) {
  const related = relatedTools(slug, 4, nextTools(slug).map((n) => n.tool.slug));

  return (
    <section className="related" aria-labelledby="related-heading">
      <h2 id="related-heading">Related simulators</h2>
      <ul className="tool-grid">
        {related.map((t) => (
          <li key={t.slug} className="tool-card with-thumb">
            {t.status === 'live' && <img src={`/og/thumb/${t.slug}.png`} alt="" width="72" height="72" loading="lazy" />}
            <div>
              {t.status === 'live' ? (
                <a href={toolPath(t.slug)} data-hop="related">
                  <h3>{t.name}</h3>
                </a>
              ) : (
                <h3>
                  {t.name} <span className="badge">Coming soon</span>
                </h3>
              )}
              <p>{t.short}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default RelatedTools;
