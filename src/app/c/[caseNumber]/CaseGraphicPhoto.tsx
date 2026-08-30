'use client';

import { useState } from 'react';

/** Graphic photos are blurred by default publicly, tap-to-view (build brief §3/§11). */
export function CaseGraphicPhoto({ url, isGraphic }: { url: string; isGraphic: boolean }) {
  const [revealed, setRevealed] = useState(!isGraphic);

  return (
    <button
      type="button"
      onClick={() => setRevealed(true)}
      className="relative overflow-hidden rounded-card border border-zinc-200"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="Case photo" className={revealed ? '' : 'blur-xl'} />
      {!revealed && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-sm font-semibold text-white">
          Tap to view (graphic)
        </span>
      )}
    </button>
  );
}
