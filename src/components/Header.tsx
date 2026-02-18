'use client';

import Logo from './Logo';

export default function Header() {
  const scrollToHowItWorks = () => {
    const el = document.getElementById('how-it-works');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-border">
      <div className="max-w-[960px] mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Logo size={28} />
          <span className="font-serif text-xl text-primary font-semibold">
            Carousel Studio
          </span>
        </div>
        <button
          onClick={scrollToHowItWorks}
          className="text-sm text-secondary hover:text-primary transition-colors duration-150"
        >
          How it works
        </button>
      </div>
    </header>
  );
}
