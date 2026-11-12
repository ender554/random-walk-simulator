// Vite plugin: after the client build, render every page to HTML so the served files carry their
// text (for search engines, AdSense review and a faster first paint). The browser then hydrates it
// (src/shared/mount.jsx). Runs inside `vite build`, so no extra build command is needed.
import { readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';

const EMPTY_ROOT = '<div id="root"></div>';
const ENTRY = 'src/prerender.jsx';

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });
}

// Numbers print as "1,234.5" in the HTML, whatever the build machine's locale.
// mount.jsx only hydrates in browsers that format numbers the same way.
function withUsNumbers(fn) {
  const original = Number.prototype.toLocaleString;
  Number.prototype.toLocaleString = function (locales, options) {
    return original.call(this, locales ?? 'en-US', options);
  };
  try {
    return fn();
  } finally {
    Number.prototype.toLocaleString = original;
  }
}

export function prerender() {
  let root;
  let outDir;
  let mode;

  return {
    name: 'prerender',
    // The client build only; the server build below loads this config too
    apply: (_, env) => env.command === 'build' && !env.isSsrBuild,
    configResolved(config) {
      root = config.root;
      outDir = resolve(root, config.build.outDir);
      mode = config.mode;
    },
    async closeBundle() {
      const ssrDir = resolve(root, 'dist-ssr');
      await build({
        root,
        mode,
        logLevel: 'warn',
        build: { ssr: ENTRY, outDir: ssrDir, emptyOutDir: true, copyPublicDir: false },
      });
      const { files, render } = await import(pathToFileURL(join(ssrDir, 'prerender.js')).href);

      const pending = new Set(files);
      const problems = [];
      withUsNumbers(() => {
        for (const file of htmlFiles(outDir)) {
          const name = relative(outDir, file).split('\\').join('/');
          const html = readFileSync(file, 'utf8');
          if (!html.includes(EMPTY_ROOT)) continue;
          if (!pending.has(name)) {
            problems.push(`${name} has an empty #root but no entry in ${ENTRY}`);
            continue;
          }
          pending.delete(name);
          writeFileSync(file, html.replace(EMPTY_ROOT, `<div id="root">${render(name)}</div>`));
        }
      });
      for (const name of pending) problems.push(`${ENTRY} lists ${name}, but the build has no such page`);
      rmSync(ssrDir, { recursive: true, force: true });
      if (problems.length) throw new Error(`Prerender failed:\n${problems.join('\n')}`);
      console.log(`prerendered ${files.length} pages`);
    },
  };
}
