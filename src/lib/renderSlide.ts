import { AspectRatio } from '@/types';
import { wrapText, calculateFontSize } from './wrapText';

export async function renderSlide(
  imageFile: File,
  text: string,
  aspectRatio: AspectRatio
): Promise<string> {
  const img = await loadImage(imageFile);
  const width = 1080;
  const height = aspectRatio === '1:1' ? 1080 : 1350;
  // Render at 2x for retina
  const scale = 2;
  const canvasWidth = width * scale;
  const canvasHeight = height * scale;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw image covering the canvas (object-cover behavior)
  drawCover(ctx, img, canvasWidth, canvasHeight);

  // Draw gradient overlay on lower 45%
  const gradientStart = canvasHeight * 0.55;
  const gradient = ctx.createLinearGradient(0, gradientStart, 0, canvasHeight);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(0.3, 'rgba(0,0,0,0.15)');
  gradient.addColorStop(0.6, 'rgba(0,0,0,0.5)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.85)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, gradientStart, canvasWidth, canvasHeight - gradientStart);

  // Render text if present
  if (text.trim()) {
    const padding = 60 * scale;
    const bottomPadding = 80 * scale;
    const maxWidth = canvasWidth - padding * 2;
    const maxLines = aspectRatio === '1:1' ? 6 : 8;

    const wordCount = text.trim().split(/\s+/).length;
    const baseFontSize = calculateFontSize(wordCount, scale);

    ctx.fillStyle = '#FFFFFF';
    ctx.textBaseline = 'top';

    const { lines, finalFontSize } = wrapText(ctx, text, maxWidth, baseFontSize, maxLines);
    const lineHeight = finalFontSize * 1.4;
    const totalTextHeight = lines.length * lineHeight;
    const startY = canvasHeight - bottomPadding - totalTextHeight;

    ctx.font = `bold ${finalFontSize}px "Helvetica Neue", "Arial", sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], canvasWidth / 2, startY + i * lineHeight);
    }
  }

  return canvas.toDataURL('image/png');
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      // Resize if too large
      if (img.width > 4000 || img.height > 4000) {
        const resized = resizeImage(img, 4000);
        resolve(resized);
      } else {
        resolve(img);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

function resizeImage(img: HTMLImageElement, maxDim: number): HTMLImageElement {
  const ratio = Math.min(maxDim / img.width, maxDim / img.height);
  const canvas = document.createElement('canvas');
  canvas.width = img.width * ratio;
  canvas.height = img.height * ratio;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const resized = new Image();
  resized.src = canvas.toDataURL();
  return resized;
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  canvasW: number,
  canvasH: number
) {
  const imgRatio = img.width / img.height;
  const canvasRatio = canvasW / canvasH;
  let sx: number, sy: number, sw: number, sh: number;

  if (imgRatio > canvasRatio) {
    // Image is wider — crop sides
    sh = img.height;
    sw = img.height * canvasRatio;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    // Image is taller — crop top/bottom
    sw = img.width;
    sh = img.width / canvasRatio;
    sx = 0;
    sy = (img.height - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvasW, canvasH);
}
