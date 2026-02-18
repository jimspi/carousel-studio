'use client';

import { useRef, useEffect } from 'react';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function TextInput({ value, onChange }: TextInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.max(120, el.scrollHeight)}px`;
    }
  }, [value]);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste your text here — it will be split across your images automatically"
        className="w-full min-h-[120px] px-4 py-3 border border-border rounded-md bg-surface text-primary text-base font-sans placeholder:text-muted resize-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-focus transition-all duration-150"
      />
      <span className="absolute bottom-3 right-4 text-xs text-muted">
        {value.length} characters
      </span>
    </div>
  );
}
