'use client';

import { AspectRatio } from '@/types';

interface AspectToggleProps {
  value: AspectRatio;
  onChange: (value: AspectRatio) => void;
}

const options: { value: AspectRatio; label: string }[] = [
  { value: '1:1', label: '1:1' },
  { value: '4:5', label: '4:5' },
  { value: 'original', label: 'Original' },
];

export default function AspectToggle({ value, onChange }: AspectToggleProps) {
  return (
    <div className="flex items-center gap-2 mt-3">
      <span className="text-sm text-secondary mr-1">Aspect ratio</span>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1 text-sm rounded-md border transition-all duration-150 ${
            value === opt.value
              ? 'bg-primary text-white border-primary'
              : 'bg-transparent text-secondary border-border hover:border-primary/40'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
