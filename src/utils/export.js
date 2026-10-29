// Downloads shared by every tool: scaled PNGs, CSV data and plain text.

function download(href, filename) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = href;
  link.click();
}

/**
 * Re-draw a chart into a larger canvas and save it as PNG.
 * `draw(canvasLike)` is the tool's normal draw function; it gets an object with the logical
 * width/height and a context that is already scaled, so the same layout code renders sharper.
 */
export function exportScaledPNG(draw, { width, height }, scale, filename) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  draw({ width, height, getContext: () => ctx });
  download(canvas.toDataURL('image/png'), filename);
}

const csvCell = (v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function downloadText(filename, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  download(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadCSV(filename, headers, rows) {
  const lines = [headers, ...rows].map((row) => row.map(csvCell).join(','));
  downloadText(filename, `${lines.join('\n')}\n`, 'text/csv');
}
