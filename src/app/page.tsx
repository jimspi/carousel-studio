'use client';

import { useState, useCallback } from 'react';
import { UploadedImage, ProcessedSlide, AspectRatio, FONTS } from '@/types';
import { distributeText } from '@/lib/distributeText';
import { distributeSuggestedText } from '@/lib/distributeSuggestedText';
import { renderSlide } from '@/lib/renderSlide';
import Header from '@/components/Header';
import UploadZone from '@/components/UploadZone';
import ImageGrid from '@/components/ImageGrid';
import TextInput from '@/components/TextInput';
import AspectToggle from '@/components/AspectToggle';
import FontPicker from '@/components/FontPicker';
import GenerateButton from '@/components/GenerateButton';
import CarouselPreview from '@/components/CarouselPreview';
import SuggestedPreview from '@/components/SuggestedPreview';
import DownloadButtons from '@/components/DownloadButtons';
import HowItWorks from '@/components/HowItWorks';

export default function Home() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [text, setText] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [fontId, setFontId] = useState('dm-sans');
  const [slides, setSlides] = useState<ProcessedSlide[]>([]);
  const [suggestedSlides, setSuggestedSlides] = useState<ProcessedSlide[]>([]);
  const [suggestedTips, setSuggestedTips] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeVersion, setActiveVersion] = useState<'yours' | 'suggested'>('yours');

  const clearAll = useCallback(() => {
    // Revoke all image URLs
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setText('');
    setSlides([]);
    setSuggestedSlides([]);
    setSuggestedTips([]);
    setCurrentSlide(0);
    setActiveVersion('yours');
    setProgress(null);
    setProcessing(false);
  }, [images]);

  const handleImagesAdded = useCallback((newImages: UploadedImage[]) => {
    setImages((prev) => [...prev, ...newImages]);
    setSlides([]);
    setSuggestedSlides([]);
    setSuggestedTips([]);
  }, []);

  const handleRemoveImage = useCallback((id: string) => {
    setImages((prev) => {
      const toRemove = prev.find((img) => img.id === id);
      if (toRemove) URL.revokeObjectURL(toRemove.previewUrl);
      const filtered = prev.filter((img) => img.id !== id);
      return filtered.map((img, i) => ({ ...img, order: i }));
    });
    setSlides([]);
    setSuggestedSlides([]);
    setSuggestedTips([]);
  }, []);

  const handleReorder = useCallback((reordered: UploadedImage[]) => {
    setImages(reordered);
    setSlides([]);
    setSuggestedSlides([]);
    setSuggestedTips([]);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (images.length === 0 || !text.trim()) return;

    const font = FONTS.find((f) => f.id === fontId) ?? FONTS[0];

    setProcessing(true);
    setSlides([]);
    setSuggestedSlides([]);
    setSuggestedTips([]);
    setCurrentSlide(0);
    setActiveVersion('yours');

    const textChunks = distributeText(text, images.length);
    const suggested = distributeSuggestedText(text, images.length);
    const total = images.length;
    const generated: ProcessedSlide[] = [];
    const sugGenerated: ProcessedSlide[] = [];

    try {
      for (let i = 0; i < total; i++) {
        setProgress({ current: i + 1, total: total * 2 });
        const imageData = await renderSlide(
          images[i].file, textChunks[i], aspectRatio, font.family, font.weight
        );
        generated.push({
          imageData,
          slideNumber: i + 1,
          textContent: textChunks[i],
        });
      }

      for (let i = 0; i < total; i++) {
        setProgress({ current: total + i + 1, total: total * 2 });
        const imageData = await renderSlide(
          images[i].file, suggested.chunks[i] || '', aspectRatio, font.family, font.weight
        );
        sugGenerated.push({
          imageData,
          slideNumber: i + 1,
          textContent: suggested.chunks[i] || '',
        });
      }

      setSlides(generated);
      setSuggestedSlides(sugGenerated);
      setSuggestedTips(suggested.tips);
    } catch (err) {
      console.error('Slide generation failed:', err);
    } finally {
      setProcessing(false);
      setProgress(null);
    }
  }, [images, text, aspectRatio, fontId]);

  const handleUseSuggested = useCallback(() => {
    if (suggestedSlides.length > 0) {
      setSlides(suggestedSlides);
      setSuggestedSlides([]);
      setSuggestedTips([]);
      setActiveVersion('yours');
      setCurrentSlide(0);
    }
  }, [suggestedSlides]);

  const canGenerate = images.length > 0 && text.trim().length > 0;

  return (
    <>
      <Header />
      <main className="max-w-[960px] mx-auto px-6 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl font-semibold text-primary mb-3">
            Turn your pictures and words into carousel posts
          </h1>
          <p className="text-lg text-secondary">
            Upload images, paste your text, download ready-to-post slides.
          </p>
        </div>

        {/* Upload */}
        <section className="mb-8">
          <UploadZone images={images} onImagesAdded={handleImagesAdded} />
          <ImageGrid
            images={images}
            onRemove={handleRemoveImage}
            onReorder={handleReorder}
          />
        </section>

        {/* Text */}
        <section className="mb-6">
          <TextInput value={text} onChange={setText} imageCount={images.length} />
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6">
            <AspectToggle value={aspectRatio} onChange={setAspectRatio} />
            <FontPicker value={fontId} onChange={setFontId} />
          </div>
        </section>

        {/* Generate */}
        <section className="mb-6">
          <GenerateButton
            disabled={!canGenerate}
            processing={processing}
            progress={progress}
            onClick={handleGenerate}
          />
        </section>

        {/* Previews */}
        {slides.length > 0 && (
          <section>
            {/* Version tabs when both exist */}
            {suggestedSlides.length > 0 && (
              <div className="flex gap-1 mb-2 border-b border-border">
                <button
                  onClick={() => setActiveVersion('yours')}
                  className={`px-4 py-2 text-sm font-medium transition-all duration-150 border-b-2 -mb-px ${
                    activeVersion === 'yours'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted hover:text-secondary'
                  }`}
                >
                  Your Version
                </button>
                <button
                  onClick={() => setActiveVersion('suggested')}
                  className={`px-4 py-2 text-sm font-medium transition-all duration-150 border-b-2 -mb-px ${
                    activeVersion === 'suggested'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted hover:text-secondary'
                  }`}
                >
                  Suggested
                </button>
              </div>
            )}

            {/* Your Version */}
            {activeVersion === 'yours' && (
              <>
                <CarouselPreview
                  slides={slides}
                  onSlideChange={setCurrentSlide}
                />
                <DownloadButtons slides={slides} currentSlide={currentSlide} />
              </>
            )}

            {/* Suggested Version */}
            {activeVersion === 'suggested' && suggestedSlides.length > 0 && (
              <>
                <SuggestedPreview
                  slides={suggestedSlides}
                  tips={suggestedTips}
                  onUseSuggested={handleUseSuggested}
                  onSlideChange={setCurrentSlide}
                />
                <DownloadButtons slides={suggestedSlides} currentSlide={currentSlide} />
              </>
            )}

            {/* Make Another */}
            <div className="mt-8 text-center">
              <button
                onClick={clearAll}
                className="px-6 py-2.5 rounded-md text-sm font-medium border border-border text-secondary hover:text-primary hover:bg-hover transition-all duration-150"
              >
                Make Another Carousel
              </button>
            </div>
          </section>
        )}

        {/* How It Works */}
        <HowItWorks />
      </main>
    </>
  );
}
