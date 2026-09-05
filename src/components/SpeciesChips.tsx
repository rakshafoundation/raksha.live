'use client';

import { Species } from '@prisma/client';
import { SPECIES_LABELS } from '@/lib/labels';

export function SpeciesChips({
  value,
  onChange,
}: {
  value: Species | null;
  onChange: (v: Species) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(SPECIES_LABELS) as Species[]).map((s) => {
        const selected = value === s;
        return (
          <button
            key={s}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(s)}
            className={`rounded-full border-2 px-4 py-2.5 text-sm font-semibold transition-all duration-150 active:scale-95 ${
              selected
                ? 'border-critical bg-red-50 text-critical shadow-soft'
                : 'border-zinc-200 bg-white text-zinc-600'
            }`}
          >
            <span className="mr-1.5">{SPECIES_LABELS[s].emoji}</span>
            {SPECIES_LABELS[s].label}
          </button>
        );
      })}
    </div>
  );
}
