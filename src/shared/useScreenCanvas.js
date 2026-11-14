import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Draws a canvas at the size it is shown on screen (times the device pixel ratio), so chart text keeps its
 * CSS size on a phone and a laptop alike. The canvas must get its width and height from CSS.
 * draw() receives { width, height, getContext } in CSS pixels: the same shape the PNG export passes.
 * Returns a callback ref for the <canvas>, so it keeps working when the canvas mounts and unmounts.
 */
export function useScreenCanvas(draw) {
  const canvasRef = useRef(null);
  const [size, setSize] = useState(null);

  const ref = useCallback((canvas) => {
    canvasRef.current = canvas;
    if (!canvas || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);
      setSize((s) => (s && s.width === width && s.height === height ? s : { width, height }));
    });
    observer.observe(canvas);
    return () => {
      observer.disconnect();
      canvasRef.current = null;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size?.width || !size?.height) return;
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(size.width * ratio);
    const height = Math.round(size.height * ratio);
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw({ width: size.width, height: size.height, getContext: () => ctx });
  });

  return ref;
}
