export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontSize: number,
  maxLines: number
): { lines: string[]; finalFontSize: number } {
  let currentFontSize = fontSize;
  const minFontSize = 18;

  while (currentFontSize >= minFontSize) {
    ctx.font = `bold ${currentFontSize}px "Helvetica Neue", "Arial", sans-serif`;
    const lines = computeLines(ctx, text, maxWidth);

    if (lines.length <= maxLines) {
      return { lines, finalFontSize: currentFontSize };
    }

    currentFontSize -= 2;
  }

  // At minimum font size, truncate to maxLines
  ctx.font = `bold ${minFontSize}px "Helvetica Neue", "Arial", sans-serif`;
  const lines = computeLines(ctx, text, maxWidth);
  return { lines: lines.slice(0, maxLines), finalFontSize: minFontSize };
}

function computeLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

export function calculateFontSize(wordCount: number, scale: number): number {
  if (wordCount < 15) return Math.round(52 * scale);
  if (wordCount <= 30) return Math.round(42 * scale);
  if (wordCount <= 50) return Math.round(34 * scale);
  return Math.round(28 * scale);
}
