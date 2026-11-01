import SiteLayout from '../../shared/SiteLayout';
import { CONTACT_EMAIL, SITE_NAME, STUDIO_NAME, STUDIO_URL } from '../../site';

function Contact() {
  return (
    <SiteLayout>
      <article className="prose">
        <h1>Contact {SITE_NAME}</h1>
        <p>
          Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. A person reads every message, usually within a
          few days.
        </p>

        <h2>Good reasons to write</h2>
        <ul>
          <li>
            <strong>Something looks wrong.</strong> A number that disagrees with the math, a chart that won&apos;t draw,
            or a page that breaks on your device. A share link (Copy link on any simulator) shows exactly what you saw.
          </li>
          <li>
            <strong>An idea for a simulator</strong> or a setting you wish one had.
          </li>
          <li>
            <strong>Teaching with it.</strong> Questions about embedding a simulator in a class site or running the
            same experiment across a class with a shared seed.
          </li>
        </ul>

        <h2>Who you&apos;re writing to</h2>
        <p>
          {SITE_NAME} is made by {STUDIO_NAME} (
          <a href={STUDIO_URL} target="_blank" rel="noopener noreferrer">
            five54precision.com
          </a>
          ). For how the site handles data, see the <a href="/privacy/">privacy policy</a>.
        </p>
      </article>
    </SiteLayout>
  );
}

export default Contact;
