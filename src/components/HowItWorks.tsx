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
      <p className="text-center text-sm text-muted mt-10 pb-10">
        Built for creators who value clean design.
      </p>
    </section>
  );
}
