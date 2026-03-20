import { AspectRatio } from '@/types';
import { wrapText, calculateFontSize } from './wrapText';

// Yield to browser between heavy operations to prevent UI freeze
// Uses requestAnimationFrame + setTimeout to guarantee the browser
// actually paints a frame before we resume work on the main thread.
function yieldToMain(): Promise<void> {
  return new Promise((resolve) =>
    requestAnimationFrame(() => setTimeout(resolve, 0))
  );
}

// Async, non-blocking alternative to canvas.toDataURL()
function canvasToObjectURL(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(URL.createObjectURL(blob));
        else reject(new Error('Canvas toBlob returned null'));
      },
      'image/png'
    );
  });
}

const QUOTE_FONT_FAMILY = '"Playfair Display", "Georgia", serif';
const QUOTE_FONT_WEIGHT = 400;

export async function renderSlide(
  imageFile: File,
  text: string,
  aspectRatio: AspectRatio,
  fontFamily: string = '"Helvetica Neue", "Arial", sans-serif',
  fontWeight: number = 700,
  isQuote: boolean = false
): Promise<string> {
  const img = await loadImage(imageFile);

  // Yield after loading image
  await yieldToMain();

  const scale = 2;
  const baseWidth = 1080;

  let canvasWidth: number;
  let canvasHeight: number;

  if (aspectRatio === 'original') {
    const imgRatio = img.width / img.height;
    canvasWidth = baseWidth * scale;
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

  drawCover(ctx, img, canvasWidth, canvasHeight);

  const gradientStart = canvasHeight * 0.50;
  const gradient = ctx.createLinearGradient(0, gradientStart, 0, canvasHeight);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(0.3, 'rgba(0,0,0,0.15)');
  gradient.addColorStop(0.6, 'rgba(0,0,0,0.5)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.85)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, gradientStart, canvasWidth, canvasHeight - gradientStart);

  if (text.trim()) {
    const usedFontFamily = isQuote ? QUOTE_FONT_FAMILY : fontFamily;
    const usedFontWeight = isQuote ? QUOTE_FONT_WEIGHT : fontWeight;
    const fontStyle = isQuote ? 'italic' : 'normal';

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
      ctx, text, maxWidth, baseFontSize, maxLines, usedFontFamily, usedFontWeight, fontStyle
    );
    const lineHeight = finalFontSize * 1.4;
    const totalTextHeight = lines.length * lineHeight;
    const rawStartY = canvasHeight - bottomPadding - totalTextHeight;
    const startY = Math.max(rawStartY, gradientStart + 20);

    ctx.font = `${fontStyle} ${usedFontWeight} ${finalFontSize}px ${usedFontFamily}`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Draw opening quote mark for quote slides
    if (isQuote) {
      const quoteMarkSize = finalFontSize * 1.8;
      ctx.font = `${usedFontWeight} ${quoteMarkSize}px ${usedFontFamily}`;
      ctx.globalAlpha = 0.35;
      ctx.fillText('\u201C', canvasWidth / 2, startY - quoteMarkSize * 0.75);
      ctx.globalAlpha = 1;
      ctx.font = `${fontStyle} ${usedFontWeight} ${finalFontSize}px ${usedFontFamily}`;
    }

    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], canvasWidth / 2, startY + i * lineHeight);
    }
  }

  // Yield after heavy canvas work before export
  await yieldToMain();

  return canvasToObjectURL(canvas);
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

async function resizeImage(img: HTMLImageElement, maxDim: number): Promise<HTMLImageElement> {
  const ratio = Math.min(maxDim / img.width, maxDim / img.height);
  const canvas = document.createElement('canvas');
  canvas.width = img.width * ratio;
  canvas.height = img.height * ratio;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const url = await canvasToObjectURL(canvas);
  return new Promise((resolve) => {
    const resized = new Image();
    resized.onload = () => resolve(resized);
    resized.src = url;
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
    sh = img.height;
    sw = img.height * canvasRatio;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = img.width / canvasRatio;
    sx = 0;
    sy = (img.height - sh) * 0.15;
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvasW, canvasH);
}
