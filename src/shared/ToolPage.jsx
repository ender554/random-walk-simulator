import SiteLayout from './SiteLayout';
import RelatedTools from './RelatedTools';
import FurtherReading from './FurtherReading';
import { LAST_UPDATED } from '../site';
import './tool.css';

// Common frame for a tool page: heading, the tool itself, further reading, then related tools.
function ToolPage({ slug, title, intro, children }) {
  return (
    <SiteLayout wide>
      <div className="tool-main">
        <header className="page-header">
          <h1>{title}</h1>
          <p>{intro}</p>
        </header>
        {children}
        <FurtherReading slug={slug} />
        <p className="trust-note">Last updated {LAST_UPDATED}.</p>
        <RelatedTools slug={slug} />
      </div>
    </SiteLayout>
  );
}

export default ToolPage;
