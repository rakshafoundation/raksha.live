import { CaseStatus } from '@prisma/client';
import { BarChart3, MapPin } from 'lucide-react';
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
      // "Closed with photo proof" means the case's history carries photo
      // evidence somewhere (PICKED_UP/AT_VET/a photographed outcome) — not
      // that the terminal CLOSED event itself has one. CLOSED never
      // carries a photo of its own (see case-state-machine.ts), so
      // checking CaseEvent.toStatus == CLOSED here would always be zero.
      db.case.count({
        where: {
          status: CaseStatus.CLOSED,
          closedAt: { gte: monthStart },
          events: { some: { photoUrl: { not: null } } },
        },
      }),
      db.case.count({ where: { status: CaseStatus.CLOSED, closedAt: { gte: monthStart } } }),
      db.careRequest.count({ where: { type: 'STERILISATION', status: 'COMPLETED', createdAt: { gte: monthStart } } }),
      db.user.count({ where: { onDuty: true } }),
      db.case.groupBy({ by: ['area'], _count: { area: true }, orderBy: { _count: { area: 'desc' } }, take: 10 }),
    ]);

  const pctClosedWithProof = closedTotal > 0 ? Math.round((closedWithProof / closedTotal) * 100) : 0;
  const maxAreaCount = Math.max(1, ...byArea.map((r) => r._count.area));

  return (
    <main className="flex flex-col gap-6 px-4 pb-16 pt-6">
      <header className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-info">
          <BarChart3 className="h-4.5 w-4.5" />
        </span>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-zinc-900">Network stats</h1>
          <p className="text-sm text-zinc-500">This month, no login required</p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Metric label="Cases reported" value={casesThisMonth} />
        <Metric label="% closed with photo proof" value={`${pctClosedWithProof}%`} />
        <Metric label="Sterilisations" value={sterilisations} />
        <Metric label="Active rescuers now" value={activeRescuers} />
      </div>

      <section className="card">
        <h2 className="section-label mb-4 flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" /> By area
        </h2>
        <div className="flex flex-col gap-3">
          {byArea.map((row) => (
            <div key={row.area} className="flex items-center gap-3">
              <span className="w-24 shrink-0 truncate text-sm font-medium text-zinc-600">{row.area}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-info"
                  style={{ width: `${(row._count.area / maxAreaCount) * 100}%` }}
                />
              </div>
              <span className="w-6 shrink-0 text-right text-sm font-bold text-zinc-900">{row._count.area}</span>
            </div>
          ))}
          {byArea.length === 0 && <p className="text-sm text-zinc-400">No data yet.</p>}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card text-center">
      <div className="text-2xl font-extrabold text-zinc-900">{value}</div>
      <div className="text-xs font-medium text-zinc-500">{label}</div>
    </div>
  );
}
