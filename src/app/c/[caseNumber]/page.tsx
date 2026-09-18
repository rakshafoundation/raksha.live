import { notFound } from 'next/navigation';
import { ShieldAlert, Building2, MessageSquare, FileText, HeartHandshake } from 'lucide-react';
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
    include: {
      photos: true,
      events: true,
      receivingOrganisation: { select: { name: true } },
      updates: { include: { organisation: { select: { name: true } } } },
      documents: { include: { organisation: { select: { name: true } } } },
    },
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
        {publicCase.receivingOrganisationName && (
          <p className="flex items-center gap-1.5 text-sm font-semibold text-info">
            <Building2 className="h-4 w-4" /> Being treated at {publicCase.receivingOrganisationName}
          </p>
        )}
      </header>

      {publicCase.photos.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5">
          {publicCase.photos.map((p, i) => (
            <CaseGraphicPhoto key={i} url={p.url} isGraphic={p.isGraphic} />
          ))}
        </div>
      )}

      {publicCase.fundraiser && (
        <section className="card">
          <h2 className="section-label mb-3 flex items-center gap-1.5">
            <HeartHandshake className="h-3.5 w-3.5" /> Help cover treatment costs
          </h2>
          <div className="mb-1.5 h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-success"
              style={{
                width: `${Math.min(100, Math.round((publicCase.fundraiser.raisedAmount / publicCase.fundraiser.goalAmount) * 100))}%`,
              }}
            />
          </div>
          <p className="mb-3 text-sm text-zinc-500">
            <span className="font-bold text-zinc-900">₹{publicCase.fundraiser.raisedAmount.toLocaleString('en-IN')}</span> raised
            of ₹{publicCase.fundraiser.goalAmount.toLocaleString('en-IN')} goal
          </p>
          <a href={publicCase.fundraiser.paymentLink} target="_blank" rel="noopener noreferrer" className="btn-primary">
            Donate — via {publicCase.receivingOrganisationName ?? 'organisation'}
          </a>
          <p className="mt-2 text-[11px] text-zinc-400">
            Payment goes directly to the organisation's own page — this platform never holds funds.
          </p>
        </section>
      )}

      <section className="card">
        <h2 className="section-label mb-5">Timeline</h2>
        <Timeline events={publicCase.timeline} />
      </section>

      {publicCase.updates.length > 0 && (
        <section className="card">
          <h2 className="section-label mb-3 flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" /> Updates
          </h2>
          <div className="flex flex-col gap-4">
            {publicCase.updates.map((u) => (
              <div key={u.id}>
                <p className="text-sm text-zinc-800">{u.message}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  {u.organisationName} · {new Date(u.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {publicCase.documents.length > 0 && (
        <section className="card">
          <h2 className="section-label mb-3 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Vet reports & documents
          </h2>
          <ul className="flex flex-col gap-2.5">
            {publicCase.documents.map((d) => (
              <li key={d.id}>
                <a
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-info underline underline-offset-2"
                >
                  {d.label}
                </a>
                <p className="text-xs text-zinc-400">{d.organisationName}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="flex items-start gap-2 text-xs text-zinc-400">
        <ShieldAlert className="h-4 w-4 shrink-0 translate-y-0.5" />
        Exact location and reporter identity are kept private. Assigned responders see full details.
      </p>

      <FollowShareButtons caseNumber={publicCase.caseNumber} />
    </main>
  );
}
