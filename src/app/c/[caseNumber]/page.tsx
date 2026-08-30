import { notFound } from 'next/navigation';
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
    <main className="flex flex-col gap-6 p-4 pb-16">
      <header>
        <p className="text-sm text-zinc-500">
          {publicCase.caseNumber} · {SPECIES_LABELS[publicCase.species].label} · {publicCase.area}
        </p>
        <h1 className="text-2xl font-bold">{publicCase.animalName}</h1>
        <p className="text-sm text-zinc-500">{INJURY_LABELS[publicCase.injuryType].label}</p>
        <div className="mt-2">
          <StatusPill status={publicCase.status} outcomeType={publicCase.outcomeType} />
        </div>
      </header>

      {publicCase.photos.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {publicCase.photos.map((p, i) => (
            <CaseGraphicPhoto key={i} url={p.url} isGraphic={p.isGraphic} />
          ))}
        </div>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">Timeline</h2>
        <Timeline events={publicCase.timeline} />
      </section>

      <FollowShareButtons caseNumber={publicCase.caseNumber} />

      <p className="text-center text-xs text-zinc-400">
        Exact location and reporter identity are kept private. Assigned responders see full
        details.
      </p>
    </main>
  );
}
