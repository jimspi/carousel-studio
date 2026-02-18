'use client';

import { useCallback, useRef, useState } from 'react';
import { UploadedImage } from '@/types';

interface ImageGridProps {
  images: UploadedImage[];
  onRemove: (id: string) => void;
  onReorder: (images: UploadedImage[]) => void;
}

export default function ImageGrid({ images, onRemove, onReorder }: ImageGridProps) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const dragRef = useRef<number | null>(null);

  const handleDragStart = useCallback((idx: number) => {
    dragRef.current = idx;
    setDragIdx(idx);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setOverIdx(idx);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIdx: number) => {
      e.preventDefault();
      const fromIdx = dragRef.current;
      if (fromIdx === null || fromIdx === dropIdx) {
        setDragIdx(null);
        setOverIdx(null);
        return;
      }

      const updated = [...images];
      const [moved] = updated.splice(fromIdx, 1);
      updated.splice(dropIdx, 0, moved);
      const reordered = updated.map((img, i) => ({ ...img, order: i }));
      onReorder(reordered);
      setDragIdx(null);
      setOverIdx(null);
    },
    [images, onReorder]
  );

  const handleDragEnd = () => {
    setDragIdx(null);
    setOverIdx(null);
  };

  if (images.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
      {images.map((img, idx) => (
        <div
          key={img.id}
          draggable
          onDragStart={() => handleDragStart(idx)}
          onDragOver={(e) => handleDragOver(e, idx)}
          onDrop={(e) => handleDrop(e, idx)}
          onDragEnd={handleDragEnd}
          className={`
            relative aspect-square rounded-lg overflow-hidden border transition-all duration-150 cursor-grab active:cursor-grabbing
            ${overIdx === idx && dragIdx !== idx ? 'border-primary border-2' : 'border-border'}
            ${dragIdx === idx ? 'opacity-40' : 'opacity-100'}
          `}
        >
          <img
            src={img.previewUrl}
            alt={`Slide ${idx + 1}`}
            className="w-full h-full object-cover"
            draggable={false}
          />
          {/* Slide number badge */}
          <span className="absolute top-2 left-2 bg-black/70 text-white text-xs font-medium px-1.5 py-0.5 rounded">
            {idx + 1}
          </span>
          {/* Remove button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(img.id);
            }}
            className="absolute top-2 right-2 w-6 h-6 bg-black/70 hover:bg-black/90 text-white rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-sm leading-none hover:opacity-100"
            style={{ opacity: 1 }}
            aria-label={`Remove slide ${idx + 1}`}
          >
            x
          </button>
        </div>
      ))}
    </div>
  );
}
