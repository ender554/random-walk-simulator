import { AP_SOURCE, AP_TOPICS, CCSS, CCSS_SOURCE, teachNotes, topicById } from '../teach';
import './teach.css';

// One line per standard: the code, then its title (AP) or our short summary (Common Core)
export function Standards({ ap, ccss }) {
  return (
    <ul className="teach-standards">
      {ap.map((code) => (
        <li key={code}><strong>AP Statistics {code}</strong> {AP_TOPICS[code]}</li>
      ))}
      {ccss.map((code) => (
        <li key={code}><strong>{code}</strong> {CCSS[code]}</li>
      ))}
    </ul>
  );
}

export function StandardsSources() {
  return (
  <>
    AP topics follow College Board&apos;s{' '}
    <a href={AP_SOURCE} target="_blank" rel="noopener noreferrer">AP Statistics course framework for 2026–27</a>.
    Common Core codes are from the{' '}
    <a href={CCSS_SOURCE} target="_blank" rel="noopener noreferrer">Common Core State Standards for Mathematics</a>;
    (+) marks an advanced standard.
  </>
  );
}

/**
 * "For teachers" on a tool page (#teach): learning goals, the standards it fits, a 10-minute plan, questions to
 * discuss and the usual misconception. Content lives in src/teach.js.
 */
function TeachSection({ slug }) {
  const notes = teachNotes[slug];
  if (!notes) return null;
  const topic = topicById(notes.topic);
  return (
    <section className="panel teach" id="teach" aria-labelledby="teach-heading">
      <h2 id="teach-heading">For teachers</h2>
      <p className="teach-lede">
        A 10-minute class demo where every phone gets the same run. More topics are on the{' '}
        <a href="/teachers/">For teachers</a> page.
      </p>
      <div className="teach-grid">
        <div>
          <h3>Learning goals</h3>
          <ul>{notes.goals.map((g) => <li key={g}>{g}</li>)}</ul>
          <h3>Fits</h3>
          <Standards ap={topic.ap} ccss={topic.ccss} />
          <p className="teach-source"><StandardsSources /></p>
        </div>
        <div>
          <h3>A 10-minute plan</h3>
          <ol>{notes.plan.map((p) => <li key={p}>{p}</li>)}</ol>
          <h3>Questions to discuss</h3>
          <ol>{notes.discuss.map((q) => <li key={q}>{q}</li>)}</ol>
        </div>
      </div>
      <h3>The usual misconception</h3>
      <p>{notes.misconception}</p>
    </section>
  );
}

export default TeachSection;
