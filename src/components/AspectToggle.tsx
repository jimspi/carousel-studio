'use client';

import { AspectRatio } from '@/types';

interface AspectToggleProps {
  value: AspectRatio;
  onChange: (value: AspectRatio) => void;
}

export default function AspectToggle({ value, onChange }: AspectToggleProps) {
  return (
    <div className="flex items-center gap-2 mt-3">
      <span className="text-sm text-secondary mr-1">Aspect ratio</span>
      <button
        onClick={() => onChange('1:1')}
        className={`px-3 py-1 text-sm rounded-md border transition-all duration-150 ${
          value === '1:1'
            ? 'bg-primary text-white border-primary'
            : 'bg-transparent text-secondary border-border hover:border-primary/40'
        }`}
      >
        1:1
      </button>
      <button
        onClick={() => onChange('4:5')}
        className={`px-3 py-1 text-sm rounded-md border transition-all duration-150 ${
          value === '4:5'
            ? 'bg-primary text-white border-primary'
            : 'bg-transparent text-secondary border-border hover:border-primary/40'
        }`}
      >
        4:5
      </button>
    </div>
  );
}
