import { AspectRatio } from '@/types';
import { wrapText, calculateFontSize } from './wrapText';

export async function renderSlide(
  imageFile: File,
  text: string,
  aspectRatio: AspectRatio,
  fontFamily: string = '"Helvetica Neue", "Arial", sans-serif',
  fontWeight: number = 700
): Promise<string> {
  const img = await loadImage(imageFile);
  const scale = 2;
  const baseWidth = 1080;

  let canvasWidth: number;
  let canvasHeight: number;

  if (aspectRatio === 'original') {
    const imgRatio = img.width / img.height;
    canvasWidth = baseWidth * scale;
    // Scale height proportionally, cap between 1080 and 1350 logical px
    const logicalHeight = Math.round(Math.min(1350, Math.max(810, baseWidth / imgRatio)));
    canvasHeight = logicalHeight * scale;
  } else {
    const height = aspectRatio === '1:1' ? 1080 : 1350;
    canvasWidth = baseWidth * scale;
    canvasHeight = height * scale;
  }

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw image covering the canvas with face-aware cropping
  drawCover(ctx, img, canvasWidth, canvasHeight);

  // Draw gradient overlay on lower 50% for enough text coverage
  const gradientStart = canvasHeight * 0.50;
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
    const maxLinesFor1to1 = 6;
    const maxLines = canvasHeight / canvasWidth >= 1.15 ? 8 : maxLinesFor1to1;

    const wordCount = text.trim().split(/\s+/).length;
    const baseFontSize = calculateFontSize(wordCount, scale);

    ctx.fillStyle = '#FFFFFF';
    ctx.textBaseline = 'top';

    const { lines, finalFontSize } = wrapText(
      ctx, text, maxWidth, baseFontSize, maxLines, fontFamily, fontWeight
    );
    const lineHeight = finalFontSize * 1.4;
    const totalTextHeight = lines.length * lineHeight;
    const rawStartY = canvasHeight - bottomPadding - totalTextHeight;
    const startY = Math.max(rawStartY, gradientStart + 20);

    ctx.font = `${fontWeight} ${finalFontSize}px ${fontFamily}`;
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
    img.onload = async () => {
      URL.revokeObjectURL(url);
      if (img.width > 4000 || img.height > 4000) {
        try {
          const resized = await resizeImage(img, 4000);
          resolve(resized);
        } catch (err) {
          reject(err);
        }
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

function resizeImage(img: HTMLImageElement, maxDim: number): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const ratio = Math.min(maxDim / img.width, maxDim / img.height);
    const canvas = document.createElement('canvas');
    canvas.width = img.width * ratio;
    canvas.height = img.height * ratio;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const resized = new Image();
    resized.onload = () => resolve(resized);
    resized.src = canvas.toDataURL();
  });
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
    // Image is wider — crop sides (center horizontally)
    sh = img.height;
    sw = img.height * canvasRatio;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    // Image is taller — crop top/bottom
    // Bias toward top (0.15) to preserve faces in upper portion
    sw = img.width;
    sh = img.width / canvasRatio;
    sx = 0;
    sy = (img.height - sh) * 0.15;
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvasW, canvasH);
}
