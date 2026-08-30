import { CaseStatus } from '@prisma/client';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Public network stats (build brief §4 / §7 screen 6). Radical
 * transparency: the same numbers a donor or CSR team would ask for are
 * simply public, no login required.
 */
export default async function StatsPage() {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [casesThisMonth, closedWithProof, closedTotal, sterilisations, activeRescuers, byArea] =
    await Promise.all([
      db.case.count({ where: { createdAt: { gte: monthStart } } }),
      db.caseEvent.count({
        where: { toStatus: CaseStatus.CLOSED, photoUrl: { not: null }, createdAt: { gte: monthStart } },
      }),
      db.case.count({ where: { status: CaseStatus.CLOSED, closedAt: { gte: monthStart } } }),
      db.careRequest.count({ where: { type: 'STERILISATION', status: 'COMPLETED', createdAt: { gte: monthStart } } }),
      db.user.count({ where: { onDuty: true } }),
      db.case.groupBy({ by: ['area'], _count: { area: true }, orderBy: { _count: { area: 'desc' } }, take: 10 }),
    ]);

  const pctClosedWithProof = closedTotal > 0 ? Math.round((closedWithProof / closedTotal) * 100) : 0;

  return (
    <main className="flex flex-col gap-6 p-4 pb-16">
      <h1 className="text-xl font-bold">Network stats — this month</h1>

      <div className="grid grid-cols-2 gap-3">
        <Metric label="Cases reported" value={casesThisMonth} />
        <Metric label="% closed with photo proof" value={`${pctClosedWithProof}%`} />
        <Metric label="Sterilisations" value={sterilisations} />
        <Metric label="Active rescuers now" value={activeRescuers} />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">By area</h2>
        <div className="flex flex-col gap-2">
          {byArea.map((row) => (
            <div key={row.area} className="flex items-center justify-between border-b border-zinc-100 py-2">
              <span>{row.area}</span>
              <span className="font-semibold">{row._count.area}</span>
            </div>
          ))}
          {byArea.length === 0 && <p className="text-zinc-500">No data yet.</p>}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  );
}
