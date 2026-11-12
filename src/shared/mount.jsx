import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './base.css';

// The build prerenders each page with its default settings and US number format
// (scripts/prerender.js). Reuse that HTML when this visitor would see the same thing;
// otherwise (settings in the URL, embed mode, another number format) render fresh over it.
const matchesPrerender = () => window.location.search === '' && (1234.5).toLocaleString() === '1,234.5';

// Every page entry calls this with its top-level element.
export function mount(page) {
  const root = document.getElementById('root');
  const tree = <StrictMode>{page}</StrictMode>;
  if (root.hasChildNodes() && matchesPrerender()) hydrateRoot(root, tree);
  else createRoot(root).render(tree);
}
