'use client';

const steps = [
  {
    number: '1',
    title: 'Upload your images',
    description: 'Drag and drop up to 10 images, or click to browse your files.',
  },
  {
    number: '2',
    title: 'Paste your text',
    description:
      'Add your narrative and the app splits it evenly across each slide.',
  },
  {
    number: '3',
    title: 'Download your carousel',
    description: 'Get individual slides or a zip file, ready to post.',
  },
];

const tips = [
  'Lead with a hook on slide 1 — ask a question or make a bold claim',
  'Keep slides to 15-25 words each for maximum readability',
  'End with a clear call to action on the final slide',
  'Use high-contrast images that look good at small sizes',
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="mt-20 pt-12 border-t border-border">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        {steps.map((step) => (
          <div key={step.number} className="text-center">
            <span className="inline-block w-8 h-8 rounded-full bg-primary text-white text-sm font-medium leading-8 mb-3">
              {step.number}
            </span>
            <h3 className="text-base font-medium text-primary mb-1">
              {step.title}
            </h3>
            <p className="text-sm text-secondary leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-12 max-w-lg mx-auto">
        <h3 className="text-base font-serif font-semibold text-primary mb-4 text-center">
          Tips for viral carousels
        </h3>
        <ul className="space-y-2.5">
          {tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-secondary leading-relaxed">
              <span className="text-muted mt-0.5 flex-shrink-0">&#8226;</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-center text-sm text-muted mt-10">
        Built for creators who value clean design.
      </p>

      <div className="mt-8 pb-10 border-t border-border pt-6">
        <p className="text-xs text-muted leading-relaxed text-center max-w-lg mx-auto">
          Disclaimer: Carousel Studio is not responsible for wrong, inaccurate, or
          misleading information in generated outputs. The suggested text
          redistribution is algorithmic and may alter the meaning or context of your
          original content. Always review and double-check all slides before publicly
          posting.
        </p>
      </div>
    </section>
  );
}
