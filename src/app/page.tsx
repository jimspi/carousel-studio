'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { UploadedImage, ProcessedSlide, AspectRatio, SlideStyle, FONTS, TEXT_COLORS } from '@/types';
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

const DEFAULT_STYLE: SlideStyle = {
  isQuote: false,
  textPosition: 'bottom',
  textColor: '#FFFFFF',
  gradientIntensity: 'medium',
  imageOffsetY: 0.15,
};

// localStorage helpers
function loadSaved<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const v = localStorage.getItem(`carousel-studio-${key}`);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}
function save(key: string, value: unknown) {
  try { localStorage.setItem(`carousel-studio-${key}`, JSON.stringify(value)); } catch {}
}

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
  const [editingText, setEditingText] = useState('');
  const [editingStyle, setEditingStyle] = useState<SlideStyle>({ ...DEFAULT_STYLE });
  const [updatingSlide, setUpdatingSlide] = useState(false);

  // Live preview
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const previewGenId = useRef(0); // to discard stale renders

  // Undo / redo history
  const undoStack = useRef<ProcessedSlide[][]>([]);
  const redoStack = useRef<ProcessedSlide[][]>([]);

  // Restore saved inputs on mount
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    setText(loadSaved('text', ''));
    setAspectRatio(loadSaved('aspectRatio', '1:1'));
    setFontId(loadSaved('fontId', 'dm-sans'));
  }, []);

  // Persist inputs on change
  useEffect(() => { if (mounted.current) save('text', text); }, [text]);
  useEffect(() => { if (mounted.current) save('aspectRatio', aspectRatio); }, [aspectRatio]);
  useEffect(() => { if (mounted.current) save('fontId', fontId); }, [fontId]);

  // Revoke blob URLs for old slides to free memory
  const revokeSlideURLs = useCallback((oldSlides: ProcessedSlide[]) => {
    oldSlides.forEach((s) => {
      if (s.imageData.startsWith('blob:')) URL.revokeObjectURL(s.imageData);
    });
  }, []);

  // Derive active slides for the current version
  const activeSlides = activeVersion === 'yours' ? slides : suggestedSlides;
  const currentSlideData = activeSlides[currentSlide];
  const currentSlideText = currentSlideData?.textContent ?? '';
  const currentSlideStyle = currentSlideData?.style ?? { ...DEFAULT_STYLE };

  // Sync editing text and style when navigating slides or switching versions
  useEffect(() => {
    setEditingText(currentSlideText);
    setEditingStyle({ ...DEFAULT_STYLE, ...currentSlideStyle });
  }, [currentSlideText, currentSlideStyle]);

  // Push current slides to undo stack before a change
  const pushUndo = useCallback(() => {
    const target = activeVersion === 'yours' ? slides : suggestedSlides;
    undoStack.current.push([...target]);
    redoStack.current = [];
  }, [slides, suggestedSlides, activeVersion]);

  const handleUndo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (!prev) return;
    const target = activeVersion === 'yours' ? slides : suggestedSlides;
    redoStack.current.push([...target]);
    if (activeVersion === 'yours') setSlides(prev);
    else setSuggestedSlides(prev);
  }, [slides, suggestedSlides, activeVersion]);

  const handleRedo = useCallback(() => {
    const next = redoStack.current.pop();
    if (!next) return;
    const target = activeVersion === 'yours' ? slides : suggestedSlides;
    undoStack.current.push([...target]);
    if (activeVersion === 'yours') setSlides(next);
    else setSuggestedSlides(next);
  }, [slides, suggestedSlides, activeVersion]);

  const clearAll = useCallback(() => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    revokeSlideURLs(slides);
    revokeSlideURLs(suggestedSlides);
    setImages([]);
    setText('');
    setSlides([]);
    setSuggestedSlides([]);
    setSuggestedTips([]);
    setCurrentSlide(0);
    setActiveVersion('yours');
    setProgress(null);
    setProcessing(false);
    setEditingText('');
    setEditingStyle({ ...DEFAULT_STYLE });
    if (previewImage?.startsWith('blob:')) URL.revokeObjectURL(previewImage);
    setPreviewImage(null);
    undoStack.current = [];
    redoStack.current = [];
  }, [images, slides, suggestedSlides, revokeSlideURLs, previewImage]);

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
    revokeSlideURLs(slides);
    revokeSlideURLs(suggestedSlides);
    setSlides([]);
    setSuggestedSlides([]);
    setSuggestedTips([]);
    setCurrentSlide(0);
    setActiveVersion('yours');
    undoStack.current = [];
    redoStack.current = [];

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
          style: { ...DEFAULT_STYLE },
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
          style: { ...DEFAULT_STYLE },
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
  }, [images, text, aspectRatio, fontId, slides, suggestedSlides, revokeSlideURLs]);

  const handleUseSuggested = useCallback(() => {
    if (suggestedSlides.length > 0) {
      setSlides(suggestedSlides);
      setSuggestedSlides([]);
      setSuggestedTips([]);
      setActiveVersion('yours');
      setCurrentSlide(0);
    }
  }, [suggestedSlides]);

  const handleUpdateSlideText = useCallback(async () => {
    if (currentSlide >= images.length) return;
    pushUndo();
    setUpdatingSlide(true);
    try {
      // Reuse live preview image if available, otherwise render fresh
      let newImageData: string;
      if (previewImage) {
        newImageData = previewImage;
        setPreviewImage(null);
      } else {
        const font = FONTS.find((f) => f.id === fontId) ?? FONTS[0];
        newImageData = await renderSlide(
          images[currentSlide].file,
          editingText,
          aspectRatio,
          font.family,
          font.weight,
          editingStyle
        );
      }
      const oldImageData = activeSlides[currentSlide]?.imageData;
      if (oldImageData?.startsWith('blob:') && oldImageData !== newImageData) {
        URL.revokeObjectURL(oldImageData);
      }
      const updater = (prev: ProcessedSlide[]) =>
        prev.map((s, i) =>
          i === currentSlide
            ? { ...s, imageData: newImageData, textContent: editingText, style: { ...editingStyle } }
            : s
        );
      if (activeVersion === 'yours') {
        setSlides(updater);
      } else {
        setSuggestedSlides(updater);
      }
    } finally {
      setUpdatingSlide(false);
    }
  }, [currentSlide, editingText, editingStyle, images, aspectRatio, fontId, activeVersion, activeSlides, pushUndo, previewImage]);

  // Reorder generated slides
  const handleMoveSlide = useCallback((direction: -1 | 1) => {
    const target = currentSlide + direction;
    if (target < 0 || target >= activeSlides.length) return;
    pushUndo();

    const reorderArr = <T,>(arr: T[]) => {
      const next = [...arr];
      [next[currentSlide], next[target]] = [next[target], next[currentSlide]];
      return next.map((item, i) => ({ ...item, slideNumber: i + 1 }));
    };

    if (activeVersion === 'yours') {
      setSlides((prev) => reorderArr(prev));
    } else {
      setSuggestedSlides((prev) => reorderArr(prev));
    }

    // Also reorder images so re-rendering works correctly
    setImages((prev) => {
      const next = [...prev];
      [next[currentSlide], next[target]] = [next[target], next[currentSlide]];
      return next.map((img, i) => ({ ...img, order: i }));
    });

    setCurrentSlide(target);
  }, [currentSlide, activeSlides.length, activeVersion, pushUndo]);

  const canGenerate = images.length > 0 && text.trim().length > 0;
  const slideChanged =
    editingText !== currentSlideText ||
    editingStyle.isQuote !== currentSlideStyle.isQuote ||
    editingStyle.textPosition !== currentSlideStyle.textPosition ||
    editingStyle.textColor !== currentSlideStyle.textColor ||
    editingStyle.gradientIntensity !== currentSlideStyle.gradientIntensity ||
    editingStyle.imageOffsetY !== currentSlideStyle.imageOffsetY;

  // Debounced live preview: re-render the current slide as user edits
  useEffect(() => {
    if (!slideChanged || currentSlide >= images.length || activeSlides.length === 0) {
      setPreviewImage(null);
      return;
    }

    clearTimeout(previewTimer.current);
    const id = ++previewGenId.current;
    previewTimer.current = setTimeout(async () => {
      const font = FONTS.find((f) => f.id === fontId) ?? FONTS[0];
      try {
        const img = await renderSlide(
          images[currentSlide].file,
          editingText,
          aspectRatio,
          font.family,
          font.weight,
          editingStyle
        );
        // Only apply if this is still the latest request
        if (previewGenId.current === id) {
          setPreviewImage((prev) => {
            if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
            return img;
          });
        } else {
          if (img.startsWith('blob:')) URL.revokeObjectURL(img);
        }
      } catch {
        // Silently ignore preview render failures
      }
    }, 300);

    return () => clearTimeout(previewTimer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingText, editingStyle, currentSlide, slideChanged]);

  // Build display slides: swap in preview image for the current slide
  const displaySlides = useMemo(() => {
    if (!previewImage || !slideChanged) return activeSlides;
    return activeSlides.map((s, i) =>
      i === currentSlide ? { ...s, imageData: previewImage } : s
    );
  }, [activeSlides, previewImage, currentSlide, slideChanged]);

  const displayYours = activeVersion === 'yours' ? displaySlides : slides;
  const displaySuggested = activeVersion === 'suggested' ? displaySlides : suggestedSlides;

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
              <CarouselPreview
                slides={displayYours}
                onSlideChange={setCurrentSlide}
              />
            )}

            {/* Suggested Version */}
            {activeVersion === 'suggested' && suggestedSlides.length > 0 && (
              <SuggestedPreview
                slides={displaySuggested}
                tips={suggestedTips}
                onUseSuggested={handleUseSuggested}
                onSlideChange={setCurrentSlide}
              />
            )}

            {/* Slide editor panel */}
            {activeSlides.length > 0 && (
              <div className="max-w-[540px] mx-auto mt-4 space-y-3">
                {/* Reorder + Undo/Redo bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveSlide(-1)}
                      disabled={currentSlide === 0}
                      className="p-1.5 rounded text-xs text-muted hover:text-primary hover:bg-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
                      title="Move slide left"
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <span className="text-xs font-medium text-secondary px-1">
                      Slide {currentSlide + 1} of {activeSlides.length}
                    </span>
                    <button
                      onClick={() => handleMoveSlide(1)}
                      disabled={currentSlide === activeSlides.length - 1}
                      className="p-1.5 rounded text-xs text-muted hover:text-primary hover:bg-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
                      title="Move slide right"
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleUndo}
                      disabled={undoStack.current.length === 0}
                      className="p-1.5 rounded text-xs text-muted hover:text-primary hover:bg-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
                      title="Undo"
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 7h6a3 3 0 0 1 0 6H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 4L4 7l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <button
                      onClick={handleRedo}
                      disabled={redoStack.current.length === 0}
                      className="p-1.5 rounded text-xs text-muted hover:text-primary hover:bg-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
                      title="Redo"
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M12 7H6a3 3 0 0 0 0 6h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                </div>

                {/* Text editor */}
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1.5">
                    Slide text
                  </label>
                  <textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    placeholder="Add or edit text for this slide..."
                    className={`w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-primary resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-150 ${editingStyle.isQuote ? 'italic font-serif' : ''}`}
                    rows={3}
                  />
                </div>

                {/* Style controls */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Quote toggle */}
                  <button
                    type="button"
                    onClick={() => setEditingStyle((s) => ({ ...s, isQuote: !s.isQuote }))}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-all duration-150 ${
                      editingStyle.isQuote
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted hover:text-secondary hover:bg-hover'
                    }`}
                  >
                    <span className="font-serif italic text-sm leading-none">&ldquo;</span>
                    Quote
                  </button>

                  {/* Text position */}
                  <div className="flex rounded-md border border-border overflow-hidden">
                    {(['top', 'middle', 'bottom'] as const).map((pos) => (
                      <button
                        key={pos}
                        onClick={() => setEditingStyle((s) => ({ ...s, textPosition: pos }))}
                        className={`flex-1 py-1.5 text-xs font-medium transition-all duration-150 ${
                          editingStyle.textPosition === pos
                            ? 'bg-primary text-white'
                            : 'text-muted hover:text-secondary hover:bg-hover'
                        }`}
                      >
                        {pos.charAt(0).toUpperCase() + pos.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text color */}
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1.5">Text Color</label>
                  <div className="flex items-center gap-2">
                    {TEXT_COLORS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setEditingStyle((s) => ({ ...s, textColor: c.value }))}
                        className={`w-7 h-7 rounded-full border-2 transition-all duration-150 ${
                          editingStyle.textColor === c.value
                            ? 'border-primary scale-110'
                            : 'border-border hover:border-secondary'
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Gradient intensity */}
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1.5">Gradient</label>
                  <div className="flex rounded-md border border-border overflow-hidden">
                    {(['none', 'light', 'medium', 'heavy'] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => setEditingStyle((s) => ({ ...s, gradientIntensity: g }))}
                        className={`flex-1 py-1.5 text-xs font-medium transition-all duration-150 ${
                          editingStyle.gradientIntensity === g
                            ? 'bg-primary text-white'
                            : 'text-muted hover:text-secondary hover:bg-hover'
                        }`}
                      >
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image vertical position */}
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1.5">
                    Image Position
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted">Top</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={editingStyle.imageOffsetY ?? 0.15}
                      onChange={(e) =>
                        setEditingStyle((s) => ({ ...s, imageOffsetY: parseFloat(e.target.value) }))
                      }
                      className="flex-1 h-1.5 accent-primary"
                    />
                    <span className="text-xs text-muted">Bottom</span>
                  </div>
                </div>

                {/* Update button */}
                {slideChanged && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-muted italic">
                      {previewImage ? 'Live preview' : 'Rendering preview...'}
                    </span>
                    <button
                      onClick={handleUpdateSlideText}
                      disabled={updatingSlide}
                      className="px-4 py-1.5 text-sm font-medium rounded-md bg-primary text-white hover:bg-accent-hover transition-all duration-150 disabled:opacity-50"
                    >
                      {updatingSlide ? 'Updating...' : 'Update Slide'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Download */}
            {activeVersion === 'yours' && (
              <DownloadButtons slides={slides} currentSlide={currentSlide} />
            )}
            {activeVersion === 'suggested' && suggestedSlides.length > 0 && (
              <DownloadButtons slides={suggestedSlides} currentSlide={currentSlide} />
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

        {/* How It Works — only shown before generating */}
        {slides.length === 0 && <HowItWorks />}
      </main>
    </>
  );
}
