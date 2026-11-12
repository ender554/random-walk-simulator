// Server entry for the build-time prerender (scripts/prerender.js): every page's HTML file and the
// component that fills its #root. Pages render with their default settings, as a visitor with no
// query string sees them.
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import Hub from './pages/hub/Hub';
import About from './pages/about/About';
import Contact from './pages/contact/Contact';
import Privacy from './pages/privacy/Privacy';
import NotFound from './pages/not-found/NotFound';

// src/tools/<slug>/App.jsx is served at /<slug>/
const tools = import.meta.glob('./tools/*/App.jsx', { eager: true, import: 'default' });

const pages = {
  'index.html': Hub,
  'about/index.html': About,
  'contact/index.html': Contact,
  'privacy/index.html': Privacy,
  '404.html': NotFound,
  ...Object.fromEntries(Object.entries(tools).map(([path, App]) => [`${path.split('/')[2]}/index.html`, App])),
};

export const files = Object.keys(pages);

export function render(file) {
  const Page = pages[file];
  return renderToString(
    <StrictMode>
      <Page />
    </StrictMode>,
  );
}
