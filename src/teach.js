// Teaching notes: the /teachers/ page's topic list, and the "For teachers" section (#teach) on Monty Hall,
// Birthday and the CLT. Plain data, so the prerender can use it. Logic, sources and checked numbers:
// docs/redesign-2026-11-10/C2-LOGIC.md. Numbers quoted here come from the tools' own code and seeds.

// The AP Statistics course framework effective 2026–27 (five units). Topic titles are College Board's.
export const AP_SOURCE = 'https://apcentral.collegeboard.org/courses/ap-statistics';
export const AP_TOPICS = {
  '2.3': 'Estimating Probabilities Using Simulation',
  '2.4': 'Introduction to Probability',
  '2.6': 'Conditional Probability',
  '2.9': 'Parameters of Random Variables',
  '2.10': 'The Binomial Distribution',
  '2.11': 'The Normal Distribution',
  '2.12': 'Sampling Distributions and the Central Limit Theorem',
};

// Common Core State Standards for Mathematics, in our own short words. (+) marks the advanced standards.
export const CCSS_SOURCE = 'https://www.thecorestandards.org/Math/';
export const CCSS = {
  '7.SP.C.6': 'estimate a probability from long-run relative frequency',
  '7.SP.C.8': 'probabilities of compound events, including by simulation',
  'HSS-CP.A.1': 'events as subsets of a sample space, including complements',
  'HSS-CP.A.3': 'conditional probability as P(A and B)/P(B)',
  'HSS-CP.B.6': "conditional probability as the share of B's outcomes that are also in A",
  'HSS-CP.B.9': '(+) permutations and combinations for compound events',
  'HSS-IC.A.2': 'decide if a model is consistent with simulated results',
  'HSS-IC.B.4': 'estimate a mean or proportion, with a margin of error from simulation',
  'HSS-ID.A.4': 'fit a normal distribution, and recognize when that is not appropriate',
  'HSS-MD.B.5': '(+) weigh the outcomes of a decision by expected value',
  'HSS-MD.B.7': '(+) analyze decisions and strategies using probability',
};

// The /teachers/ page, by course topic. `teach`: the tool whose page has a full "For teachers" section.
export const topics = [
  {
    id: 'conditional',
    name: 'Conditional probability',
    tools: ['monty-hall'],
    teach: 'monty-hall',
    question: 'Out of 100 games, how many would you win by always switching?',
    ap: ['2.3', '2.6'],
    ccss: ['HSS-CP.A.3', 'HSS-CP.B.6', 'HSS-IC.A.2', 'HSS-MD.B.7'],
  },
  {
    id: 'complements',
    name: 'Complements and matches',
    tools: ['birthday-paradox'],
    teach: 'birthday-paradox',
    question: 'How many people make a better than even chance that two of them share a birthday?',
    ap: ['2.3', '2.4'],
    ccss: ['7.SP.C.8', 'HSS-CP.A.1', 'HSS-CP.B.9'],
  },
  {
    id: 'sampling',
    name: 'Sampling distributions',
    tools: ['galton-board', 'central-limit-theorem'],
    teach: 'central-limit-theorem',
    question: 'Each draw has a spread (standard deviation) of 1. What is the spread of averages of 25 draws?',
    ap: ['2.10', '2.11', '2.12'],
    ccss: ['HSS-IC.B.4', 'HSS-ID.A.4'],
  },
  {
    id: 'large-numbers',
    name: 'Law of large numbers',
    tools: ['coin-flip-simulator'],
    question: 'Flip a fair coin 100 times. What is the longest run of the same face in a row you would expect?',
    ap: ['2.3'],
    ccss: ['7.SP.C.6', 'HSS-IC.A.2'],
  },
  {
    id: 'estimation',
    name: 'Simulation and estimation',
    tools: ['monte-carlo-pi'],
    question: 'Throw 1,000 random darts at the square. How close to π will the estimate usually land?',
    ap: ['2.3'],
    ccss: ['7.SP.C.6', '7.SP.C.8'],
  },
  {
    id: 'expected',
    name: 'Random processes and expected value',
    tools: ['gamblers-ruin', 'random-walk', 'stock-price-simulator'],
    question: 'Start with $20 and bet $1 on red at a single-zero roulette wheel until you have $40 or nothing. What is your chance of going broke?',
    ap: ['2.3', '2.9'],
    ccss: ['HSS-MD.B.5'],
  },
];

