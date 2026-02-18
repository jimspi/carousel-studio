'use client';

import { ProcessedSlide } from '@/types';
import {
  downloadSingleSlide,
  downloadAllSlides,
  canShareFiles,
  shareToCamera,
  shareAllToCamera,
} from '@/lib/downloadUtils';
import { useState, useEffect } from 'react';

interface DownloadButtonsProps {
  slides: ProcessedSlide[];
  currentSlide: number;
}

export default function DownloadButtons({ slides, currentSlide }: DownloadButtonsProps) {
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [showShare, setShowShare] = useState(false);

  // Detect share API support on mount (client-side only)
  useEffect(() => {
    setShowShare(canShareFiles());
  }, []);

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

  const handleShareSingle = async () => {
    const slide = slides[currentSlide];
    if (!slide) return;
    setSharing(true);
    try {
      const shared = await shareToCamera(slide.imageData, slide.slideNumber);
      if (!shared) {
        // Fallback to regular download
        downloadSingleSlide(slide.imageData, slide.slideNumber);
      }
    } finally {
      setSharing(false);
    }
  };

  const handleShareAll = async () => {
    setSharing(true);
    try {
      const shared = await shareAllToCamera(slides.map((s) => s.imageData));
      if (!shared) {
        // Fallback to zip download
        await downloadAllSlides(slides.map((s) => s.imageData));
      }
    } finally {
      setSharing(false);
    }
  };

  if (slides.length === 0) return null;

  return (
    <div className="mt-6 max-w-[540px] mx-auto space-y-3">
      <div className="flex gap-3">
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

      {showShare && (
        <div className="flex gap-3">
          <button
            onClick={handleShareSingle}
            disabled={sharing}
            className="flex-1 py-2.5 rounded-md text-sm font-medium border border-border text-primary hover:bg-hover transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
              <path d="M8 2v8M4 6l4-4 4 4M2 10v2a2 2 0 002 2h8a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {sharing ? 'Sharing...' : 'Save to Camera Roll'}
          </button>
          <button
            onClick={handleShareAll}
            disabled={sharing}
            className="flex-1 py-2.5 rounded-md text-sm font-medium border border-border text-primary hover:bg-hover transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
              <path d="M8 2v8M4 6l4-4 4 4M2 10v2a2 2 0 002 2h8a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {sharing ? 'Sharing...' : 'Save All to Camera Roll'}
          </button>
        </div>
      )}
    </div>
  );
}
