import { useContext } from 'react';
import { nextTools, toolPath } from '../tools';
import { ToolSlug } from './toolSlug';

/**
 * Next experiment: three hand-picked tools with a reason each, placed right after a tool's results.
 * The first is the next step on the tool's learning path (docs/redesign-2026-11-10/A3-LOGIC.md).
 * Each card is one link; data-hop names the link for the tool-to-tool click count.
 */
function NextTools() {
  const slug = useContext(ToolSlug);
  const picks = nextTools(slug);
  if (!picks.length) return null;

  return (
    <section className="next-tools" aria-labelledby="next-heading">
      <h2 id="next-heading">Next experiment</h2>
      <ul>
        {picks.map(({ tool, reason, step }, i) => (
          <li key={tool.slug} className={i === 0 ? 'next-card main' : 'next-card'}>
            <img src={`/og/thumb/${tool.slug}.png`} alt="" width="96" height="96" loading="lazy" />
            <div>
              {step && <p className="next-step">Step {step.step} of {step.of}</p>}
              <h3>
                <a href={toolPath(tool.slug)} data-hop={`next-${i + 1}`}>{tool.name}</a>
              </h3>
              <p>{reason}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default NextTools;