// The "For teachers" section on a tool page
export const teachNotes = {
  'monty-hall': {
    topic: 'conditional',
    goals: [
      'Estimate a probability by simulation and compare it with the exact answer: switching wins 2 games in 3.',
      'Explain the answer with conditional probability: your first pick is right 1 time in 3, and the host’s choice depends on where the car is.',
      'See that the host’s rule matters: if the host opens a door at random, switching and staying win equally often (in the games where the car stays hidden).',
    ],
    plan: [
      'Before class, type a class seed (your class name works) under More settings, then press Present.',
      'Play one round on the screen. The class votes: stay or switch?',
      'Ask the question on the screen. Everyone writes a number out of 100. Type the middle answer into Predict first and press Test it.',
      'Students scan the QR code. Every phone runs the same 1,000 games.',
      'Discuss.',
    ],
    discuss: [
      'Your first pick is right 1 time in 3. In the other 2, the host has to leave the car closed. What does switching win then?',
      'Try 100 doors. Why does switching feel obvious now?',
      'Set the host to open a door at random. Why do switching and staying now win equally often?',
    ],
    misconception:
      '“Two doors are left, so it’s 50–50.” Two outcomes are not always equally likely. The host never opens your door or the car’s door, so the door the host opens depends on where the car is.',
  },
  'birthday-paradox': {
    topic: 'complements',
    goals: [
      'Use the complement: the chance of at least one match is 1 minus the chance of no match.',
      'Count pairs: 23 people make 253 pairs, and any pair can match.',
      'Compare the exact answer (50.7% for 23 people) with simulated rooms.',
    ],
    plan: [
      'Before class, type a class seed under More settings, then press Present.',
      'Ask the question on the screen. Everyone writes a number of people.',
      'Fill a room one person at a time until two share a birthday. Start a new room a few times; the page lists where each first match came.',
      'Type the middle guess into Predict first and press Test it. The curve shows 23 people at 50.7%.',
      'Discuss, then try the class’s own birthdays under “Try it with your class”.',
    ],
    discuss: [
      'A room of 23 has 253 pairs. How many pairs does our class have?',
      'Work out the chance that 3 people all have different birthdays. What is 1 minus that?',
      'How many people does it take for someone to share your own birthday at even odds? (Switch the question to “Someone shares MY birthday”: 254.)',
    ],
    misconception:
      '“It must take about 183 people, half of 365.” That thinks of matches with one person. A match can come from any of the pairs, and their number grows fast.',
  },
  'central-limit-theorem': {
    topic: 'sampling',
    goals: [
      'Describe the distribution of sample means by simulation: its center, spread and shape.',
      'Check the spread of the means against σ/√n.',
      'See that the shape depends on the source and on n: a skewed source needs larger samples.',
    ],
    plan: [
      'Before class, type a class seed under More settings, then press Present. The page opens on a skewed source with samples of 5.',
      'Point at the source chart. Ask the question: each draw has a spread of 1; what is the spread of averages of 25 draws?',
      'Move the sample size to 25. The spread lands near 0.2 (0.201 with the seed bellcurve; theory 1/√25 = 0.200).',
      'Students scan the QR code and try other sources on their phones.',
      'Discuss.',
    ],
    discuss: [
      'Averages of 5 draws are still skewed (the page shows their skewness; a bell has 0). How large must samples be before they look like a bell?',
      'Make the samples 4 times as large. What happens to the spread of the means?',
      'Switch the source to Cauchy. Why do the averages never settle?',
    ],
    misconception:
      '“With 30 or more, the averages are always normal.” From this skewed source, averages of 30 draws still have skewness 2/√30 ≈ 0.37. The data never become normal; only the averages pile up, and how fast depends on the source.',
  },
};

export const topicById = (id) => topics.find((t) => t.id === id);
