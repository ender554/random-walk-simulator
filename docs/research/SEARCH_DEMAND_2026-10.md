# Search demand and pain points: the ten simulators

Research date: 2026-10-28. Done with web search, Google autocomplete and Wikipedia pageviews.

## Limits on the evidence

- **No exact search volumes.** There was no access to Keyword Planner, Ahrefs or Google Trends. Demand ratings rest on:
  1. English Wikipedia pageviews (Oct 2025 – Sep 2026, human traffic), which measure interest in a topic, not tool searches.
  2. Google autocomplete: a suggestion like "X simulator" means people type it often, but not how often.
  3. Web search results, which are a stand-in for Google page 1, not a copy of it.
- Reddit and StackOverflow couldn't be reached, so complaints come from forums, reviews, and the tools' own notices.
- YouTube view counts couldn't be verified; any quoted counts are marked unverified.

### Wikipedia monthly pageviews

| Article | Avg views/month |
|---|---|
| Monty Hall problem | ~57,300 |
| Monte Carlo method (broad, not π-specific) | ~42,500 |
| Birthday problem | ~40,000 |
| Central limit theorem | ~30,100 |
| Law of large numbers | ~19,100 |
| Random walk | ~13,000 |
| Coin flipping | ~8,100 |
| Geometric Brownian motion | ~5,500 |
| Gambler's ruin | ~5,300 |
| Galton board (+ Bean machine redirect ~580) | ~3,350 |
| Diffusion-limited aggregation | ~1,200 |

## Summary

| Tool | Demand | Competition | Opportunity |
|---|---|---|---|
| Monty Hall | High | Weak: best-known interactive (cut-the-knot) is a dead Java applet | **Best** |
| Central limit theorem | High | Medium: Seeing Theory is archived; many old Java applets; calculator sites | **Strong** |
| Birthday paradox | High | Strong: Omni and many calculators | Good, if calculator + simulation + explanation |
| Coin flip | Very high generic, medium for learning queries | Strong for "flip a coin" (Google's own widget); medium for "coin flip simulator" | Target the learning long tail |
| Random walk | Medium | Few academic/hobby tools | Medium; add the finance angle |
| Galton board | Medium (mostly people shopping for the desk toy) | PhET "Plinko Probability" is strong | Medium |
| Stock price / GBM | Low–medium | No polished free browser tool found | Gap is real, traffic uncertain |
| Gambler's ruin | Low–medium, formula-driven | Main interactive tool is a dead Java applet | Small but easy |
| Monte Carlo π | Low–medium, coding/classroom | Bare widgets | Small |
| DLA | Low, niche (physics + generative art) | Java applets, Wolfram, code | Showcase page |

## Problems in existing tools that the whole site should avoid

1. **Dead Java, Flash and plugin applets.** Seen on cut-the-knot (Monty Hall), probability.ca (Gambler's Ruin), alife (DLA) and WISE. Rossman/Chance and OnlineStatBook were historically Java; LearnChemE and Wolfram need a player. Say on the page that ours runs in any browser, including phones.
2. **No mobile support.** For example, an itch.io Galton board says "Mobile devices not supported yet".
3. **Visuals with too little explanation.** This was the main criticism of Seeing Theory. Add a "what you're seeing" section and FAQs answering the questions people actually search.
4. **Abandoned sites.** Seeing Theory is now archived. Show a last-updated date.
5. **"Is it really random?"** Many pages exist only to answer this. Say which generator we use, keep seeds, and add shareable URLs that carry the settings.
6. **Confusing parameters.** The biggest one is sample size vs. number of samples in the CLT. Label controls clearly and show the formula next to them.
7. **Ad clutter.** Most coin-flip and calculator competitors are ad-heavy SEO pages (inference).

## Keyword notes

- **Monty Hall:** "monty hall simulator", "monty hall problem simulation", "explained", "explained simply", "is wrong", "proof". Searchers often don't believe the answer, and a simulation is what convinces them: Erdős reportedly stayed unconvinced until he saw one.
- **Central limit theorem:** "central limit theorem simulation" and "central limit theorem calculator" (calculator sites target it). Also "clt vs law of large numbers", "is n = 30 enough", "standard error".
- **Birthday paradox:** "birthday paradox calculator", "formula", "23 people". A common confusion: the chance that someone shares *my* birthday is a different, much lower probability.
- **Coin flip:** don't target "flip a coin" (Google's own widget, and a decision-making intent). Target "coin flip simulator", "flip a coin 100 times", "law of large numbers simulation", "biased coin simulator". Keep one instant Flip button for casual visitors. People also ask whether a coin flip is really 50/50; physical flips show a ~51% same-side bias.
- **Galton board:** use "Galton board", "Plinko probability" (the PhET name teachers know) and "quincunx". Avoid "bean machine": its autocomplete is GTA, coffee and diesel parts.
- **Random walk:** add "random walk theory / stock market" and link to the stock page; answer "will it return to the start?" (Pólya: yes in 1D and 2D, not in 3D).
- **Stock price:** use "Monte Carlo stock price simulation" in the title, not only "geometric Brownian motion". Plain "stock simulator" probably means paper trading. Keep the not-financial-advice note.
- **Gambler's ruin:** "formula", "probability", "expected time", "markov chain"; the searches look like coursework.
- **Monte Carlo π:** "estimate pi using monte carlo" (coding intent, so a short code snippet would help); "estimate pi by dropping toothpicks" (Buffon's needle).
- **DLA:** physics students and generative-art coders (Grasshopper, terrain). Image export matters.

## Main competitor to watch

**The Coatless Professor** (web-apps.thecoatlessprofessor.com) ranks for both "random walk simulator" and "coin flip simulator", and pairs feature-rich tools with long write-ups. It is the closest match to what Chance Lab is building.

## Strongest page competitors by tool

- Monty Hall: Wikipedia; cut-the-knot (dead Java); GeoGebra game; Alex Kasman's game; Berkeley SticiGui.
- Central limit theorem: OnlineStatBook; Rossman/Chance; Seeing Theory (archived); Omni, Statology, Pearson calculators.
- Birthday paradox: Omni, calculate.co.nz, Redcrab, dCode, bushe.co.
- Coin flip: Google widget; uplup, flip-a-coin.com; CalculatorSoup; Omni; Coatless Professor.
- Galton board: PhET Plinko Probability; WaveSpeed; phitter.io; OSP Singapore.
- Random walk: Coatless Professor; University of Utah; Osaka Metropolitan University.
- Stock price: Python tutorials (Towards Data Science, QuantStart); an old WHOI/MathWorks demo.
- Gambler's ruin: MetricGate; probability.ca (dead Java); Burkardt's code.
- Monte Carlo π: GeoGebra; UNLV; OSP Singapore.
- DLA: Wolfram Demonstration; Ashley Mills JS; Coding Train; alife (dead Java).
