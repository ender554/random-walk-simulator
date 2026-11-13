import SiteLayout from '../../shared/SiteLayout';
import { CONTACT_EMAIL, SITE_NAME, STUDIO_NAME, STUDIO_URL } from '../../site';

function About() {
  return (
    <SiteLayout>
      <article className="prose">
        <h1>
          {SITE_NAME} by {STUDIO_NAME}
        </h1>
        <p>
          {SITE_NAME} is a set of free, interactive probability simulators for students, teachers and anyone curious
          about randomness. Each one runs entirely in your browser: change a setting, run it again, and see what
          happens.
        </p>

        <h2>How the simulators work</h2>
        <p>
          Simulations use a seeded random number generator. The same seed and settings always give the same result,
          so you can share an exact run with a classmate or have a whole class follow the same experiment. Leave the
          seed random to explore.
        </p>

        <h2>How we check results</h2>
        <p>
          Every simulator draws its random numbers from a seeded generator: the seedrandom library, or a short
          generator called mulberry32 that the Monte Carlo π page also writes out in Python and JavaScript. The seed
          is part of the page address, so anyone who opens the same link gets the same run and can check it.
        </p>
        <p>Where the answer can be worked out exactly, the page shows it beside the simulation:</p>
        <ul>
          <li>Monty Hall: switching wins 2 games in 3.</li>
          <li>Birthday paradox: the exact odds for your group, beside the share of random rooms with a match.</li>
          <li>Monte Carlo π: the estimate against π, and how far off it is.</li>
          <li>Coin flip: the true chance of heads with a 95% band, expected streak counts, and exact binomial odds.</li>
          <li>Galton board: the binomial chance of each bin, and Pascal&apos;s triangle.</li>
          <li>Central limit theorem: the normal curve the theorem predicts, with spread σ/√n.</li>
          <li>Random walk: the √n lines for distance from the start, for ordinary walks.</li>
          <li>Gambler&apos;s ruin: the exact chance of going broke with flat, even-money bets.</li>
          <li>Stock price paths: the model&apos;s mean and median, and the Black–Scholes option price.</li>
          <li>
            Diffusion-limited aggregation has no exact answer. The page fits your cluster&apos;s fractal dimension and
            shows the usual value of about 1.71 beside it.
          </li>
        </ul>
        <p>If a result ever disagrees with its exact answer by more than chance allows, please tell us.</p>

        <h2>Who makes it</h2>
        <p>
          {SITE_NAME} is made by {STUDIO_NAME} (
          <a href={STUDIO_URL} target="_blank" rel="noopener noreferrer">
            five54precision.com
          </a>
          ). Questions, ideas for a simulator, or found a mistake? Email{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </article>
    </SiteLayout>
  );
}

export default About;
