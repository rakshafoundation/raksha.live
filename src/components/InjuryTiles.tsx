'use client';

import { Check } from 'lucide-react';
import { InjuryType } from '@prisma/client';
import { INJURY_LABELS } from '@/lib/labels';

export function InjuryTiles({
  value,
  onChange,
}: {
  value: InjuryType | null;
  onChange: (v: InjuryType) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {(Object.keys(INJURY_LABELS) as InjuryType[]).map((type) => {
        const selected = value === type;
        return (
          <button
            key={type}
            type="button"
            aria-pressed={selected}
            className="tap-tile relative"
            onClick={() => onChange(type)}
          >
            {selected && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-critical text-white">
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
              </span>
            )}
            <span className="text-2xl">{INJURY_LABELS[type].emoji}</span>
            <span className="text-xs leading-tight">{INJURY_LABELS[type].label}</span>
          </button>
        );
      })}
    </div>
  );
}
