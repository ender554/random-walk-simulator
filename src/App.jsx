import { useRef, useState } from 'react';
import Controls from './components/Controls';
import RandomWalkCanvas from './components/RandomWalkCanvas';
import './App.css';

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

  return (
    <div className="app-shell">
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
      />

      <div className="canvas-wrapper">
        <RandomWalkCanvas ref={canvasRef} />
      </div>
    </div>
  );
}

export default App;
