import { useEffect } from 'react';

/**
 * Frequently asked questions, written to answer what people actually search for.
 * Also adds FAQPage structured data so search engines can show the answers.
 * items: [{ q: string, a: string }] — answers are plain text so the markup stays valid.
 */
function Faq({ items }) {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: items.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    });
    document.head.appendChild(script);
    return () => script.remove();
  }, [items]);

  return (
    <section className="faq prose" aria-labelledby="faq-heading">
      <h2 id="faq-heading">Frequently asked questions</h2>
      {items.map(({ q, a }) => (
        <details key={q}>
          <summary>{q}</summary>
          <p>{a}</p>
        </details>
      ))}
    </section>
  );
}

export default Faq;
