import { useEffect } from 'react';
import SiteLayout from './SiteLayout';
import RelatedTools from './RelatedTools';
import FurtherReading from './FurtherReading';
import { ToolSlug } from './toolSlug';
import { LAST_UPDATED } from '../site';
import { liveTools } from '../tools';
import './tool.css';

const SLUGS = new Set(liveTools.map((t) => t.slug));

// Count clicks that open another tool: the two tools and which link (its data-hop, else "other").
// Received by worker/index.js; nothing else about the visitor is sent.
function useHopCount(slug) {
  useEffect(() => {
    const onClick = (e) => {
      const link = e.target.closest?.('a[href]');
      if (!link || !navigator.sendBeacon) return;
      const url = new URL(link.href, window.location.href);
      const to = url.pathname.split('/')[1];
      if (url.origin !== window.location.origin || to === slug || !SLUGS.has(to)) return;
      navigator.sendBeacon('/api/hop', JSON.stringify({ from: slug, to, via: link.dataset.hop ?? 'other' }));
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [slug]);
}

// Common frame for a tool page: heading, the tool itself (which places its own Next experiment block),
// related tools, then further reading.
function ToolPage({ slug, title, intro, children }) {
  useHopCount(slug);
  return (
    <ToolSlug.Provider value={slug}>
      <SiteLayout wide>
        <div className="tool-main">
          <header className="page-header">
            <h1>{title}</h1>
            <p>{intro}</p>
          </header>
          {children}
          <RelatedTools slug={slug} />
          <FurtherReading slug={slug} />
          <p className="trust-note">Last updated {LAST_UPDATED}.</p>
        </div>
      </SiteLayout>
    </ToolSlug.Provider>
  );
}

export default ToolPage;
