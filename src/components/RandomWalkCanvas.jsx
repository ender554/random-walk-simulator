import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { generateWalk } from '../utils/randomWalk';

const RandomWalkCanvas = forwardRef((_, ref) => {
  const canvasRef = useRef(null);

  useImperativeHandle(ref, () => ({
    drawWalk(steps, stepSize, seed) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const path = generateWalk(steps, stepSize, seed, canvas.width, canvas.height);

      if (!path.length) return;

      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);

      for (let i = 1; i < path.length; i += 1) {
        ctx.lineTo(path[i].x, path[i].y);
      }

      ctx.strokeStyle = '#00ffcc';
      ctx.lineWidth = 1;
      ctx.stroke();
    },

    clear() {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },

    exportPNG() {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const link = document.createElement('a');
      link.download = 'random-walk.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  }));

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={800}
      style={{ background: '#0b0f14' }}
    />
  );
});

export default RandomWalkCanvas;
