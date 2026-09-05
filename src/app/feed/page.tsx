import Link from 'next/link';
import { CaseStatus } from '@prisma/client';
import { Rss, Inbox } from 'lucide-react';
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
    <main className="flex flex-col gap-5 px-4 pb-16 pt-6">
      <header className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-critical">
          <Rss className="h-4.5 w-4.5" />
        </span>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-zinc-900">Raksha Live</h1>
          <p className="text-sm text-zinc-500">Recovered cases stay visible for 72 hours</p>
        </div>
      </header>

      <div className="flex flex-col gap-3">
        {publicCases.length === 0 && (
          <div className="card flex flex-col items-center gap-2 py-12 text-center text-zinc-400">
            <Inbox className="h-8 w-8" />
            No cases yet.
          </div>
        )}
        {publicCases.map((c) => (
          <Link
            key={c.caseNumber}
            href={`/c/${c.caseNumber}`}
            className="card flex gap-3.5 transition active:scale-[0.98]"
          >
            {c.photos[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={c.photos[0].url}
                alt=""
                className={`h-[72px] w-[72px] shrink-0 rounded-2xl object-cover ${c.photos[0].isGraphic ? 'blur-md' : ''}`}
              />
            ) : (
              <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-2xl">
                {SPECIES_LABELS[c.species].emoji}
              </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate font-bold text-zinc-900">{c.animalName}</span>
                <span className="shrink-0 text-xs font-medium text-zinc-400">{c.caseNumber}</span>
              </div>
              <StatusPill status={c.status} outcomeType={c.outcomeType} />
              <span className="truncate text-sm text-zinc-500">
                {INJURY_LABELS[c.injuryType].label} · {c.area}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
