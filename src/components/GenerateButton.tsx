'use client';

interface GenerateButtonProps {
  disabled: boolean;
  processing: boolean;
  progress: { current: number; total: number } | null;
  onClick: () => void;
}

export default function GenerateButton({
  disabled,
  processing,
  progress,
  onClick,
}: GenerateButtonProps) {
  return (
    <div className="relative">
      <button
        onClick={onClick}
        disabled={disabled || processing}
        className={`w-full py-3 rounded-md text-base font-medium transition-all duration-150 ${
          disabled || processing
            ? 'bg-border text-muted cursor-not-allowed'
            : 'bg-primary text-white hover:bg-accent-hover cursor-pointer'
        }`}
      >
        {processing
          ? `Processing slide ${progress?.current ?? 0} of ${progress?.total ?? 0}...`
          : 'Create Carousel'}
      </button>
      {processing && progress && (
        <div className="mt-2 w-full h-1 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{
              width: `${(progress.current / progress.total) * 100}%`,
            }}
          />
        </div>
      )}
    </div>
  );
}
