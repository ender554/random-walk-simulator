import SiteLayout from './SiteLayout';
import RelatedTools from './RelatedTools';
import './tool.css';

// Common frame for a tool page: heading, the tool itself, then related tools.
function ToolPage({ slug, title, intro, children }) {
  return (
    <SiteLayout>
      <div className="tool-main">
        <header className="page-header">
          <h1>{title}</h1>
          <p>{intro}</p>
        </header>
        {children}
        <RelatedTools slug={slug} />
      </div>
    </SiteLayout>
  );
}

export default ToolPage;
