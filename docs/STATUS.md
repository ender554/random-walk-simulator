# Status

state: LIVE  
phase: 2  
budget_hours: 16  
hard_max_hours: 20  
hours_used: 1  
launched: 2026-10-29 at https://chancescope.com  
next_action: Watch Search Console indexing; apply to AdSense once pages are indexed (about late November 2026).  
blocked_by: none

## Done

- Suite structure: hub, shared layout, About, Privacy, per-tool pages
- Random Walk Simulator moved into the suite
- Gambler's Ruin Simulator live (compares simulated ruin with the exact formula)
- Central Limit Theorem Simulator live (five source distributions, normal overlay, zoom)
- Phase 2 (approved by Josh 2026-10-28): the remaining seven tools:
  Stock Price Path, Diffusion-Limited Aggregation, Galton Board, Coin Flip, Monty Hall, Birthday Paradox, Monte Carlo π
- SEO basics: per-page metadata, canonical URLs, structured data, sitemap, robots.txt

## Launch

Full steps: [LAUNCH.md](LAUNCH.md).

- [x] Favicon set, web manifest, and social preview images (`npm run og`)
- [x] Name ChanceScope, domain chancescope.com (Porkbun registrar, Cloudflare DNS)
- [x] Two more tools live
- [x] Cloudflare Pages project `chancescope`, production branch `main`; www redirects to the bare domain
- [x] 404 page, so unknown addresses return a real 404
- [x] random-walk-simulator.vercel.app redirects every path to chancescope.com (`vercel.json`); keep the Vercel project until at least 2027-10
- [x] Stripe backup code rotated (2026-10-29); file and donation link removed
- [x] Cloudflare Web Analytics (enabled on the Pages project; the entry is named chancescope.pages.dev but counts chancescope.com)
- [x] Search Console: Domain property verified via Cloudflare DNS (keep the google-site-verification TXT record); sitemap submitted, 13 pages
- [ ] AdSense, once indexed: ads.txt, ad code, privacy page update, consent banner for EU/UK

Leave Cloudflare's "Add security headers" managed transform off: its X-Frame-Options header would break embedding.
