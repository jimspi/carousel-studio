'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ProcessedSlide } from '@/types';

interface SuggestedPreviewProps {
  slides: ProcessedSlide[];
  tips: string[];
  onUseSuggested: () => void;
  onSlideChange?: (index: number) => void;
}

export default function SuggestedPreview({
  slides,
  tips,
  onUseSuggested,
  onSlideChange,
}: SuggestedPreviewProps) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    setCurrent(0);
    onSlideChange?.(0);
  }, [slides, onSlideChange]);

  const goTo = useCallback(
    (idx: number) => {
      if (idx >= 0 && idx < slides.length) {
        setCurrent(idx);
        onSlideChange?.(idx);
      }
    },
    [slides.length, onSlideChange]
  );

  const prev = useCallback(() => goTo(current - 1), [current, goTo]);
  const next = useCallback(() => goTo(current + 1), [current, goTo]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
  };

  if (slides.length === 0) return null;

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-serif text-primary">Suggested</h2>
        <button
          onClick={onUseSuggested}
          className="px-4 py-1.5 text-sm font-medium rounded-md bg-primary text-white hover:bg-accent-hover transition-all duration-150"
        >
          Use Suggested
        </button>
      </div>

      {/* Tips */}
      {tips.length > 0 && (
        <div className="mb-4 p-3 rounded-md bg-hover border border-border">
          <p className="text-xs font-medium text-secondary mb-1.5">What changed</p>
          <ul className="space-y-1">
            {tips.map((tip, i) => (
              <li key={i} className="text-xs text-secondary leading-relaxed flex items-start gap-1.5">
                <span className="text-muted mt-px flex-shrink-0">&#8227;</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Carousel */}
      <div
        className="relative max-w-[540px] mx-auto select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="overflow-hidden rounded-lg border border-border">
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {slides.map((slide) => (
              <div key={slide.slideNumber} className="w-full flex-shrink-0">
                <img
                  src={slide.imageData}
                  alt={`Suggested slide ${slide.slideNumber}`}
                  className="w-full h-auto block"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>

        {current > 0 && (
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-md flex items-center justify-center transition-colors duration-150"
            aria-label="Previous suggested slide"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        {current < slides.length - 1 && (
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-md flex items-center justify-center transition-colors duration-150"
            aria-label="Next suggested slide"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Dots */}
      <div className="flex items-center justify-center gap-1.5 mt-4">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`w-2 h-2 rounded-full transition-all duration-150 ${
              i === current ? 'bg-primary' : 'bg-border-strong'
            }`}
            aria-label={`Go to suggested slide ${i + 1}`}
          />
        ))}
      </div>
      <p className="text-center text-sm text-muted mt-2">
        {current + 1} / {slides.length}
      </p>
    </div>
  );
}
