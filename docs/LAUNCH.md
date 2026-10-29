# Launch runbook

Steps to take the suite live on its own domain and hand over the old Vercel site's search ranking.
Replace `NEW_DOMAIN` with the real domain (for example `chancelab.com`) everywhere below.

## 1. Before anything goes live

- [ ] Buy the domain at Cloudflare Registrar (a standard `.com`, about $10–11 a year; skip "premium" names)
- [ ] Set `VITE_SITE_NAME` and `VITE_SITE_URL=https://NEW_DOMAIN` in `.env`
- [ ] If the name changed: update `name` and `short_name` in `public/site.webmanifest`, then run `npm run og`
      to redraw the social preview images with the new name

## 2. Host on Cloudflare Pages

1. Dashboard → Workers & Pages → Create → Pages → Connect to Git → `ender554/random-walk-simulator`
2. Production branch `main`, build command `npm run build`, output directory `dist`
3. After the first deploy: Custom domains → add `NEW_DOMAIN` (and `www.NEW_DOMAIN`, redirecting to the bare domain)
4. Web Analytics → enable for the site (cookieless, so the privacy page stays accurate)

## 3. Redirect the old Vercel site

The old site (random-walk-simulator.vercel.app) was a single page: the random walk tool at `/`.
Add this `vercel.json` at the repo root in the same merge to `main` that launches the suite. Vercel reads it; Cloudflare ignores it.

```json
{
  "redirects": [
    { "source": "/", "destination": "https://NEW_DOMAIN/random-walk/", "permanent": true },
    { "source": "/:path*", "destination": "https://NEW_DOMAIN/", "permanent": true }
  ]
}
```

Keep the Vercel project for at least a year; it only serves redirects, so it stays within the Hobby plan.

## 4. Search Console

- [ ] Add `NEW_DOMAIN` as a Domain property (verify through Cloudflare DNS)
- [ ] Submit `https://NEW_DOMAIN/sitemap.xml`
- [ ] Add `https://random-walk-simulator.vercel.app/` as a URL-prefix property and try Settings → Change of address
- [ ] Test a page in the Rich Results Test (FAQ and WebApplication data) and a link in a social card preview tool

## 5. Later: ads

Apply to AdSense after a month or two of traffic. Adding ads also means updating the privacy page
(ad cookies) and turning on a Google-certified consent banner for EU/UK visitors (AdSense's own is free).
