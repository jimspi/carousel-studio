import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';

function drawLogo(ctx, size) {
  const s = size / 64;

  // Back rectangle
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = '#1C1917';
  roundRect(ctx, 14 * s, 8 * s, 40 * s, 48 * s, 4 * s);
  ctx.fill();

  // Front rectangle
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#1C1917';
  roundRect(ctx, 8 * s, 14 * s, 40 * s, 48 * s, 4 * s);
  ctx.fill();

  // Text lines
  ctx.strokeStyle = '#FAFAF9';
  ctx.lineWidth = 3 * s;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(16 * s, 30 * s);
  ctx.lineTo(40 * s, 30 * s);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(16 * s, 39 * s);
  ctx.lineTo(40 * s, 39 * s);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(16 * s, 48 * s);
  ctx.lineTo(32 * s, 48 * s);
  ctx.stroke();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function generateIcon(size, filename, withBackground = false) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  if (withBackground) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);
  }

  // Center the logo with padding
  const padding = withBackground ? size * 0.15 : 0;
  const logoSize = size - padding * 2;
  ctx.save();
  ctx.translate(padding, padding);
  drawLogo(ctx, logoSize);
  ctx.restore();

  const buffer = canvas.toBuffer('image/png');
  writeFileSync(`public/${filename}`, buffer);
  console.log(`Generated ${filename} (${size}x${size})`);
}

// Generate all icons
generateIcon(180, 'apple-touch-icon.png', true);
generateIcon(192, 'icon-192.png', true);
generateIcon(512, 'icon-512.png', true);

// Generate favicon.ico as a 32x32 PNG (modern browsers accept PNG favicons)
generateIcon(32, 'favicon.ico', false);

console.log('All icons generated.');
