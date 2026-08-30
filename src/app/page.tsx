import Link from 'next/link';
import { CaseStatus } from '@prisma/client';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function getLiveStats() {
  try {
    const [emergency, inRescueOrTreatment, fosterNeeded, closedToday] = await Promise.all([
      db.case.count({ where: { status: { in: [CaseStatus.REPORTED, CaseStatus.TRIAGED] } } }),
      db.case.count({
        where: {
          status: {
            in: [
              CaseStatus.ACCEPTED,
              CaseStatus.ASSIGNED,
              CaseStatus.PICKED_UP,
              CaseStatus.AT_VET,
              CaseStatus.TREATMENT,
            ],
          },
        },
      }),
      db.case.count({ where: { status: CaseStatus.RECOVERY } }),
      db.case.count({
        where: { status: CaseStatus.CLOSED, closedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
    ]);
    return { emergency, inRescueOrTreatment, fosterNeeded, closedToday, total: emergency + inRescueOrTreatment + fosterNeeded };
  } catch {
    // DB not reachable (e.g. local dev without Postgres configured yet).
    return null;
  }
}

export default async function HomePage() {
  const stats = await getLiveStats();

  return (
    <main className="flex flex-col gap-8 p-4 pb-16">
      <header className="pt-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Raksha Network</p>
      </header>

      <Link href="/report" className="btn-primary block text-xl">
        🚨 Report an animal emergency
      </Link>

      <section className="card">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Raksha Live — {stats ? `${stats.total} active cases in Mumbai` : 'connecting…'}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile color="critical" emoji="🔴" label="Emergency" value={stats?.emergency} />
          <StatTile color="urgent" emoji="🟠" label="In rescue/treatment" value={stats?.inRescueOrTreatment} />
          <StatTile color="info" emoji="🏠" label="Foster needed" value={stats?.fosterNeeded} />
          <StatTile color="success" emoji="✅" label="Closed today" value={stats?.closedToday} />
        </div>
        <Link href="/feed" className="mt-4 block text-center text-sm font-semibold text-info">
          View live feed →
        </Link>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">I want to help</h2>
        <div className="grid grid-cols-2 gap-3">
          <HelpTile href="/feed?help=funding" emoji="💰" label="Donate" />
          <HelpTile href="/foster" emoji="🏡" label="Foster" />
          <HelpTile href="/rescuer" emoji="🚑" label="Volunteer / Transport" />
          <HelpTile href="/directory" emoji="🤝" label="Join as NGO/Vet" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Find help</h2>
        <Link href="/directory" className="card block font-medium text-info">
          Ambulances · Vets · NGOs · Shelters — network directory →
        </Link>
      </section>

      <footer className="mt-4 grid grid-cols-1 gap-2 border-t border-zinc-200 pt-6 text-center text-xs text-zinc-500 sm:grid-cols-5">
        <span>Verified</span>
        <span>Responsive</span>
        <span>Transparent</span>
        <span>Accountable</span>
        <span>Collaborative</span>
      </footer>
    </main>
  );
}

function StatTile({
  color,
  emoji,
  label,
  value,
}: {
  color: string;
  emoji: string;
  label: string;
  value?: number;
}) {
  return (
    <div className="rounded-card border border-zinc-200 p-3 text-center">
      <div className="text-2xl">{emoji}</div>
      <div className="text-xl font-bold">{value ?? '—'}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  );
}

function HelpTile({ href, emoji, label }: { href: string; emoji: string; label: string }) {
  return (
    <Link href={href} className="tap-tile">
      <span className="text-2xl">{emoji}</span>
      <span>{label}</span>
    </Link>
  );
}
