import { notFound } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { db } from '@/lib/db';
import { toPublicCase } from '@/lib/public-projection';
import { StatusPill } from '@/components/StatusPill';
import { Timeline } from '@/components/Timeline';
import { FollowShareButtons } from './FollowShareButtons';
import { CaseGraphicPhoto } from './CaseGraphicPhoto';
import { SPECIES_LABELS, INJURY_LABELS } from '@/lib/labels';

export const dynamic = 'force-dynamic';

export default async function CasePage({ params }: { params: { caseNumber: string } }) {
  const found = await db.case.findUnique({
    where: { caseNumber: params.caseNumber },
    include: { photos: true, events: true },
  });

  if (!found) notFound();

  const publicCase = toPublicCase(found);

  return (
    <main className="flex flex-col gap-6 px-4 pb-28 pt-6">
      <header className="flex flex-col gap-2.5">
        <p className="text-sm font-semibold text-zinc-400">{publicCase.caseNumber}</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">{publicCase.animalName}</h1>
        <p className="text-zinc-500">
          {SPECIES_LABELS[publicCase.species].emoji} {SPECIES_LABELS[publicCase.species].label} ·{' '}
          {INJURY_LABELS[publicCase.injuryType].label} · {publicCase.area}
        </p>
        <div>
          <StatusPill status={publicCase.status} outcomeType={publicCase.outcomeType} />
        </div>
      </header>

      {publicCase.photos.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5">
          {publicCase.photos.map((p, i) => (
            <CaseGraphicPhoto key={i} url={p.url} isGraphic={p.isGraphic} />
          ))}
        </div>
      )}

      <section className="card">
        <h2 className="section-label mb-5">Timeline</h2>
        <Timeline events={publicCase.timeline} />
      </section>

      <p className="flex items-start gap-2 text-xs text-zinc-400">
        <ShieldAlert className="h-4 w-4 shrink-0 translate-y-0.5" />
        Exact location and reporter identity are kept private. Assigned responders see full details.
      </p>

      <FollowShareButtons caseNumber={publicCase.caseNumber} />
    </main>
  );
}
