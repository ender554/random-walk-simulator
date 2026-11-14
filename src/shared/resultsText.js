// "Copy my results" (C3, docs/redesign-2026-11-10/C3-LOGIC.md): one block of text a student can paste into Google
// Classroom or another LMS instead of a screenshot. The tool, the numbers on the stage right now, the prediction
// check if there is one, a link to this exact run (settings and seed) and the date.
// It reads the stage's headline (.stage-headline: a label and a value per line, then .stage-meta), which every
// workbench tool has, so it always matches what is on the screen.

const clean = (s) => (s ?? '').replace(/\s+/g, ' ').trim();
const shown = (el) => Boolean(el) && el.getClientRects().length > 0;

export function resultsText() {
  const lines = [`${clean(document.querySelector('main h1')?.textContent)} · ChanceScope`];

  const headlines = [...document.querySelectorAll('.wb-stage .stage-headline')].filter(shown);
  for (const headline of headlines) {
    for (const p of headline.querySelectorAll('p')) {
      if (p.classList.contains('stage-meta')) {
        const parts = [...p.children].map((c) => clean(c.textContent)).filter(Boolean);
        lines.push(parts.length ? parts.join(' · ') : clean(p.textContent));
        continue;
      }
      const label = clean(p.querySelector('span')?.textContent);
      const value = clean(p.querySelector('strong')?.textContent);
      if (label && value) lines.push(`${label}: ${value}`);
    }
  }
  // Views without a headline (the coin, Birthday's room, a played Monty Hall round) show their numbers in a
  // status line or a tally instead
  if (!headlines.length) {
    for (const el of [...document.querySelectorAll('.wb-stage :is(.result-line, .room-status, .tally)')].filter(shown)) {
      const rows = el.classList.contains('tally') ? [...el.children] : [el];
      for (const row of rows) {
        const text = row.innerText.split(/\n/).map(clean).filter(Boolean).join(' · ');
        if (text) lines.push(text);
      }
    }
  }
  if (lines.length === 1) lines.push('No results on the screen yet. Run the simulation, then copy again.');

  const check = document.querySelector('.challenge-result');
  if (shown(check)) {
    const said = [...check.querySelectorAll(':scope > p')].filter((p) => !p.classList.contains('challenge-next'));
    lines.push(`My prediction: ${clean(said.map((p) => p.textContent).join(' '))}`);
  }

  const url = new URL(window.location.href);
  url.searchParams.delete('present');
  url.searchParams.delete('embed');
  url.hash = '';
  lines.push(`This exact run: ${url.href}`);
  lines.push(`Copied ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}`);
  return lines.join('\n');
}
