import React from 'react';

function Controls({
  steps,
  setSteps,
  stepSize,
  setStepSize,
  seed,
  setSeed,
  onRun,
  onReset,
  onExport,
  onBuy
}) {
  return (
    <section className="controls-panel">
      <div className="controls-heading">
        <div>
          <p className="eyebrow">Random Walk Simulator</p>
          <p className="subtitle">Deterministic canvas-based path</p>
        </div>
      </div>

      <div className="control-row">
        <label htmlFor="steps-range">
          Steps <span>{steps.toLocaleString()}</span>
        </label>
        <input
          id="steps-range"
          type="range"
          min="100"
          max="100000"
          step="100"
          value={steps}
          onChange={(event) => setSteps(Number(event.target.value))}
        />
      </div>

      <div className="control-row">
        <label htmlFor="step-size-range">
          Step Size <span>{stepSize}</span>
        </label>
        <input
          id="step-size-range"
          type="range"
        min="1"
        max="10"
        step="1"
        value={stepSize}
        onChange={(event) => setStepSize(Number(event.target.value))}
      />
    </div>

      <div className="control-row">
        <label htmlFor="seed-input">Seed</label>
        <input
          id="seed-input"
          type="text"
          value={seed}
          onChange={(event) => setSeed(event.target.value)}
          placeholder="Enter seed"
        />
      </div>

      <div className="button-row">
        <button type="button" onClick={onRun}>
          Run
        </button>
        <button type="button" onClick={onReset}>
          Reset
        </button>
        <button type="button" onClick={onExport}>
          Export PNG
        </button>
      </div>

      <div className="buy-row">
        <button type="button" className="buy-link" onClick={onBuy}>
          ❤️ Support this tool
        </button>
        <p className="support-line">
          This tool is free. If you found it useful, consider supporting it.
        </p>
      </div>
    </section>
  );
}

export default Controls;
