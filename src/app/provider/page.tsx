'use client';

import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import { Building2, Clock, Inbox, CheckCircle2 } from 'lucide-react';
import { ProviderOnboardingForm } from '@/components/ProviderOnboardingForm';
import { INJURY_LABELS, SPECIES_LABELS } from '@/lib/labels';

interface IntakeCase {
  caseNumber: string;
  animalName: string;
  species: keyof typeof SPECIES_LABELS;
  injuryType: keyof typeof INJURY_LABELS;
  area: string;
  urgency: 'CRITICAL' | 'URGENT' | 'NON_URGENT' | null;
  distanceMeters: number;
  acceptedByUs: boolean;
}

interface MyCase {
  caseNumber: string;
  animalName: string;
  status: string;
  outcomeType: string | null;
  isActive: boolean;
}

interface OrgStatus {
  hasOrg: boolean;
  organisation?: {
    name: string;
    type: string;
    verificationTier: string;
  };
}

const URGENCY_STYLE: Record<string, string> = {
  CRITICAL: 'bg-red-50 text-critical',
  URGENT: 'bg-amber-50 text-urgent',
  NON_URGENT: 'bg-green-50 text-success',
};

const STATUS_LABEL: Record<string, string> = {
  ACCEPTED: 'Accepted — en route',
  ASSIGNED: 'Rescuer assigned',
  PICKED_UP: 'Picked up',
  AT_VET: 'At your facility',
  TREATMENT: 'In treatment',
  RECOVERY: 'Recovering',
  OUTCOME: 'Outcome recorded',
  CLOSED: 'Closed',
};

export default function ProviderPage() {
  const { status: sessionStatus } = useSession();
  const [orgStatus, setOrgStatus] = useState<OrgStatus | null>(null);
  const [incoming, setIncoming] = useState<IntakeCase[]>([]);
  const [myCases, setMyCases] = useState<MyCase[]>([]);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const statusRes = await fetch('/api/provider/status');
    const statusData: OrgStatus = await statusRes.json();
    setOrgStatus(statusData);

    if (statusData.hasOrg && statusData.organisation?.verificationTier !== 'NONE') {
      const [intakeRes, casesRes] = await Promise.all([fetch('/api/intake/queue'), fetch('/api/provider/cases')]);
      if (intakeRes.ok) setIncoming((await intakeRes.json()).cases);
      if (casesRes.ok) setMyCases((await casesRes.json()).cases);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (sessionStatus === 'authenticated') load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus]);

  async function acceptToReceive(caseNumber: string) {
    setAccepting(caseNumber);
    const res = await fetch(`/api/cases/${caseNumber}/accept-receiving`, { method: 'POST' });
    setAccepting(null);
    if (res.ok) {
      load();
    } else {
      const data = await res.json();
      alert(data.error ?? 'Could not accept this case');
    }
  }

  if (sessionStatus !== 'authenticated') {
    return (
      <main className="flex flex-col items-center gap-4 px-4 pb-16 pt-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-info">
          <Building2 className="h-7 w-7" />
        </span>
        <h1 className="text-xl font-extrabold text-zinc-900">Service provider portal</h1>
        <p className="text-zinc-500">Sign in to register your NGO, vet, or clinic — or manage cases you're already treating.</p>
        <button className="btn-primary max-w-xs" onClick={() => signIn(undefined, { callbackUrl: '/provider' })}>
          Sign in
        </button>
      </main>
    );
  }

  if (loading || !orgStatus) {
    return <main className="px-4 pt-16 text-center text-zinc-400">Loading…</main>;
  }

  if (!orgStatus.hasOrg) {
    return (
      <main className="flex flex-col gap-5 px-4 pb-16 pt-6">
        <header className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-info">
            <Building2 className="h-4.5 w-4.5" />
          </span>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-zinc-900">Register your organisation</h1>
            <p className="text-sm text-zinc-500">NGOs, vets, and clinics can accept cases and update the public on progress</p>
          </div>
        </header>
        <ProviderOnboardingForm onDone={load} />
      </main>
    );
  }

  if (orgStatus.organisation!.verificationTier === 'NONE') {
    return (
      <main className="flex flex-col items-center gap-4 px-4 pb-16 pt-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-urgent">
          <Clock className="h-7 w-7" />
        </span>
        <h1 className="text-xl font-extrabold text-zinc-900">Verification pending</h1>
        <p className="max-w-xs text-zinc-500">
          {orgStatus.organisation!.name} is registered and awaiting admin review of your documents. You'll be able to
          accept cases once verified.
        </p>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-6 px-4 pb-16 pt-6">
      <header>
        <h1 className="text-xl font-extrabold tracking-tight text-zinc-900">{orgStatus.organisation!.name}</h1>
        <p className="text-sm text-zinc-500">Service provider dashboard</p>
      </header>

      <section>
        <h2 className="section-label mb-3">Incoming cases</h2>
        {incoming.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 py-8 text-center text-zinc-400">
            <Inbox className="h-6 w-6" /> No incoming cases right now.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {incoming.map((c) => (
              <div key={c.caseNumber} className="card">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-zinc-900">
                    {c.animalName} · <span className="font-medium text-zinc-400">{c.caseNumber}</span>
                  </span>
                  {c.urgency && (
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${URGENCY_STYLE[c.urgency]}`}>
                      {c.urgency}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-zinc-500">
                  {SPECIES_LABELS[c.species]?.label} · {INJURY_LABELS[c.injuryType]?.label} · {c.area} ·{' '}
                  {(c.distanceMeters / 1000).toFixed(1)} km
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <Link href={`/c/${c.caseNumber}`} className="text-sm font-semibold text-info">
                    View
                  </Link>
                  {c.acceptedByUs ? (
                    <span className="ml-auto flex items-center gap-1.5 text-sm font-bold text-success">
                      <CheckCircle2 className="h-4 w-4" /> You've accepted this
                    </span>
                  ) : (
                    <button
                      className="ml-auto rounded-full bg-critical px-4 py-2 text-sm font-bold text-white transition active:scale-95"
                      disabled={accepting === c.caseNumber}
                      onClick={() => acceptToReceive(c.caseNumber)}
                    >
                      {accepting === c.caseNumber ? 'Accepting…' : 'Accept to receive'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="section-label mb-3">My cases</h2>
        {myCases.length === 0 ? (
          <div className="card py-8 text-center text-sm text-zinc-400">No cases yet.</div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {myCases.map((c) => (
              <Link
                key={c.caseNumber}
                href={`/provider/${c.caseNumber}`}
                className="card flex items-center justify-between gap-3 transition active:scale-[0.99]"
              >
                <div>
                  <p className="font-semibold text-zinc-900">
                    {c.animalName} <span className="font-medium text-zinc-400">· {c.caseNumber}</span>
                  </p>
                  <p className="text-sm text-zinc-500">{STATUS_LABEL[c.status] ?? c.status}</p>
                </div>
                {!c.isActive && <span className="shrink-0 text-xs font-bold text-zinc-400">CLOSED</span>}
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
