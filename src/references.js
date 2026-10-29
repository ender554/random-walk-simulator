// "Further reading" links for each tool, keyed by slug. Every link was checked to load and be
// free to read. kind: intro | deep | video | original. Ordered beginner-friendly first.

const GRINSTEAD_SNELL = 'https://math.dartmouth.edu/~prob/prob/prob.pdf';

export const references = {
  'random-walk': [
    {
      title: 'Random walk (Wikipedia)',
      url: 'https://en.wikipedia.org/wiki/Random_walk',
      kind: 'intro',
      note: 'A broad overview of lattice random walks, why the typical distance grows like √n, and how walks become Brownian motion and diffusion.',
    },
    {
      title: 'Brownian motion (Wikipedia)',
      url: 'https://en.wikipedia.org/wiki/Brownian_motion',
      kind: 'intro',
      note: "How Einstein's 1905 theory turned jiggling pollen into a random walk, with mean squared displacement growing in proportion to time.",
    },
    {
      title: '2-Dimensional Random Walk (Wolfram MathWorld)',
      url: 'https://mathworld.wolfram.com/2-DimensionalRandomWalk.html',
      kind: 'deep',
      note: 'A short derivation of the √N root-mean-square distance, and why a 2D lattice walk always returns to its start.',
    },
    {
      title: 'Random Walks in Euclidean Space (Grinstead & Snell, LibreTexts)',
      url: 'https://stats.libretexts.org/Bookshelves/Probability_Theory/Introductory_Probability_(Grinstead_and_Snell)/12%3A_Random_Walks/12.01%3A_Random_Walks_in_Euclidean_Space',
      kind: 'deep',
      note: "A free textbook chapter proving Pólya's result: walks always come home in 1D and 2D, but not in 3D.",
    },
    {
      title: 'Lecture 5: Stochastic Processes I (MIT OpenCourseWare)',
      url: 'https://ocw.mit.edu/courses/18-s096-topics-in-mathematics-with-applications-in-finance-fall-2013/resources/lecture-5-stochastic-processes-i/',
      kind: 'video',
      note: 'A full MIT lecture introducing random walks and Markov chains as stochastic processes.',
    },
  ],

  'gamblers-ruin': [
    {
      title: "Gambler's ruin (Wikipedia)",
      url: 'https://en.wikipedia.org/wiki/Gambler%27s_ruin',
      kind: 'intro',
      note: "The problem and its history, from Pascal's 1656 letter to Fermat to Huygens's solution, with the standard ruin formulas.",
    },
    {
      title: "Lecture 25: Random Walks, Tom Leighton (MIT OpenCourseWare)",
      url: 'https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-fall-2010/resources/lecture-25-random-walks/',
      kind: 'video',
      note: "An MIT lecture showing how even a small house edge at roulette makes ruin almost certain, using gambler's ruin as the example.",
    },
    {
      title: "Gambler's Ruin (Wolfram MathWorld)",
      url: 'https://mathworld.wolfram.com/GamblersRuin.html',
      kind: 'deep',
      note: 'A concise statement of the ruin probabilities for two players with finite stakes.',
    },
    {
      title: "Gambler's Ruin (Grinstead & Snell, LibreTexts)",
      url: "https://stats.libretexts.org/Bookshelves/Probability_Theory/Introductory_Probability_(Grinstead_and_Snell)/12%3A_Random_Walks/12.02%3A_Gambler's_Ruin",
      kind: 'deep',
      note: 'Derives the exact ruin probability and includes an exercise on American roulette at 18/38.',
    },
  ],

  'stock-price-simulator': [
    {
      title: 'Geometric Brownian motion (Wikipedia)',
      url: 'https://en.wikipedia.org/wiki/Geometric_Brownian_motion',
      kind: 'intro',
      note: 'The standard stock-price model, its closed-form solution with the μ − σ²/2 term, and its role in Black–Scholes.',
    },
    {
      title: 'Volatility tax (Wikipedia)',
      url: 'https://en.wikipedia.org/wiki/Volatility_tax',
      kind: 'intro',
      note: 'Why compounded (median) growth trails average growth by about σ²/2: the volatility drag you can see in the simulator.',
    },
    {
      title: 'Black–Scholes model (Wikipedia)',
      url: 'https://en.wikipedia.org/wiki/Black%E2%80%93Scholes_model',
      kind: 'intro',
      note: 'How the assumption that prices follow geometric Brownian motion leads to the famous option-pricing formula.',
    },
    {
      title: 'Geometric Brownian motion, lecture notes by Karl Sigman (Columbia University)',
      url: 'https://www.columbia.edu/~ks20/FE-Notes/4700-07-Notes-GBM.pdf',
      kind: 'deep',
      note: 'Course notes that build geometric Brownian motion from Brownian motion with drift and derive its lognormal distribution.',
    },
    {
      title: 'Lecture 19: Black-Scholes Formula, Risk-neutral Valuation (MIT OpenCourseWare)',
      url: 'https://ocw.mit.edu/courses/18-s096-topics-in-mathematics-with-applications-in-finance-fall-2013/resources/lecture-19-black-scholes-formula-risk-neutral-valuation/',
      kind: 'video',
      note: 'A full MIT lecture on risk-neutral pricing and how the Black–Scholes formula is derived.',
    },
  ],

  'diffusion-limited-aggregation': [
    {
      title: 'Diffusion-limited aggregation (Wikipedia)',
      url: 'https://en.wikipedia.org/wiki/Diffusion-limited_aggregation',
      kind: 'intro',
      note: 'The Witten & Sander (1981) model, where DLA shows up in nature, and its fractal dimension of about 1.71 in 2D.',
    },
    {
      title: 'DLA: Diffusion Limited Aggregation (Paul Bourke)',
      url: 'https://paulbourke.net/fractals/dla/',
      kind: 'intro',
      note: 'An illustrated explainer of how DLA clusters grow in 2D and 3D, with natural examples and notes on simulating them.',
    },
    {
      title: 'Convergent Calculation of the Asymptotic Dimension of Diffusion Limited Aggregates (arXiv)',
      url: 'https://arxiv.org/abs/cond-mat/0008053',
      kind: 'deep',
      note: 'A research paper that pins the 2D DLA fractal dimension down to D = 1.713 ± 0.003.',
    },
  ],

  'central-limit-theorem': [
    {
      title: 'Probability Distributions, including the Central Limit Theorem (Seeing Theory, Brown University)',
      url: 'https://seeing-theory.brown.edu/probability-distributions/index.html',
      kind: 'intro',
      note: 'A visual, interactive explanation of distributions that ends with a section on the central limit theorem.',
    },
    {
      title: 'Central limit theorem (Wikipedia)',
      url: 'https://en.wikipedia.org/wiki/Central_limit_theorem',
      kind: 'intro',
      note: 'A broad overview of the theorem, its variants and its history.',
    },
    {
      title: 'But what is the Central Limit Theorem? (3Blue1Brown)',
      url: 'https://www.youtube.com/watch?v=zeJD6dqJ5lo',
      kind: 'video',
      note: 'An animated walkthrough of why sums and averages of random draws turn into a bell curve, and why the spread shrinks like σ/√n.',
    },
    {
      title: 'Lesson 27: The Central Limit Theorem (Penn State STAT 414)',
      url: 'https://online.stat.psu.edu/stat414/Lesson27.html',
      kind: 'deep',
      note: 'A university lesson with the formal statement, worked examples and the normal approximation for sample means.',
    },
    {
      title: 'Central Limit Theorem (Wolfram MathWorld)',
      url: 'https://mathworld.wolfram.com/CentralLimitTheorem.html',
      kind: 'deep',
      note: 'A compact mathematical statement with a Fourier-transform derivation and references.',
    },
  ],

  'galton-board': [
    {
      title: 'Galton board (Wikipedia)',
      url: 'https://en.wikipedia.org/wiki/Galton_board',
      kind: 'intro',
      note: 'How the bean machine works and why the bins follow a binomial distribution that approaches the normal curve.',
    },
    {
      title: 'The Galton Board (D!NG, with Michael Stevens of Vsauce)',
      url: 'https://www.youtube.com/watch?v=UCmPmkHqHXk',
      kind: 'video',
      note: 'A short video of a physical Galton board building a bell curve out of chance.',
    },
    {
      title: 'Galton Board (Wolfram MathWorld)',
      url: 'https://mathworld.wolfram.com/GaltonBoard.html',
      kind: 'deep',
      note: 'The binomial model of the board, and the physical effects that make real boards differ from the ideal.',
    },
    {
      title: 'Lesson 28: Normal Approximation to the Binomial (Penn State STAT 414)',
      url: 'https://online.stat.psu.edu/stat414/Lesson28.html',
      kind: 'deep',
      note: 'The math behind the board: when and how a binomial distribution is approximated by a normal curve.',
    },
    {
      title: 'Natural Inheritance by Francis Galton, 1889 (galton.org)',
      url: 'https://galton.org/books/natural-inheritance/',
      kind: 'original',
      note: 'Galton\'s own book, free as a facsimile, where he describes and illustrates his "quincunx" apparatus.',
    },
  ],

  'coin-flip-simulator': [
    {
      title: 'Law of large numbers (Wikipedia)',
      url: 'https://en.wikipedia.org/wiki/Law_of_large_numbers',
      kind: 'intro',
      note: 'Why the running share of heads settles toward the true probability as the number of flips grows.',
    },
    {
      title: "Gambler's fallacy (Wikipedia)",
      url: 'https://en.wikipedia.org/wiki/Gambler%27s_fallacy',
      kind: 'intro',
      note: "Why a run of heads does not make tails \"due\", with famous real-world examples.",
    },
    {
      title: 'Law of large numbers (Khan Academy video)',
      url: 'https://www.youtube.com/watch?v=VpuN8vCQ--M',
      kind: 'video',
      note: 'A plain-language explanation built on coin tosses, including why the law does not mean outcomes "even out".',
    },
    {
      title: 'Introduction to Probability, Chapter 8 (Grinstead & Snell, free PDF)',
      url: GRINSTEAD_SNELL,
      kind: 'deep',
      note: 'A free university textbook whose Chapter 8 proves the law of large numbers, with coin-tossing examples throughout.',
    },
    {
      title: 'Run (Wolfram MathWorld)',
      url: 'https://mathworld.wolfram.com/Run.html',
      kind: 'deep',
      note: 'The math of streaks, including why the longest run of heads grows like log₂ n.',
    },
  ],

  'monty-hall': [
    {
      title: 'Monty Hall problem (Wikipedia)',
      url: 'https://en.wikipedia.org/wiki/Monty_Hall_problem',
      kind: 'intro',
      note: 'A full overview of the puzzle, why switching wins 2/3 of the time, the 1990 Parade column controversy and many-door variants.',
    },
    {
      title: 'Monty Hall Problem (Numberphile)',
      url: 'https://www.youtube.com/watch?v=4Lb-6rxZxx0',
      kind: 'video',
      note: 'Berkeley statistician Lisa Goldberg explains on video why switching doors is the better strategy.',
    },
    {
      title: 'Monty Hall Problem (Wolfram MathWorld)',
      url: 'https://mathworld.wolfram.com/MontyHallProblem.html',
      kind: 'deep',
      note: "A short mathematical entry with references to the problem's history and literature.",
    },
    {
      title: 'Introduction to Probability, Section 4.1 (Grinstead & Snell, free PDF)',
      url: GRINSTEAD_SNELL,
      kind: 'deep',
      note: 'Example 4.6 works through the problem with conditional probability, including the hidden assumptions about how Monty picks a door.',
    },
  ],

  'birthday-paradox': [
    {
      title: 'Understanding the Birthday Paradox (BetterExplained)',
      url: 'https://betterexplained.com/articles/understanding-the-birthday-paradox/',
      kind: 'intro',
      note: 'A friendly explanation of why 23 people are enough, told by counting pairs.',
    },
    {
      title: 'Birthday problem (Wikipedia)',
      url: 'https://en.wikipedia.org/wiki/Birthday_problem',
      kind: 'intro',
      note: 'The exact formula, the 50.7% figure for 23 people, approximations and generalizations.',
    },
    {
      title: '23 and Football Birthdays (Numberphile)',
      url: 'https://www.youtube.com/watch?v=a2ey9a70yY0',
      kind: 'video',
      note: 'Numberphile tests the paradox against the birthdays of real football teams.',
    },
    {
      title: 'Birthday Problem (Wolfram MathWorld)',
      url: 'https://mathworld.wolfram.com/BirthdayProblem.html',
      kind: 'deep',
      note: 'A rigorous treatment, including variants such as three people sharing a birthday.',
    },
    {
      title: 'Birthday attack (Wikipedia)',
      url: 'https://en.wikipedia.org/wiki/Birthday_attack',
      kind: 'deep',
      note: 'How the same math makes hash collisions far easier to find than intuition suggests.',
    },
  ],

  'monte-carlo-pi': [
    {
      title: 'Monte Carlo method (Wikipedia)',
      url: 'https://en.wikipedia.org/wiki/Monte_Carlo_method',
      kind: 'intro',
      note: 'An overview of Monte Carlo methods, opening with the quarter-circle π estimate, plus the Los Alamos history.',
    },
    {
      title: "Pi and Buffon's Matches (Numberphile)",
      url: 'https://www.youtube.com/watch?v=sJVivjuMfWA',
      kind: 'video',
      note: "Estimating π by dropping matches: a hands-on version of Buffon's needle.",
    },
    {
      title: 'Introduction to Probability, Section 2.1 (Grinstead & Snell, free PDF)',
      url: GRINSTEAD_SNELL,
      kind: 'deep',
      note: "A textbook account of estimating π by simulation and by Buffon's needle, with notes on accuracy.",
    },
    {
      title: 'Stan Ulam, John von Neumann, and the Monte Carlo Method (Los Alamos Science, 1987)',
      url: 'https://mcnp-green.lanl.gov/pdf_files/Article_1987_LAS_Eckhardt_131--141.pdf',
      kind: 'deep',
      note: "How the method began with Ulam's solitaire question and was developed at Los Alamos.",
    },
    {
      title: 'The Beginning of the Monte Carlo Method, N. Metropolis (Los Alamos Science, 1987)',
      url: 'https://mcnpx.lanl.gov/pdf_files/Article_1987_LAS_Metropolis_125--130.pdf',
      kind: 'original',
      note: 'A first-hand account by Nicholas Metropolis, who worked with Ulam and von Neumann and named the method.',
    },
  ],
};
