'use client';

import { useRef, useEffect, useMemo } from 'react';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  imageCount: number;
}

export default function TextInput({ value, onChange, imageCount }: TextInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.max(120, el.scrollHeight)}px`;
    }
  }, [value]);

  const tip = useMemo(() => {
    const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
    if (wordCount === 0) return null;
    if (imageCount === 0) return { text: 'Add images to see per-slide tips', tone: 'neutral' as const };

    const wps = Math.round(wordCount / imageCount);
    const stats = `~${wps} words/slide across ${imageCount} image${imageCount === 1 ? '' : 's'}`;

    if (wps < 10) return { text: `${stats} — Short and punchy, great for hooks and CTAs`, tone: 'good' as const };
    if (wps <= 25) return { text: `${stats} — Optimal range, viral carousels average 15-25 words per slide`, tone: 'great' as const };
    if (wps <= 40) return { text: `${stats} — Getting dense, consider adding more slides or trimming`, tone: 'warn' as const };
    return { text: `${stats} — Too much text per slide, readers will scroll past`, tone: 'bad' as const };
  }, [value, imageCount]);

  const toneColors = {
    neutral: 'text-muted',
    good: 'text-secondary',
    great: 'text-success',
    warn: 'text-secondary',
    bad: 'text-secondary',
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste your text here — it will be split across your images automatically"
        className="w-full min-h-[120px] px-4 py-3 border border-border rounded-md bg-surface text-primary text-base font-sans placeholder:text-muted resize-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-focus transition-all duration-150"
      />
      <div className="flex items-center justify-between mt-1.5 px-1">
        {tip ? (
          <p className={`text-xs ${toneColors[tip.tone]} leading-relaxed`}>
            {tip.text}
          </p>
        ) : (
          <span />
        )}
        <span className="text-xs text-muted flex-shrink-0 ml-4">
          {value.length} chars
        </span>
      </div>
    </div>
  );
}
