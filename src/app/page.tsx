'use client';

import { useState, useCallback } from 'react';
import { UploadedImage, ProcessedSlide, AspectRatio } from '@/types';
import { distributeText } from '@/lib/distributeText';
import { renderSlide } from '@/lib/renderSlide';
import Header from '@/components/Header';
import UploadZone from '@/components/UploadZone';
import ImageGrid from '@/components/ImageGrid';
import TextInput from '@/components/TextInput';
import AspectToggle from '@/components/AspectToggle';
import GenerateButton from '@/components/GenerateButton';
import CarouselPreview from '@/components/CarouselPreview';
import DownloadButtons from '@/components/DownloadButtons';
import HowItWorks from '@/components/HowItWorks';

export default function Home() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [text, setText] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [slides, setSlides] = useState<ProcessedSlide[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleImagesAdded = useCallback((newImages: UploadedImage[]) => {
    setImages((prev) => [...prev, ...newImages]);
    setSlides([]);
  }, []);

  const handleRemoveImage = useCallback((id: string) => {
    setImages((prev) => {
      const toRemove = prev.find((img) => img.id === id);
      if (toRemove) URL.revokeObjectURL(toRemove.previewUrl);
      const filtered = prev.filter((img) => img.id !== id);
      return filtered.map((img, i) => ({ ...img, order: i }));
    });
    setSlides([]);
  }, []);

  const handleReorder = useCallback((reordered: UploadedImage[]) => {
    setImages(reordered);
    setSlides([]);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (images.length === 0 || !text.trim()) return;

    setProcessing(true);
    setSlides([]);
    setCurrentSlide(0);

    const textChunks = distributeText(text, images.length);
    const total = images.length;
    const generated: ProcessedSlide[] = [];

    try {
      for (let i = 0; i < total; i++) {
        setProgress({ current: i + 1, total });
        const imageData = await renderSlide(images[i].file, textChunks[i], aspectRatio);
        generated.push({
          imageData,
          slideNumber: i + 1,
          textContent: textChunks[i],
        });
      }
      setSlides(generated);
    } catch (err) {
      console.error('Slide generation failed:', err);
    } finally {
      setProcessing(false);
      setProgress(null);
    }
  }, [images, text, aspectRatio]);

  const canGenerate = images.length > 0 && text.trim().length > 0;

  return (
    <>
      <Header />
      <main className="max-w-[960px] mx-auto px-6 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl font-semibold text-primary mb-3">
            Turn your words into carousel posts
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
          <TextInput value={text} onChange={setText} />
          <AspectToggle value={aspectRatio} onChange={setAspectRatio} />
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

        {/* Preview */}
        {slides.length > 0 && (
          <section>
            <CarouselPreview
              slides={slides}
              onSlideChange={setCurrentSlide}
            />
            <DownloadButtons slides={slides} currentSlide={currentSlide} />
          </section>
        )}

        {/* How It Works */}
        <HowItWorks />
      </main>
    </>
  );
}
