import { Component, Fragment, StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { startPresent } from './present';
import './base.css';

// The build prerenders each page with its default settings and US number format
// (scripts/prerender.js). Reuse that HTML when this visitor would see the same thing;
// otherwise (settings in the URL, embed mode, another number format) render fresh over it.
const matchesPrerender = () => window.location.search === '' && (1234.5).toLocaleString() === '1,234.5';

// The address without the tool's settings: only the page-level flags stay (embed and present mode)
function withoutSettings() {
  const params = new URLSearchParams(window.location.search);
  const kept = new URLSearchParams();
  for (const flag of ['embed', 'present']) if (params.get(flag) === '1') kept.set(flag, '1');
  return kept.toString();
}

/**
 * Safety net: if the page throws while drawing, React removes it and leaves a blank screen. When the
 * address carries settings, the likely cause is a value the tool can't handle, so drop them and draw the
 * page again with the defaults. Otherwise, or if that fails too, show a short note with a reload link.
 */
class Recover extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false, retried: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    const query = withoutSettings();
    if (this.state.retried || query === window.location.search.slice(1)) return;
    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
    this.setState({ failed: false, retried: true });
  }

  render() {
    if (this.state.failed) {
      return (
        <p className="recover-note">
          Something went wrong drawing this page. <a href={window.location.pathname}>Reload it</a>.
        </p>
      );
    }
    // A new key on the retry mounts the page afresh, so it reads the cleaned address
    return <Fragment key={this.state.retried ? 'retry' : 'first'}>{this.props.children}</Fragment>;
  }
}

// Every page entry calls this with its top-level element.
export function mount(page) {
  startPresent();
  const root = document.getElementById('root');
  const tree = <StrictMode><Recover>{page}</Recover></StrictMode>;
  if (root.hasChildNodes() && matchesPrerender()) hydrateRoot(root, tree);
  else createRoot(root).render(tree);
}
