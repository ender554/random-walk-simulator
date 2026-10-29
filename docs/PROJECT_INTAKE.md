# Project Intake - Chance Lab

Working name. The product name lives in `.env` (`VITE_SITE_NAME`) and can change
before launch without touching code.

## Identity

- Date: 2026-10-27
- Experiment class: `COMMERCIAL-CANDIDATE`
- Type: static web utility suite
- Strategic role: second search-driven Five54 product, after the Epoch Lens calibration
- Owner: Five54 Precision ("Chance Lab by Five54 Precision", same pattern as WinCon)
- Origin: grows out of the Random Walk Simulator (random-walk-simulator.vercel.app, ~10 clicks/month)

## One sentence

A student, teacher or curious learner uses Chance Lab to see a probability idea
happen (random walks, bell curves, famous puzzles) instead of only reading the formula.

## User and problem

- Primary user: Student in an intro probability, statistics or physics course
- Secondary users: Teachers presenting in class; finance learners; generative artists
- Situation: A concept from class (Brownian motion, central limit theorem, Monty Hall) doesn't click
- Repeated job: Run a quick simulation, change a parameter, see the result
- Current workaround: Textbook figures, YouTube videos, one-off simulators scattered across sites
- Limitation of alternatives: Most are single, dated tools with no shared seeds, no export, and no links to the next related idea

## Wedge

One place for related probability simulators that share the same controls,
deterministic seeds (a teacher can say "everyone enter seed 42"), PNG export and
explanations, with every tool linking to the ones the same learner needs next.
Unproven: this is the claim the 90-day review tests.

## Scope

Phase 1 (this intake):

- Hub page listing the whole suite by category, upcoming tools marked "coming soon"
- Random Walk Simulator moved into the suite
- Two new tools, chosen from the ones that reuse the random walk engine or have the highest search intent
- About and Privacy pages
- Per-page title, description, canonical, Open Graph and structured data; sitemap and robots.txt

Later phases (each needs its own go-ahead):

- Phase 2, the remaining seven tools: approved by Josh 2026-10-28, built on a dev branch, not deployed
- Phase 3: ads

- Estimated focused hours: 16
- Scope-freeze hour: 15
- Hard maximum: 20
- Calendar ceiling: 14 days from the first implementation session
- Incremental launch cost: domain only (~$12/year)
- Monthly cost ceiling: $5

## Discovery

- Primary channel: Exact-intent search, one page per tool
- Candidate intents: `random walk simulator`, `brownian motion simulator`,
  `central limit theorem simulator`, `galton board simulator`, `monty hall simulator`
- Strongest alternatives: University applets, PhET-style simulations, single-purpose simulator sites

## Monetization

- Model: Free; display ads after the site has enough content and traffic for AdSense approval
- Paid value: None; nothing is paywalled
- Price: $0

## Risks

- Sensitive data: None collected; simulations run in the browser
- External API: None
- Platform dependency: Static hosting (Cloudflare)
- Legal or regulatory: Ads require a privacy policy and cookie consent where applicable; avoid names close to existing brands (e.g. Coolmath)
- Maintenance: Expected near zero
- Primary risk: Search traffic stays near zero; ad revenue is negligible below ~100k monthly page views

## Hard gates

- [x] One primary user
- [x] One useful job
- [x] One primary workflow
- [x] Phase 1 credibly fits within 20 hours
- [x] Public launch credibly fits within 14 days
- [x] Discovery path exists for observation
- [x] Pre-traction cost is no more than $5/month
- [x] No uncapped generated cost
- [x] No unnecessary sensitive-data storage
- [x] No high-touch service
- [x] Independent retirement is possible
- [x] Builder selected the project for preparation
- [ ] Final product name and domain chosen

## Measurement

Cloudflare Web Analytics and Google Search Console. Review discovery about 30, 90
and 180 days after launch. Outside those reviews, no development unless a security,
correctness or cost problem appears, or the next phase is approved.

## Decision

- Decision: `NEXT`
- Approval scope: Phase 1
- Next action: see `STATUS.md`
