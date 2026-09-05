'use client';

import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import { Truck, MapPinned } from 'lucide-react';
import { INJURY_LABELS, SPECIES_LABELS } from '@/lib/labels';

interface QueueCase {
  caseNumber: string;
  animalName: string;
  species: keyof typeof SPECIES_LABELS;
  injuryType: keyof typeof INJURY_LABELS;
  area: string;
  urgency: 'CRITICAL' | 'URGENT' | 'NON_URGENT' | null;
  distanceMeters: number | null;
}

const URGENCY_STYLE: Record<string, string> = {
  CRITICAL: 'bg-red-50 text-critical',
  URGENT: 'bg-amber-50 text-urgent',
  NON_URGENT: 'bg-green-50 text-success',
};

export default function RescuerQueuePage() {
  const { data: session, status } = useSession();
  const [onDuty, setOnDuty] = useState(false);
  const [cases, setCases] = useState<QueueCase[]>([]);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== 'authenticated') return;
    navigator.geolocation.getCurrentPosition(
      (pos) => loadQueue(pos.coords.latitude, pos.coords.longitude),
      () => loadQueue(),
      { timeout: 8000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function loadQueue(lat?: number, lng?: number) {
    setLoading(true);
    const url = lat && lng ? `/api/rescuer/queue?lat=${lat}&lng=${lng}` : '/api/rescuer/queue';
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setCases(data.cases);
    }
    setLoading(false);
  }

  async function toggleDuty() {
    const next = !onDuty;
    setOnDuty(next);
    await fetch('/api/users/me/duty', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ onDuty: next }),
    });
  }

  async function accept(caseNumber: string) {
    setAccepting(caseNumber);
    const res = await fetch(`/api/cases/${caseNumber}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetStatus: 'ACCEPTED' }),
    });
    setAccepting(null);
    if (res.ok) {
      window.location.href = `/rescuer/${caseNumber}`;
    } else {
      const data = await res.json();
      alert(data.error ?? 'Could not accept case');
      loadQueue();
    }
  }

  if (status !== 'authenticated') {
    return (
      <main className="flex flex-col items-center gap-4 px-4 pb-16 pt-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-info">
          <Truck className="h-7 w-7" />
        </span>
        <p className="text-zinc-500">Sign in as a verified rescuer to see open cases.</p>
        <button className="btn-primary max-w-xs" onClick={() => signIn(undefined, { callbackUrl: '/rescuer' })}>
          Sign in
        </button>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-5 px-4 pb-16 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-zinc-900">Open cases near me</h1>
          <p className="text-sm text-zinc-500">Sorted by distance × severity</p>
        </div>
        <button
          onClick={toggleDuty}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition active:scale-95 ${
            onDuty ? 'bg-success text-white' : 'bg-zinc-100 text-zinc-500'
          }`}
        >
          {onDuty ? '🟢 On duty' : '⚪ Off duty'}
        </button>
      </div>

      {loading && <p className="text-sm text-zinc-400">Loading…</p>}
      {!loading && cases.length === 0 && (
        <div className="card flex flex-col items-center gap-2 py-12 text-center text-zinc-400">
          <MapPinned className="h-8 w-8" />
          No open cases right now.
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
              {SPECIES_LABELS[c.species]?.label} · {INJURY_LABELS[c.injuryType]?.label} · {c.area}
              {c.distanceMeters !== null && ` · ${(c.distanceMeters / 1000).toFixed(1)} km`}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <Link href={`/c/${c.caseNumber}`} className="text-sm font-semibold text-info">
                View
              </Link>
              <button
                className="ml-auto rounded-full bg-critical px-4 py-2 text-sm font-bold text-white transition active:scale-95"
                disabled={accepting === c.caseNumber}
                onClick={() => accept(c.caseNumber)}
              >
                {accepting === c.caseNumber ? 'Accepting…' : 'Accept'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
