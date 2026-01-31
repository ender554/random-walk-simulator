import { useRef, useState } from 'react';
import Controls from './components/Controls';
import RandomWalkCanvas from './components/RandomWalkCanvas';
import { useWalkStats } from './hooks/useWalkStats';
import './App.css';

const stripePaymentLink = 'https://buy.stripe.com/7sY00i33610691rfEC28801';

function App() {
  const canvasRef = useRef(null);
  const [steps, setSteps] = useState(5000);
  const [stepSize, setStepSize] = useState(4);
  const [seed, setSeed] = useState('balanced');

  const handleRun = () => {
    canvasRef.current?.drawWalk(steps, stepSize, seed);
  };

  const handleReset = () => {
    canvasRef.current?.clear();
  };

  const handleExport = () => {
    canvasRef.current?.exportPNG();
  };

  const handleBuy = () => {
    if (typeof window === 'undefined') return;
    window.open(stripePaymentLink, '_blank', 'noopener');
  };

  const stats = useWalkStats(steps, stepSize, seed);
  const formatDistance = (value) =>
    value.toLocaleString(undefined, { maximumFractionDigits: 1 });
  const diffSign = stats.difference >= 0 ? '+' : '-';
  const diffValue = `${diffSign}${formatDistance(Math.abs(stats.difference))} px`;

  return (
    <div className="app-shell">
      <header className="page-header">
        <h1>Random Walk Simulator</h1>
        <p>
          Explore deterministic random walks, visualize Brownian motion,
          and export the path as an image with consistent steps, sizes, and seed.
        </p>
      </header>

      <Controls
        steps={steps}
        setSteps={setSteps}
        stepSize={stepSize}
        setStepSize={setStepSize}
        seed={seed}
        setSeed={setSeed}
        onRun={handleRun}
        onReset={handleReset}
        onExport={handleExport}
        onBuy={handleBuy}
      />

      <div className="canvas-wrapper">
        <RandomWalkCanvas ref={canvasRef} />
      </div>

      <section className="stats-panel">
        <h2>Run statistics</h2>
        <div className="stats-grid">
          <div className="stat-row">
            <span>Steps:</span>
            <span>{steps.toLocaleString()}</span>
          </div>
          <div className="stat-row">
            <span>Final displacement:</span>
            <span>{formatDistance(stats.finalDistance)} px</span>
          </div>
          <div className="stat-row">
            <span>Mean distance over time:</span>
            <span>{formatDistance(stats.meanDistance)} px</span>
          </div>
          <div className="stat-row">
            <span>Expected distance (√n):</span>
            <span>{formatDistance(stats.expectedDistance)} px</span>
          </div>
          <div className="stat-row">
            <span>Actual vs expected:</span>
            <span>{diffValue}</span>
          </div>
          <div className="stat-row">
            <span>Seed:</span>
            <span>{seed || 'N/A'}</span>
          </div>
        </div>
      </section>

      <div className="canvas-description">
        <p>The Random Walk Simulator follows a point that steps one direction at a time.</p>
        <p>Up, down, left, or right moves build a continuous neon line on the canvas.</p>
        <p>Every run is deterministic thanks to a seed, so the same inputs yield the same journey.</p>
        <p>Adjust step count and size to witness how Brownian motion scales with finer increments.</p>
        <p>This visualization helps demonstrate diffusion, stochastic paths, and probabilistic intuition.</p>
        <p>Export snapshots for presentations or teaching moments about randomness.</p>
      </div>
    </div>
  );
}

export default App;
