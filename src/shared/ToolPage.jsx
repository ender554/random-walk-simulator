import { useEffect } from 'react';
import SiteLayout from './SiteLayout';
import RelatedTools from './RelatedTools';
import FurtherReading from './FurtherReading';
import { ToolSlug } from './toolSlug';
import { liveTools, pathLabel } from '../tools';
import './tool.css';

const SLUGS = new Set(liveTools.map((t) => t.slug));

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// "2026-11-13" → "November 13, 2026", the same on the server and in every browser
function longDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

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

// Common frame for a tool page: "Step n of 3" and the path above the heading, the page's date under it
// (it matches dateModified and the sitemap),
// the tool itself (which places its own Next experiment block), related tools, then further reading.
//
// `workbench`: the B2 layout (docs/redesign-2026-11-10/B2-LOGIC.md). A left-aligned title row; the intro and
// date sit in their own block, which tool.css moves under the workbench on phones so the stage comes first.
function ToolPage({ slug, title, intro, workbench = false, children }) {
  useHopCount(slug);
  const updated = liveTools.find((t) => t.slug === slug)?.updated;
  const step = pathLabel(slug);
  const date = updated && (
    <p className="page-updated">
      Last updated <time dateTime={updated}>{longDate(updated)}</time>
    </p>
  );
  return (
    <ToolSlug.Provider value={slug}>
      <SiteLayout wide>
        <div className={workbench ? 'tool-main has-workbench' : 'tool-main'}>
          <header className={workbench ? 'page-header title-row' : 'page-header'}>
            {step && <p className="page-step">{step}</p>}
            <h1>{title}</h1>
            {!workbench && <p>{intro}</p>}
            {!workbench && date}
          </header>
          {workbench && (
            <div className="page-lede">
              <p>{intro}</p>
              {date}
            </div>
          )}
          {children}
          <RelatedTools slug={slug} />
          <FurtherReading slug={slug} />
        </div>
      </SiteLayout>
    </ToolSlug.Provider>
  );
}

export default ToolPage;
