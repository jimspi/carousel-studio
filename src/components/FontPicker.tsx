'use client';

import { FONTS } from '@/types';

interface FontPickerProps {
  value: string;
  onChange: (fontId: string) => void;
}

export default function FontPicker({ value, onChange }: FontPickerProps) {
  return (
    <div className="flex items-center gap-2 mt-3 flex-wrap">
      <span className="text-sm text-secondary mr-1">Font</span>
      {FONTS.map((font) => (
        <button
          key={font.id}
          onClick={() => onChange(font.id)}
          style={{ fontFamily: font.family }}
          className={`px-3 py-1 text-sm rounded-md border transition-all duration-150 ${
            value === font.id
              ? 'bg-primary text-white border-primary'
              : 'bg-transparent text-secondary border-border hover:border-primary/40'
          }`}
        >
          {font.label}
        </button>
      ))}
    </div>
  );
}
