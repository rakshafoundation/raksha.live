import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { CaseStatus, UserRoleName, VerificationStatus, ModerationFlagStatus } from '@prisma/client';
import { LayoutDashboard, PartyPopper } from 'lucide-react';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { VerificationDecisionButtons } from './VerificationDecisionButtons';

export const dynamic = 'force-dynamic';

const UNASSIGNED_STATUSES: CaseStatus[] = [CaseStatus.REPORTED, CaseStatus.TRIAGED];
// SLA per build brief §5 escalation ladder — flashing red past this.
const SLA_MINUTES = 5;

function minutesSince(date: Date): number {
  return Math.round((Date.now() - date.getTime()) / 60_000);
}

export default async function CommandCenterPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.roles.includes(UserRoleName.ADMIN)) {
    redirect('/login?callbackUrl=/command-center');
  }

  const [unassigned, active, pendingVerifications, mergeFlags] = await Promise.all([
    db.case.findMany({
      where: { status: { in: UNASSIGNED_STATUSES } },
      include: { aiAssessments: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { createdAt: 'asc' },
    }),
    db.case.count({
      where: { status: { in: [CaseStatus.ACCEPTED, CaseStatus.ASSIGNED, CaseStatus.PICKED_UP, CaseStatus.AT_VET, CaseStatus.TREATMENT, CaseStatus.RECOVERY] } },
    }),
    db.verification.findMany({
      where: { status: VerificationStatus.PENDING },
      include: { user: { select: { name: true } }, organisation: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    db.moderationFlag.findMany({
      where: { status: ModerationFlagStatus.OPEN },
      include: { case: { select: { caseNumber: true, animalName: true } } },
    }),
  ]);

  const slaAtRisk = unassigned.filter((c) => minutesSince(c.createdAt) >= SLA_MINUTES);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-4 pb-16 pt-6">
      <header className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-white">
          <LayoutDashboard className="h-4.5 w-4.5" />
        </span>
        <h1 className="text-xl font-extrabold tracking-tight text-zinc-900">Command Center</h1>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <Metric label="Unassigned" value={unassigned.length} danger={unassigned.length > 0} />
        <Metric label="SLA at risk" value={slaAtRisk.length} danger={slaAtRisk.length > 0} />
        <Metric label="Active" value={active} />
      </div>

      <section>
        <h2 className="section-label mb-3">Unassigned cases</h2>
        <div className="flex flex-col gap-2.5">
          {unassigned.length === 0 && (
            <p className="card flex items-center gap-2 text-sm text-zinc-500">
              <PartyPopper className="h-4 w-4 text-success" /> Nothing waiting.
            </p>
          )}
          {unassigned.map((c) => {
            const elapsed = minutesSince(c.createdAt);
            const atRisk = elapsed >= SLA_MINUTES;
            return (
              <div
                key={c.id}
                className={`card flex items-center justify-between ${atRisk ? 'animate-pulse border-critical bg-red-50' : ''}`}
              >
                <div>
                  <p className="font-bold text-zinc-900">
                    {c.animalName} · <span className="font-medium text-zinc-400">{c.caseNumber}</span>
                  </p>
                  <p className="text-sm text-zinc-500">
                    {c.aiAssessments[0]?.urgency ?? 'Pending triage'} · {elapsed} min since report
                  </p>
                </div>
                <a href={`/c/${c.caseNumber}`} className="shrink-0 text-sm font-bold text-info">
                  View →
                </a>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="section-label mb-3">Verification queue</h2>
        <div className="flex flex-col gap-2.5">
          {pendingVerifications.length === 0 && <p className="card text-sm text-zinc-500">No pending applications.</p>}
          {pendingVerifications.map((v) => (
            <div key={v.id} className="card flex items-center justify-between gap-2">
              <div>
                <p className="font-bold text-zinc-900">{v.user?.name ?? v.organisation?.name ?? 'Unknown applicant'}</p>
                <p className="text-sm text-zinc-500">Target tier: {v.targetTier}</p>
              </div>
              <VerificationDecisionButtons id={v.id} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-label mb-3">Merge suggestions / moderation</h2>
        <div className="flex flex-col gap-2.5">
          {mergeFlags.length === 0 && <p className="card text-sm text-zinc-500">Nothing flagged.</p>}
          {mergeFlags.map((f) => (
            <div key={f.id} className="card">
              <p className="font-bold text-zinc-900">
                {f.type} — {f.case.animalName} ({f.case.caseNumber})
              </p>
              {f.note && <p className="text-sm text-zinc-500">{f.note}</p>}
              <p className="mt-1 text-xs text-zinc-400">
                Merging is always a human decision — review both cases before merging.
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className={`card text-center ${danger ? 'border-critical/40 bg-red-50/50' : ''}`}>
      <div className={`text-2xl font-extrabold ${danger ? 'text-critical' : 'text-zinc-900'}`}>{value}</div>
      <div className="text-xs font-medium text-zinc-500">{label}</div>
    </div>
  );
}
