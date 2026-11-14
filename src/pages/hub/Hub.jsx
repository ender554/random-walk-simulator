import SiteLayout from '../../shared/SiteLayout';
import { pathGroups, toolPath } from '../../tools';
import './hub.css';

// One tool in a path: picture, step label, name (the link; the whole row is clickable) and its one-line hook.
function PathTool({ tool, label, eager }) {
  const live = tool.status === 'live';
  return (
    <>
      {live && (
        <img src={`/og/thumb/${tool.slug}.png`} alt="" width="64" height="64" loading={eager ? undefined : 'lazy'} />
      )}
      <div>
        <p className="path-label">{label}</p>
        <p className="path-name">
          {live ? <a href={toolPath(tool.slug)}>{tool.name}</a> : tool.name}
          {!live && <span className="badge">Coming soon</span>}
        </p>
        <p>{tool.short}</p>
      </div>
    </>
  );
}

// The hub: a short hero, then the three paths (each tool listed once, in path order; logic in
// docs/redesign-2026-11-10/B1-LOGIC.md), then why simulate.
function Hub() {
  return (
    <SiteLayout wide>
      <header className="hub-hero">
        <h1>Probability simulators online, free for class</h1>
        <p className="hub-tagline">See what happens in the long run.</p>
      </header>

      <section id="tools" className="hub-paths" aria-labelledby="paths-heading">
        <h2 id="paths-heading">Follow a path</h2>
        <p className="hub-paths-intro">
          Each step links to the next.
        </p>
        {pathGroups.map(({ category, steps, also }, p) => (
          <section key={category.id} className="path" aria-labelledby={`path-${category.id}`}>
            <div className="path-head">
              <h3 id={`path-${category.id}`}>{category.name}</h3>
              <p>{category.blurb}</p>
            </div>
            <div className="path-body">
              <ol className="path-steps">
                {steps.map((tool, i) => (
                  <li key={tool.slug} className="path-tool">
                    <PathTool tool={tool} label={`Step ${i + 1}`} eager={p === 0} />
                  </li>
                ))}
              </ol>
              {also.length > 0 && (
                <ul className="path-also">
                  {also.map((tool) => (
                    <li key={tool.slug} className="path-tool">
                      <PathTool tool={tool} label="Also" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))}
      </section>

      <section className="prose hub-about" aria-labelledby="why-heading">
        <h2 id="why-heading">Why simulate probability?</h2>
        <p>
          Many results in probability are easy to state and hard to believe. A random walk drifts about √n steps
          from where it started, averages of almost anything form a bell curve, and switching doors wins the Monty
          Hall game two times out of three. Running the experiment thousands of times turns those claims into
          something you can see.
        </p>
        <p>
          Every simulator is free, uses repeatable seeds so a whole class can run the same experiment, and exports
          images for notes and slides.
        </p>
      </section>
    </SiteLayout>
  );
}

export default Hub;
