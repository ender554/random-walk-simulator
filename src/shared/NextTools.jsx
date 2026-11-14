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

/**
 * The workbench rail's link to the main pick, so the next step is on a laptop's first screen (DESIGN.md:
 * "Next: Birthday Paradox →" in the rail). It sits under Run, not at the foot: with the predict card and the
 * settings, the foot falls below 650 px (B2-LOGIC.md). Desktop only; phones reach the Next experiment
 * block straight after the settings.
 */
export function RailNext() {
  const main = nextTools(useContext(ToolSlug))[0];
  if (!main) return null;
  return (
    <p className="rail-next">
      <a href={toolPath(main.tool.slug)} data-hop="rail">
        <span>{main.step ? `Next · step ${main.step.step} of ${main.step.of}` : 'Next experiment'}</span>
        {main.tool.name} →
      </a>
    </p>
  );
}

export default NextTools;
