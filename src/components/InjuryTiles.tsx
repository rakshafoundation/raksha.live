'use client';

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
    <div className="grid grid-cols-3 gap-3">
      {(Object.keys(INJURY_LABELS) as InjuryType[]).map((type) => (
        <button
          key={type}
          type="button"
          aria-pressed={value === type}
          className="tap-tile"
          onClick={() => onChange(type)}
        >
          <span className="text-2xl">{INJURY_LABELS[type].emoji}</span>
          <span className="text-xs">{INJURY_LABELS[type].label}</span>
        </button>
      ))}
    </div>
  );
}
