import Link from 'next/link';
import { CaseStatus } from '@prisma/client';
import { HeartHandshake, Home as HomeIcon, IndianRupee, Truck, Siren, ShieldCheck, Zap, Eye, ClipboardCheck, Users } from 'lucide-react';
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
    return null;
  }
}

const PRINCIPLES = [
  { icon: ShieldCheck, label: 'Verified' },
  { icon: Zap, label: 'Responsive' },
  { icon: Eye, label: 'Transparent' },
  { icon: ClipboardCheck, label: 'Accountable' },
  { icon: Users, label: 'Collaborative' },
];

export default async function HomePage() {
  const stats = await getLiveStats();

  return (
    <main className="flex flex-col gap-10 px-4 pb-20 pt-8">
      <section className="flex flex-col items-center gap-5 text-center">
        <h1 className="max-w-sm text-3xl font-extrabold leading-tight tracking-tight text-zinc-900">
          One animal. One case.
          <br />
          One coordinated response.
        </h1>
        <Link
          href="/report"
          className="btn-primary max-w-sm animate-[pop-in_0.4s_ease-out] gap-2.5 text-xl"
        >
          <Siren className="h-6 w-6" />
          Report an animal emergency
        </Link>
      </section>

      <section className="card">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="section-label">Raksha Live</h2>
          <span className="text-sm font-semibold text-zinc-500">
            {stats ? `${stats.total} active in Mumbai` : 'connecting…'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <StatTile color="text-critical bg-red-50" dot="bg-critical" label="Emergency" value={stats?.emergency} />
          <StatTile color="text-urgent bg-amber-50" dot="bg-urgent" label="In rescue/treatment" value={stats?.inRescueOrTreatment} />
          <StatTile color="text-info bg-blue-50" dot="bg-info" label="Foster needed" value={stats?.fosterNeeded} />
          <StatTile color="text-success bg-green-50" dot="bg-success" label="Closed today" value={stats?.closedToday} />
        </div>
        <Link href="/feed" className="mt-4 block text-center text-sm font-bold text-info">
          View live feed →
        </Link>
      </section>

      <section>
        <h2 className="section-label mb-3">I want to help</h2>
        <div className="grid grid-cols-2 gap-3">
          <HelpTile href="/feed?help=funding" icon={IndianRupee} label="Donate" />
          <HelpTile href="/foster" icon={HomeIcon} label="Foster" />
          <HelpTile href="/rescuer" icon={Truck} label="Volunteer / Transport" />
          <HelpTile href="/directory" icon={HeartHandshake} label="Join as NGO/Vet" />
        </div>
      </section>

      <section>
        <h2 className="section-label mb-3">Find help</h2>
        <Link href="/directory" className="card block font-semibold text-info">
          Ambulances · Vets · NGOs · Shelters — network directory →
        </Link>
      </section>

      <footer className="mt-2 grid grid-cols-5 gap-1 border-t border-zinc-200 pt-6">
        {PRINCIPLES.map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-1.5 text-center">
            <Icon className="h-4 w-4 text-zinc-400" />
            <span className="text-[11px] font-medium text-zinc-400">{label}</span>
          </div>
        ))}
      </footer>
    </main>
  );
}

function StatTile({
  color,
  dot,
  label,
  value,
}: {
  color: string;
  dot: string;
  label: string;
  value?: number;
}) {
  return (
    <div className={`rounded-2xl p-3.5 text-center ${color}`}>
      <span className={`mx-auto mb-1.5 block h-2 w-2 rounded-full ${dot}`} />
      <div className="text-xl font-extrabold text-zinc-900">{value ?? '—'}</div>
      <div className="text-[11px] font-medium leading-tight text-zinc-500">{label}</div>
    </div>
  );
}

function HelpTile({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Link href={href} className="card flex flex-col items-center gap-2.5 py-6 text-sm font-semibold text-zinc-700 transition active:scale-95">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">
        <Icon className="h-5 w-5" />
      </span>
      {label}
    </Link>
  );
}
