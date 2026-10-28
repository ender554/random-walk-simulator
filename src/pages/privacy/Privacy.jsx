import SiteLayout from '../../shared/SiteLayout';
import { CONTACT_EMAIL, SITE_NAME, STUDIO_NAME } from '../../site';

// Keep this accurate to what the site actually does. Update it before adding
// ads or any analytics beyond Cloudflare Web Analytics.
function Privacy() {
  return (
    <SiteLayout>
      <article className="prose">
        <h1>Privacy policy</h1>
        <p>Last updated: October 27, 2026</p>

        <h2>The short version</h2>
        <p>
          {SITE_NAME} has no accounts and does not ask for your personal information. The simulators run entirely in
          your browser; your settings, seeds and results are not sent to us.
        </p>

        <h2>Traffic measurement</h2>
        <p>
          We use Cloudflare Web Analytics to count page views. It does not use cookies or track you across sites, and
          we only see totals such as how many people visited a page.
        </p>

        <h2>Donations</h2>
        <p>
          The support link opens a Stripe payment page. Stripe handles your payment details under its own privacy
          policy; we receive only what Stripe shares with merchants, such as the amount and your email address.
        </p>

        <h2>Contact</h2>
        <p>
          {SITE_NAME} is run by {STUDIO_NAME}. Questions about privacy:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </article>
    </SiteLayout>
  );
}

export default Privacy;
