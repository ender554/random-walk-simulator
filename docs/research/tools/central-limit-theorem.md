# Central Limit Theorem: feature research (2026-10-28)

**How to be the best:** the one modern, no-install CLT lab where students watch each sample being drawn and averaged, can break the theorem (skewness, Cauchy) as easily as confirm it, and get the "CLT calculator" probability answer checked against the simulation, all in one shareable link.

## Who uses it
- Intro and AP Statistics students learning that the CLT is about the distribution of means, not the raw data. Students also mix up sample size with number of samples ([UBC StatSpace](https://statspace.elearning.ubc.ca/demo/SampNonNorm_WhatWeLearned.jsp)).
- Teachers who need a demo they can project, with a sample-size slider, a normal-curve overlay and a guided activity ([CAUSEweb](https://www.causeweb.org/cause/resource-type/simulation?page=23)).
- "Central limit theorem calculator" searchers. Omni and Statology output only μ and σ/√n; neither computes P(x̄ > a).

## What competitors have
- OnlineStatBook: draw your own population, a choice of statistic, an animated sample, normal fit, and batches.
- SOCR: custom populations.
- StatKey: real data, a table of one sample, confidence intervals.
- Art of Stat: real skewed populations, a step-by-step build-up.
- CAUSEweb: Poisson and U-shaped distributions.
- None of these offer a Cauchy counterexample, a skewness slider, a QQ plot, a simulation-backed probability panel, CSV export, or a shareable link.

## Evidence
- Sample size vs. number of samples confusion ([DeepLearning.AI forum](https://community.deeplearning.ai/t/confused-between-sample-size-and-number-of-samples-in-clt-and-law-of-large-numbers/374828), [PhysicsForums](https://www.physicsforums.com/threads/central-limit-theorem-how-does-sample-size-affect-the-sampling-distribution.1065776/)).
- The n ≥ 30 rule fails for heavily skewed data: "may necessitate sample sizes beyond 100" ([JOSMA](https://ejournal.um.edu.my/index.php/JOSMA/article/view/63192)).
- A simulation can mislead students into thinking the center of the distribution of means moves toward μ as n grows ([IASE 2019](https://iase-web.org/documents/papers/sat2019/IASE2019%20Satellite%20170_OKTAVIA.pdf)).

## Prioritized features
Must:
1. Step-by-step sampling: show one sample's values, its mean, and where it lands.
2. Clear labels for sample size vs. number of samples, plus a live caption.
3. A probability panel with the normal approximation, the simulated share, and the region shaded.
4. Cauchy, Poisson, and a skewed distribution with a skewness slider.
5. A shareable URL.

Should:
6. Draw your own population.
7. A statistic picker.
8. Sample sizes compared side by side.
9. A normality check (QQ plot, skewness and kurtosis).

Could:
10. CSV export.
11. A confidence-interval coverage mode.
12. Real-data populations.
