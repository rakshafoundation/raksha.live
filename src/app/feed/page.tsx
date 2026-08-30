import Link from 'next/link';
import { CaseStatus } from '@prisma/client';
import { db } from '@/lib/db';
import { toPublicCase } from '@/lib/public-projection';
import { StatusPill } from '@/components/StatusPill';
import { SPECIES_LABELS, INJURY_LABELS } from '@/lib/labels';

export const dynamic = 'force-dynamic';

// Recovered cases stay visible for 72h (build brief §4) — proof the
// system works.
const RECOVERED_WINDOW_MS = 72 * 60 * 60 * 1000;

export default async function FeedPage() {
  const cases = await db.case.findMany({
    where: {
      OR: [
        { status: { not: CaseStatus.CLOSED } },
        { status: CaseStatus.CLOSED, closedAt: { gte: new Date(Date.now() - RECOVERED_WINDOW_MS) } },
      ],
    },
    include: { photos: true, events: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const publicCases = cases.map(toPublicCase);

  return (
    <main className="flex flex-col gap-4 p-4 pb-16">
      <h1 className="text-xl font-bold">Raksha Live — Feed</h1>
      <p className="text-sm text-zinc-500">
        Recovered cases stay here for 72 hours. <Link href="/stats" className="text-info underline">View network stats →</Link>
      </p>

      <div className="flex flex-col gap-3">
        {publicCases.length === 0 && <p className="text-zinc-500">No cases yet.</p>}
        {publicCases.map((c) => (
          <Link key={c.caseNumber} href={`/c/${c.caseNumber}`} className="card flex gap-3">
            {c.photos[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={c.photos[0].url}
                alt=""
                className={`h-20 w-20 rounded-card object-cover ${c.photos[0].isGraphic ? 'blur-md' : ''}`}
              />
            )}
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold">
                  {c.animalName} · {c.caseNumber}
                </span>
                <StatusPill status={c.status} outcomeType={c.outcomeType} />
              </div>
              <span className="text-sm text-zinc-500">
                {SPECIES_LABELS[c.species].emoji} {INJURY_LABELS[c.injuryType].label} · {c.area}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
