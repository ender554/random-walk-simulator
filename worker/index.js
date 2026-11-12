// The Worker in front of the static site. Files in dist/ are served before this code runs, so it only
// sees requests that match no file. It records tool-to-tool clicks at POST /api/hop (sent by
// src/shared/ToolPage.jsx) and hands everything else back to the static files, which keeps the 404 page.
import { liveTools } from '../src/tools.js';

const SLUGS = new Set(liveTools.map((t) => t.slug));
const VIA = new Set(['next-1', 'next-2', 'next-3', 'surprised', 'related', 'text', 'other']);

async function recordHop(request, env) {
  if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } });
  // Only the site's own pages may report clicks
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) return new Response(null, { status: 403 });

  const text = await request.text();
  if (text.length > 200) return new Response(null, { status: 413 });
  let hop;
  try {
    hop = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400 });
  }
  const { from, to, via } = hop ?? {};
  if (!SLUGS.has(from) || !SLUGS.has(to) || from === to || !VIA.has(via)) return new Response(null, { status: 400 });

  // One row per click: the date, the two tools and the link. No IP address, user agent or cookie.
  await env.HOPS.prepare('INSERT INTO hops (day, from_tool, to_tool, via) VALUES (?, ?, ?, ?)')
    .bind(new Date().toISOString().slice(0, 10), from, to, via)
    .run();
  return new Response(null, { status: 204 });
}

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname === '/api/hop') return recordHop(request, env);
    return env.ASSETS.fetch(request);
  },
};
