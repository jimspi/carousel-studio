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
