'use client';

import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import { Building2, Inbox, CheckCircle2 } from 'lucide-react';
import { INJURY_LABELS, SPECIES_LABELS } from '@/lib/labels';

interface IntakeCase {
  caseNumber: string;
  animalName: string;
  species: keyof typeof SPECIES_LABELS;
  injuryType: keyof typeof INJURY_LABELS;
  area: string;
  status: string;
  urgency: 'CRITICAL' | 'URGENT' | 'NON_URGENT' | null;
  distanceMeters: number;
  acceptedByUs: boolean;
}

const URGENCY_STYLE: Record<string, string> = {
  CRITICAL: 'bg-red-50 text-critical',
  URGENT: 'bg-amber-50 text-urgent',
  NON_URGENT: 'bg-green-50 text-success',
};

export default function IntakeQueuePage() {
  const { data: session, status } = useSession();
  const [cases, setCases] = useState<IntakeCase[]>([]);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/intake/queue');
    if (res.ok) {
      const data = await res.json();
      setCases(data.cases);
      setOrgName(data.organisation?.name ?? null);
      setError(null);
    } else {
      const data = await res.json();
      setError(data.error ?? 'Could not load incoming cases');
    }
    setLoading(false);
  }

  useEffect(() => {
    if (status === 'authenticated') load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

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

  if (status !== 'authenticated') {
    return (
      <main className="flex flex-col items-center gap-4 px-4 pb-16 pt-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-info">
          <Building2 className="h-7 w-7" />
        </span>
        <p className="text-zinc-500">Sign in as verified NGO/vet staff to see incoming cases.</p>
        <button className="btn-primary max-w-xs" onClick={() => signIn(undefined, { callbackUrl: '/intake' })}>
          Sign in
        </button>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-5 px-4 pb-16 pt-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-zinc-900">Incoming cases</h1>
        <p className="text-sm text-zinc-500">{orgName ? `For ${orgName}` : 'Sorted by distance from your org'}</p>
      </div>

      {error && (
        <div className="card border-critical/30 bg-red-50 text-sm text-critical">{error}</div>
      )}
      {loading && <p className="text-sm text-zinc-400">Loading…</p>}
      {!loading && !error && cases.length === 0 && (
        <div className="card flex flex-col items-center gap-2 py-12 text-center text-zinc-400">
          <Inbox className="h-8 w-8" />
          No incoming cases right now.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {cases.map((c) => (
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
    </main>
  );
}
