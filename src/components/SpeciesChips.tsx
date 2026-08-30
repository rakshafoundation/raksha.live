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
      {(Object.keys(SPECIES_LABELS) as Species[]).map((s) => (
        <button
          key={s}
          type="button"
          aria-pressed={value === s}
          onClick={() => onChange(s)}
          className={`rounded-full border-2 px-4 py-2 text-sm font-medium ${
            value === s ? 'border-critical bg-red-50' : 'border-zinc-200 bg-white'
          }`}
        >
          {SPECIES_LABELS[s].emoji} {SPECIES_LABELS[s].label}
        </button>
      ))}
    </div>
  );
}
