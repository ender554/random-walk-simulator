import SiteLayout from '../../shared/SiteLayout';
import { Standards, StandardsSources } from '../../shared/TeachSection';
import { liveTools, toolPath } from '../../tools';
import { topics } from '../../teach';
import '../../shared/teach.css';
import './teachers.css';

const toolBySlug = Object.fromEntries(liveTools.map((t) => [t.slug, t]));

// For teachers (C2, docs/redesign-2026-11-10/C2-LOGIC.md): the simulators by course topic with their predict
// questions and standards, then how to run a class demo with one seed, Present mode and the QR code.
function Teachers() {
  return (
    <SiteLayout>
      <div className="teachers">
        <header className="teachers-head">
          <h1>For teachers</h1>
          <p>
            Free, no sign-up. One seed gives the whole class the same run. Show it on the projector, or embed it in
            your course page.
          </p>
        </header>

        <div className="teachers-grid">
          <section aria-labelledby="topics-heading">
            <h2 id="topics-heading">By course topic</h2>
            <ul className="topic-list">
              {topics.map((topic) => (
                <li key={topic.id} className="topic-row">
                  <p className="topic-name">{topic.name}</p>
                  <p className="topic-tools">
                    {topic.tools.map((slug, i) => (
                      <span key={slug}>
                        {i > 0 && (topic.id === 'sampling' ? ', then ' : ', ')}
                        <a href={topic.teach === slug ? `${toolPath(slug)}#teach` : toolPath(slug)}>
                          {toolBySlug[slug].name}
                        </a>
                      </span>
                    ))}
                  </p>
                  <p className="topic-question">Ask first: {topic.question}</p>
                  <details className="topic-standards">
                    <summary>Standards</summary>
                    <Standards ap={topic.ap} ccss={topic.ccss} />
                  </details>
                  {topic.teach && (
                    <p className="topic-plan">
                      <a href={`${toolPath(topic.teach)}#teach`}>Goals and a 10-minute plan →</a>
                    </p>
                  )}
                </li>
              ))}
            </ul>
            <p className="teach-source"><StandardsSources /></p>
          </section>

          <aside className="teachers-side">
            <section className="teachers-card" aria-labelledby="demo-heading">
              <h2 id="demo-heading">Run a 10-minute demo</h2>
              <ol>
                <li>Open a simulator and type a class seed, such as your class name, under More settings.</li>
                <li>
                  Press Present, or add <code>?present=1</code> to the link. Space runs, → goes to the next simulator,
                  Esc leaves.
                </li>
                <li>Students scan the QR code (press Q to make it big): same seed, same results on every device.</li>
              </ol>
            </section>
            <section className="teachers-card" aria-labelledby="embed-heading">
              <h2 id="embed-heading">In your course page or slides</h2>
              <p>
                Every simulator has an Embed button under Share &amp; export. It gives the code for a frame that
                shows just the simulator, with your settings and seed.
              </p>
            </section>
            <section className="teachers-card" aria-labelledby="paths-heading">
              <h2 id="paths-heading">Three paths</h2>
              <p>
                The simulators also run in three short paths, each in order: Monty Hall, Birthday, Monte Carlo π; Coin
                flip, Galton board, the CLT; and Random walk, Gambler&apos;s ruin, Stock prices.{' '}
                <a href="/#tools">See the paths</a>.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
}

export default Teachers;
