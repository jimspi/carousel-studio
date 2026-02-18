'use client';

import { ProcessedSlide } from '@/types';
import { downloadSingleSlide, downloadAllSlides } from '@/lib/downloadUtils';
import { useState } from 'react';

interface DownloadButtonsProps {
  slides: ProcessedSlide[];
  currentSlide: number;
}

export default function DownloadButtons({ slides, currentSlide }: DownloadButtonsProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadSingle = () => {
    const slide = slides[currentSlide];
    if (slide) {
      downloadSingleSlide(slide.imageData, slide.slideNumber);
    }
  };

  const handleDownloadAll = async () => {
    setDownloading(true);
    try {
      await downloadAllSlides(slides.map((s) => s.imageData));
    } finally {
      setDownloading(false);
    }
  };

  if (slides.length === 0) return null;

  return (
    <div className="flex gap-3 mt-6 max-w-[540px] mx-auto">
      <button
        onClick={handleDownloadSingle}
        className="flex-1 py-2.5 rounded-md text-sm font-medium border border-border text-primary hover:bg-hover transition-all duration-150"
      >
        Download This Slide
      </button>
      <button
        onClick={handleDownloadAll}
        disabled={downloading}
        className="flex-1 py-2.5 rounded-md text-sm font-medium bg-primary text-white hover:bg-accent-hover transition-all duration-150 disabled:opacity-50"
      >
        {downloading ? 'Preparing...' : 'Download All'}
      </button>
    </div>
  );
}
