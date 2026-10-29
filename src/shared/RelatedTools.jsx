import { relatedTools, toolPath } from '../tools';

function RelatedTools({ slug }) {
  const related = relatedTools(slug);

  return (
    <section className="related" aria-labelledby="related-heading">
      <h2 id="related-heading">Related simulators</h2>
      <ul className="tool-grid">
        {related.map((t) => (
          <li key={t.slug} className="tool-card">
            {t.status === 'live' ? (
              <a href={toolPath(t.slug)}>
                <h3>{t.name}</h3>
              </a>
            ) : (
              <h3>
                {t.name} <span className="badge">Coming soon</span>
              </h3>
            )}
            <p>{t.short}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default RelatedTools;
