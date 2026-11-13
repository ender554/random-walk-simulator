import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { liveTools, toolPath } from './src/tools.js'
import { prerender } from './scripts/prerender.js'

const root = fileURLToPath(new URL('.', import.meta.url))

// Every page that gets its own HTML file, by URL path, with the day of its last significant change
// (content, links, title, description or structured data): the sitemap's lastmod. Tools keep theirs in
// src/tools.js. Change a date whenever its page changes.
const pages = [
  { path: '/', updated: '2026-11-13' },
  ...liveTools.map((t) => ({ path: toolPath(t.slug), updated: t.updated })),
  { path: '/about/', updated: '2026-11-13' },
  { path: '/contact/', updated: '2026-11-12' },
  { path: '/privacy/', updated: '2026-11-12' },
]

// Fills __PAGE_UPDATED__ in a page's HTML (the dateModified in its structured data) with its date.
function pageDates() {
  return {
    name: 'page-dates',
    transformIndexHtml(html, ctx) {
      if (!html.includes('__PAGE_UPDATED__')) return html
      const page = pages.find((p) => ctx.path === p.path || ctx.path === `${p.path}index.html`)
      if (!page?.updated) throw new Error(`No updated date for ${ctx.path}`)
      return html.replaceAll('__PAGE_UPDATED__', page.updated)
    },
  }
}

// Emits sitemap.xml and robots.txt from the same page list the build uses.
function seoFiles(siteUrl) {
  return {
    name: 'seo-files',
    // Not in the prerender's server build (scripts/prerender.js)
    apply: (_, env) => env.command === 'build' && !env.isSsrBuild,
    generateBundle() {
      const urls = pages
        .map((p) => `  <url><loc>${siteUrl}${p.path}</loc><lastmod>${p.updated}</lastmod></url>`)
        .join('\n')
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      })
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root)
  const siteUrl = env.VITE_SITE_URL.replace(/\/$/, '')

  return {
    plugins: [react(), pageDates(), seoFiles(siteUrl), prerender()],
    build: {
      rollupOptions: {
        input: {
          ...Object.fromEntries(
            pages.map(({ path }) => [path === '/' ? 'index' : path.slice(1, -1), resolve(root, `.${path}index.html`)]),
          ),
          // Not in the sitemap; Cloudflare Pages serves it for unknown addresses
          404: resolve(root, '404.html'),
        },
      },
    },
  }
})
