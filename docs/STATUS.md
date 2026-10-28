# Status

state: BUILD  
phase: 1  
budget_hours: 16  
hard_max_hours: 20  
hours_used: 1  
launch_deadline: unset  
next_action: Choose the final name and domain; pick the two phase 1 tools.  
blocked_by: name and domain (Josh)

## Done

- Suite structure: hub, shared layout, About, Privacy, per-tool pages
- Random Walk Simulator moved into the suite
- SEO basics: per-page metadata, canonical URLs, structured data, sitemap, robots.txt

## Before launch

- [ ] Final name in `.env` (`VITE_SITE_NAME`) and domain (`VITE_SITE_URL`)
- [ ] Two more tools live
- [ ] Deploy to Cloudflare; enable Web Analytics
- [ ] Submit sitemap in Google Search Console
- [ ] Redirect random-walk-simulator.vercel.app to the new random walk page
- [ ] Remove `stripe_backup_code.txt` from the repo after rotating the code in Stripe
