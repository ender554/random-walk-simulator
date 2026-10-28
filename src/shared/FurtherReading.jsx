import { references } from '../references';

const KIND_LABELS = {
  intro: 'Introduction',
  deep: 'In depth',
  video: 'Video',
  original: 'Original source',
};

function FurtherReading({ slug }) {
  const links = references[slug];
  if (!links?.length) return null;

  return (
    <section className="further-reading" aria-labelledby="reading-heading">
      <h2 id="reading-heading">Further reading</h2>
      <ul>
        {links.map((link) => (
          <li key={link.url}>
            <span className="badge">{KIND_LABELS[link.kind]}</span>
            <a href={link.url} target="_blank" rel="noopener noreferrer">
              {link.title}
            </a>
            <p>{link.note}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default FurtherReading;
