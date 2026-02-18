'use client';

import { useCallback, useRef, useState } from 'react';
import { UploadedImage } from '@/types';

interface UploadZoneProps {
  images: UploadedImage[];
  onImagesAdded: (images: UploadedImage[]) => void;
}

export default function UploadZone({ images, onImagesAdded }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const accepted = Array.from(files).filter((f) =>
        ['image/jpeg', 'image/png', 'image/webp'].includes(f.type)
      );
      const remaining = 10 - images.length;
      const toAdd = accepted.slice(0, remaining);

      const newImages: UploadedImage[] = toAdd.map((file, i) => ({
        id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        order: images.length + i,
      }));

      if (newImages.length > 0) {
        onImagesAdded(newImages);
      }
    },
    [images.length, onImagesAdded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  const isFull = images.length >= 10;

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={isFull ? undefined : handleClick}
      className={`
        min-h-[200px] border-2 border-dashed rounded-lg transition-all duration-150
        flex items-center justify-center
        ${isFull ? 'cursor-default' : 'cursor-pointer'}
        ${
          isDragOver
            ? 'border-primary bg-drop'
            : 'border-border-strong hover:border-primary/40'
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        multiple
        onChange={handleInputChange}
        className="hidden"
      />
      <div className="text-center px-6 py-10">
        {isFull ? (
          <p className="text-muted text-sm">Maximum 10 images reached</p>
        ) : (
          <>
            <p className="text-secondary text-base mb-1">
              Drop images here or click to browse
            </p>
            <p className="text-muted text-sm">
              JPG, PNG, or WebP — up to 10 images
            </p>
          </>
        )}
      </div>
    </div>
  );
}
