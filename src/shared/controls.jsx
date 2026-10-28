// Small form controls shared by the tools. Styling lives in tool.css.

export function RangeControl({ id, label, display, value, min, max, step = 1, onChange }) {
  return (
    <div className="control-row">
      <label htmlFor={id}>
        {label} <span>{display ?? value}</span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export function SeedControl({ value, onChange }) {
  return (
    <div className="control-row">
      <label htmlFor="seed-input">Seed</label>
      <input
        id="seed-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter seed"
      />
    </div>
  );
}

export function StatRow({ label, value }) {
  return (
    <div className="stat-row">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function Legend({ items }) {
  return (
    <p className="chart-caption">
      {items.map(({ color, label }, i) => (
        <span key={label}>
          <span className="legend-swatch" style={{ background: color, marginLeft: i === 0 ? 0 : undefined }} />
          {label}
        </span>
      ))}
    </p>
  );
}

// 10^exponent slider for counts that span several orders of magnitude.
export function LogRangeControl({ id, label, value, minExp, maxExp, onChange }) {
  const exp = Math.log10(value);
  return (
    <RangeControl
      id={id}
      label={label}
      display={value.toLocaleString()}
      value={exp}
      min={minExp}
      max={maxExp}
      step={0.05}
      onChange={(e) => onChange(roundNice(10 ** e))}
    />
  );
}

function roundNice(v) {
  const magnitude = 10 ** Math.max(0, Math.floor(Math.log10(v)) - 1);
  return Math.round(v / magnitude) * magnitude;
}
