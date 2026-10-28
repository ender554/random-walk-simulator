import { useRef, useState } from 'react';
import Controls from './components/Controls';
import RandomWalkCanvas from './components/RandomWalkCanvas';
import { useWalkStats } from './hooks/useWalkStats';
import SiteLayout from '../../shared/SiteLayout';
import RelatedTools from '../../shared/RelatedTools';
import FurtherReading from '../../shared/FurtherReading';
import { randomSeed } from '../../utils/seed';
import '../../shared/tool.css';

function App() {
  const canvasRef = useRef(null);
  const [steps, setSteps] = useState(5000);
  const [stepSize, setStepSize] = useState(4);
  const [seed, setSeed] = useState('balanced');

  const stats = useWalkStats(steps, stepSize, seed);
  const fmt = (v) =>
    v.toLocaleString(undefined, { maximumFractionDigits: 1 });
  const diff =
    (stats.difference >= 0 ? '+' : '-') +
    fmt(Math.abs(stats.difference)) +
    ' px';

  const handleRandomSeed = () => {
    const s = randomSeed();
    setSeed(s);
    canvasRef.current?.drawWalk(steps, stepSize, s);
  };

  const handleRun = () => {
    canvasRef.current?.drawWalk(steps, stepSize, seed);
  };

  const handleReset = () => {
    canvasRef.current?.clear();
  };

  const handleExport = () => {
    canvasRef.current?.exportPNG();
  };


  return (
    <SiteLayout>
      <div className="tool-main">
        <header className="page-header">
          <h1>Random Walk Simulator</h1>
          <p>
            Explore deterministic random walks, visualize Brownian motion, and export the path as an
            image with consistent steps, sizes, and seed.
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
          onRandomSeed={handleRandomSeed}
          onReset={handleReset}
          onExport={handleExport}
        />

        <div className="canvas-wrapper">
          <RandomWalkCanvas ref={canvasRef} />
        </div>

        <section className="stats-panel">
          <h2>Run statistics</h2>

          <div className="stats-grid">
            <div className="stat-row"><span>Steps:</span><span>{steps}</span></div>
            <div className="stat-row"><span>Final displacement:</span><span>{fmt(stats.finalDistance)} px</span></div>
            <div className="stat-row"><span>Mean distance:</span><span>{fmt(stats.meanDistance)} px</span></div>
            <div className="stat-row"><span>Expected (√n × step):</span><span>{fmt(stats.expectedDistance)} px</span></div>
            <div className="stat-row"><span>Actual vs expected:</span><span>{diff}</span></div>
            <div className="stat-row"><span>Seed:</span><span>{seed || 'N/A'}</span></div>
          </div>
        </section>

        <section className="canvas-description prose" aria-labelledby="explain-heading">
          <h2 id="explain-heading">What is a random walk?</h2>
          <p>
            A random walk is a path made of random steps. Here a point starts in the center and, at every step,
            moves up, down, left or right with equal chance. Thousands of tiny, unpredictable moves add up to a
            wandering line that looks surprisingly like the path of a pollen grain in water.
          </p>

          <h2>How far does a random walk go?</h2>
          <p>
            Steps in opposite directions cancel out, so the walk travels much less than its total length. On
            average, after n steps of size s it ends up about √n × s from the start. The run statistics compare this
            expected distance with what your walk actually did: 2,500 steps of size 4 cover 10,000 pixels in total
            but usually end only around 200 pixels from the center.
          </p>

          <h2>Random walks and Brownian motion</h2>
          <p>
            As the steps get smaller and more frequent, a random walk approaches Brownian motion, the model
            physicists use for diffusion and the jittering of particles in a fluid. The same idea appears in
            finance, where stock prices are often modeled as random walks, and in biology, chemistry and computer
            science.
          </p>

          <h2>Why use a seed?</h2>
          <p>
            The seed fixes the sequence of random steps. The same seed, step count and step size always draw the
            same walk, so you can share an exact path or have a whole class run the same experiment. Press Random
            for a new seed, and Export PNG to save the picture.
          </p>
        </section>

        <FurtherReading slug="random-walk" />
        <RelatedTools slug="random-walk" />
      </div>
    </SiteLayout>
  );
}

export default App;
