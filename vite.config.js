import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { liveTools, toolPath } from './src/tools.js'

const root = fileURLToPath(new URL('.', import.meta.url))

// Every page that gets its own HTML file, keyed by URL path.
const pages = [
  '/',
  ...liveTools.map((t) => toolPath(t.slug)),
  '/about/',
  '/privacy/',
]

// Emits sitemap.xml and robots.txt from the same page list the build uses.
function seoFiles(siteUrl) {
  return {
    name: 'seo-files',
    apply: 'build',
    generateBundle() {
      const today = new Date().toISOString().slice(0, 10)
      const urls = pages
        .map((p) => `  <url><loc>${siteUrl}${p}</loc><lastmod>${today}</lastmod></url>`)
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
    plugins: [react(), seoFiles(siteUrl)],
    build: {
      rollupOptions: {
        input: Object.fromEntries(
          pages.map((p) => [p === '/' ? 'index' : p.slice(1, -1), resolve(root, `.${p}index.html`)]),
        ),
      },
    },
  }
})
