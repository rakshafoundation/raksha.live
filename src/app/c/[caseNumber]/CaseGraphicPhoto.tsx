'use client';

import { useState } from 'react';
import { Eye } from 'lucide-react';

/** Graphic photos are blurred by default publicly, tap-to-view (build brief §3/§11). */
export function CaseGraphicPhoto({ url, isGraphic }: { url: string; isGraphic: boolean }) {
  const [revealed, setRevealed] = useState(!isGraphic);

  return (
    <button
      type="button"
      onClick={() => setRevealed(true)}
      className="relative aspect-square overflow-hidden rounded-card border border-zinc-200 shadow-soft"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="Case photo"
        className={`h-full w-full object-cover transition ${revealed ? '' : 'blur-xl scale-110'}`}
      />
      {!revealed && (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/40 text-sm font-semibold text-white">
          <Eye className="h-5 w-5" />
          Tap to view
        </span>
      )}
    </button>
  );
}
