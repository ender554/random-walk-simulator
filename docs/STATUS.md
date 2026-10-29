# Status

state: BUILD  
phase: 2  
budget_hours: 16  
hard_max_hours: 20  
hours_used: 1  
launch_deadline: unset  
next_action: Review the tool-upgrades PR; choose the final name and domain, then deploy to Cloudflare.  
blocked_by: name and domain (Josh)

## Done

- Suite structure: hub, shared layout, About, Privacy, per-tool pages
- Random Walk Simulator moved into the suite
- Gambler's Ruin Simulator live (compares simulated ruin with the exact formula)
- Central Limit Theorem Simulator live (five source distributions, normal overlay, zoom)
- Phase 2 (approved by Josh 2026-10-28, not deployed): the remaining seven tools on the more-tools branch:
  Stock Price Path, Diffusion-Limited Aggregation, Galton Board, Coin Flip, Monty Hall, Birthday Paradox, Monte Carlo π
- SEO basics: per-page metadata, canonical URLs, structured data, sitemap, robots.txt

## Before launch

- [ ] Final name in `.env` (`VITE_SITE_NAME`) and domain (`VITE_SITE_URL`)
- [x] Two more tools live
- [ ] Deploy to Cloudflare; enable Web Analytics
- [ ] Submit sitemap in Google Search Console
- [ ] Redirect random-walk-simulator.vercel.app to the new random walk page
- [ ] Remove `stripe_backup_code.txt` from the repo after rotating the code in Stripe
