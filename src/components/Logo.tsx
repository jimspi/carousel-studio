'use client';

export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Carousel Studio logo"
    >
      {/* Back rectangle */}
      <rect x="14" y="8" width="40" height="48" rx="4" fill="#1C1917" opacity="0.25" />
      {/* Front rectangle */}
      <rect x="8" y="14" width="40" height="48" rx="4" fill="#1C1917" />
      {/* Text lines inside front rectangle */}
      <line x1="16" y1="30" x2="40" y2="30" stroke="#FAFAF9" strokeWidth="3" strokeLinecap="round" />
      <line x1="16" y1="39" x2="40" y2="39" stroke="#FAFAF9" strokeWidth="3" strokeLinecap="round" />
      <line x1="16" y1="48" x2="32" y2="48" stroke="#FAFAF9" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
