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
