import JSZip from 'jszip';

export function downloadSingleSlide(dataUrl: string, slideNumber: number) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `slide-${String(slideNumber).padStart(2, '0')}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function downloadAllSlides(dataUrls: string[]) {
  const zip = new JSZip();

  for (let i = 0; i < dataUrls.length; i++) {
    const base64 = dataUrls[i].split(',')[1];
    const filename = `slide-${String(i + 1).padStart(2, '0')}.png`;
    zip.file(filename, base64, { base64: true });
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'carousel-studio-export.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/png';
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    arr[i] = bytes.charCodeAt(i);
  }
  return new File([arr], filename, { type: mime });
}

export function canShareFiles(): boolean {
  return typeof navigator !== 'undefined' &&
    !!navigator.share &&
    !!navigator.canShare;
}

export async function shareToCamera(dataUrl: string, slideNumber: number): Promise<boolean> {
  const file = dataUrlToFile(dataUrl, `slide-${String(slideNumber).padStart(2, '0')}.png`);
  const shareData = { files: [file] };

  if (!navigator.canShare?.(shareData)) {
    return false;
  }

  try {
    await navigator.share(shareData);
    return true;
  } catch (err) {
    // User cancelled the share sheet — not an error
    if ((err as DOMException).name === 'AbortError') return true;
    return false;
  }
}

export async function shareAllToCamera(dataUrls: string[]): Promise<boolean> {
  const files = dataUrls.map((url, i) =>
    dataUrlToFile(url, `slide-${String(i + 1).padStart(2, '0')}.png`)
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
