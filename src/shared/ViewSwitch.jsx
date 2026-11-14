/**
 * The small switch at the top of a stage, for a tool's alternative views of the same thing
 * (three at most; docs/redesign-2026-11-10/DESIGN.md). options: [[key, label], ...].
 */
function ViewSwitch({ label, options, value, onChange }) {
  return (
    <div className="view-switch" role="group" aria-label={label}>
      {options.map(([key, text]) => (
        <button key={key} type="button" aria-pressed={value === key} onClick={() => onChange(key)}>
          {text}
        </button>
      ))}
    </div>
  );
}

export default ViewSwitch;
