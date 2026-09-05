import { ChevronLeft } from 'lucide-react';

export function StepProgress({
  step,
  total,
  label,
  onBack,
}: {
  step: number;
  total: number;
  label: string;
  onBack?: () => void;
}) {
  return (
    <div className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white px-4 pt-3 pb-3">
      <div className="mb-2 flex items-center gap-3">
        {onBack ? (
          <button
            onClick={onBack}
            aria-label="Back"
            className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition active:scale-90"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        ) : (
          <span className="w-9" />
        )}
        <span className="text-sm font-semibold text-zinc-500">{label}</span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              i < step ? 'bg-critical' : 'bg-zinc-150 bg-zinc-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
