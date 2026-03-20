import JSZip from 'jszip';

// Convert any image URL (blob: or data:) to a Blob
async function urlToBlob(url: string): Promise<Blob> {
  const res = await fetch(url);
  return res.blob();
}

export async function downloadSingleSlide(imageUrl: string, slideNumber: number) {
  const blob = await urlToBlob(imageUrl);
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = `slide-${String(slideNumber).padStart(2, '0')}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

export async function downloadAllSlides(imageUrls: string[]) {
  const zip = new JSZip();

  for (let i = 0; i < imageUrls.length; i++) {
    const blob = await urlToBlob(imageUrls[i]);
    const filename = `slide-${String(i + 1).padStart(2, '0')}.png`;
    zip.file(filename, blob);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'carousel-studio-export.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function urlToFile(url: string, filename: string): Promise<File> {
  const blob = await urlToBlob(url);
  return new File([blob], filename, { type: blob.type || 'image/png' });
}

export function canShareFiles(): boolean {
  return typeof navigator !== 'undefined' &&
    !!navigator.share &&
    !!navigator.canShare;
}

export async function shareToCamera(imageUrl: string, slideNumber: number): Promise<boolean> {
  const file = await urlToFile(imageUrl, `slide-${String(slideNumber).padStart(2, '0')}.png`);
  const shareData = { files: [file] };

  if (!navigator.canShare?.(shareData)) {
    return false;
  }

  try {
    await navigator.share(shareData);
    return true;
  } catch (err) {
    if ((err as DOMException).name === 'AbortError') return true;
    return false;
  }
}

export async function shareAllToCamera(imageUrls: string[]): Promise<boolean> {
  const files = await Promise.all(
    imageUrls.map((url, i) =>
      urlToFile(url, `slide-${String(i + 1).padStart(2, '0')}.png`)
    )
  );
  const shareData = { files };

  if (!navigator.canShare?.(shareData)) {
    return false;
  }

  try {
    await navigator.share(shareData);
    return true;
  } catch (err) {
    if ((err as DOMException).name === 'AbortError') return true;
    return false;
  }
}
