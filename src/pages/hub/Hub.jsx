import SiteLayout from '../../shared/SiteLayout';
import { categories, tools, toolPath } from '../../tools';
import { SITE_NAME } from '../../site';
import './hub.css';

function Hub() {
  return (
    <SiteLayout>
      <header className="hub-hero">
        <h1>
          {SITE_NAME}: interactive probability simulators
        </h1>
        <p className="hub-tagline">See what happens in the long run.</p>
        <p>
          See randomness happen instead of just reading the formula. Run random walks, watch bell curves form,
          and test famous probability puzzles in your browser. Every simulator is free, uses repeatable seeds so a
          whole class can run the same experiment, and exports images for notes and slides.
        </p>
      </header>

      <div id="tools" className="hub-categories">
        {categories.map((category) => (
          <section key={category.id} aria-labelledby={`cat-${category.id}`}>
            <h2 id={`cat-${category.id}`}>{category.name}</h2>
            <p className="category-blurb">{category.blurb}</p>
            <ul className="tool-grid">
              {tools
                .filter((t) => t.category === category.id)
                .map((t) => (
                  <li key={t.slug} className="tool-card">
                    {t.status === 'live' ? (
                      <a href={toolPath(t.slug)}>
                        <h3>{t.name}</h3>
                      </a>
                    ) : (
                      <h3>
                        {t.name} <span className="badge">Coming soon</span>
                      </h3>
                    )}
                    <p>{t.short}</p>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="prose hub-about" aria-labelledby="why-heading">
        <h2 id="why-heading">Why simulate probability?</h2>
        <p>
          Many results in probability are easy to state and hard to believe. A random walk drifts about √n steps
          from where it started, averages of almost anything form a bell curve, and switching doors wins the Monty
          Hall game two times out of three. Running the experiment thousands of times turns those claims into
          something you can see.
        </p>
        <p>
          The simulators are grouped so you can follow an idea: random walks lead to gambler&apos;s ruin and stock
          price models, coin flips lead to the law of large numbers and the central limit theorem.
        </p>
      </section>
    </SiteLayout>
  );
}

export default Hub;
