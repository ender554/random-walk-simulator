import { DONATION_LINK } from '../site';

function SupportRow() {
  return (
    <div className="buy-row">
      <a className="buy-link" href={DONATION_LINK} target="_blank" rel="noopener noreferrer">
        ❤️ Support this tool
      </a>
      <p className="support-line">
        This tool is free. If you found it useful, consider supporting it.
      </p>
    </div>
  );
}

export default SupportRow;
