# Launch runbook

Steps to take the suite live on its own domain and hand over the old Vercel site's search ranking.
Domain: `chancescope.com` (written as `NEW_DOMAIN` below).

## 1. Name and domain

- [ ] Pick the name; search it and its `.com` for clashes with existing brands
- [ ] Buy the domain at Porkbun (where the other Five54 domains are); a standard `.com` is about $11 a year
      with free WHOIS privacy. Check the renewal price and skip "premium" names
- [ ] Set `VITE_SITE_NAME` and `VITE_SITE_URL=https://NEW_DOMAIN` in `.env`; update `name` and `short_name`
      in `public/site.webmanifest`; run `npm run og` to redraw the social preview images

## 2. Point the domain at Cloudflare

Cloudflare Pages can only serve a bare domain (`NEW_DOMAIN`, not just `www.`) when Cloudflare runs its DNS.
The domain stays registered and billed at Porkbun; only the nameservers change.

1. Cloudflare dashboard (free account) → Add a domain → enter `NEW_DOMAIN` → Free plan
2. Cloudflare shows two nameservers (like `xxx.ns.cloudflare.com`)
3. Porkbun → Domain Management → the domain → Details → Authoritative Nameservers → Edit → replace
   Porkbun's with Cloudflare's two → Save
4. Wait for Cloudflare's email that the domain is active (minutes to a few hours)

## 3. Host on Cloudflare Pages (before touching Vercel)

1. Workers & Pages → Create → Pages → Connect to Git → `ender554/random-walk-simulator`
2. Production branch `math-suite` for now, build command `npm run build`, output directory `dist`,
   environment variable `NODE_VERSION=22`
3. Custom domains → add `NEW_DOMAIN`, then `www.NEW_DOMAIN`; add a redirect rule (Rules → Redirect Rules →
   "Redirect from WWW to root") so there is one address
4. Web Analytics → enable for the site (cookieless, so the privacy page stays accurate)
5. Check the live site: every page loads, `/sitemap.xml` lists `https://NEW_DOMAIN/...` URLs

## 4. Redirect the old Vercel site

Only after step 3 works, so the old address never points at a site that isn't up yet.
The old site (random-walk-simulator.vercel.app) was a single page: the random walk tool at `/`.

1. Merge `math-suite` into `main` with this `vercel.json` at the repo root. Vercel reads it; Cloudflare ignores it.

   ```json
   {
     "redirects": [
       { "source": "/", "destination": "https://NEW_DOMAIN/random-walk/", "permanent": true },
       { "source": "/:path*", "destination": "https://NEW_DOMAIN/", "permanent": true }
     ]
   }
   ```

2. Check that the old address now lands on `https://NEW_DOMAIN/random-walk/`
3. Cloudflare Pages → Settings → Builds → change the production branch to `main`
4. Keep the Vercel project for at least a year; it only serves redirects, so it stays within the Hobby plan

## 5. Search Console

- [ ] Add `NEW_DOMAIN` as a Domain property (verify through Cloudflare DNS)
- [ ] Submit `https://NEW_DOMAIN/sitemap.xml`
- [ ] Add `https://random-walk-simulator.vercel.app/` as a URL-prefix property and try Settings → Change of address
- [ ] Test a page in the Rich Results Test (FAQ and WebApplication data) and a link in a social card preview tool

## 6. Later: ads

Apply to AdSense after a month or two of traffic. Adding ads also means updating the privacy page
(ad cookies) and turning on a Google-certified consent banner for EU/UK visitors (AdSense's own is free).
