export function exportCanvasPNG(canvas, filename) {
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// Canvases are transparent by default; fill so exported PNGs keep the dark background.
export function clearCanvas(ctx, canvas, color = '#0b0f14') {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
