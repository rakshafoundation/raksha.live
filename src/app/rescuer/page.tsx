'use client';

import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
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

const URGENCY_COLOR: Record<string, string> = {
  CRITICAL: 'text-critical',
  URGENT: 'text-urgent',
  NON_URGENT: 'text-success',
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
      <main className="flex flex-col gap-4 p-4 pt-12">
        <p>Sign in as a verified rescuer to see open cases.</p>
        <button className="btn-primary" onClick={() => signIn(undefined, { callbackUrl: '/rescuer' })}>
          Sign in
        </button>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-4 p-4 pb-16">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Open cases near me</h1>
        <button
          onClick={toggleDuty}
          className={`rounded-full px-4 py-2 text-sm font-bold ${onDuty ? 'bg-success text-white' : 'bg-zinc-200 text-zinc-600'}`}
        >
          {onDuty ? '🟢 On duty' : '⚪ Off duty'}
        </button>
      </div>

      {loading && <p className="text-zinc-500">Loading…</p>}
      {!loading && cases.length === 0 && <p className="text-zinc-500">No open cases right now.</p>}

      <div className="flex flex-col gap-3">
        {cases.map((c) => (
          <div key={c.caseNumber} className="card">
            <div className="flex items-center justify-between">
              <span className="font-semibold">
                {c.animalName} · {c.caseNumber}
              </span>
              {c.urgency && <span className={`text-xs font-bold ${URGENCY_COLOR[c.urgency]}`}>{c.urgency}</span>}
            </div>
            <p className="text-sm text-zinc-500">
              {SPECIES_LABELS[c.species]?.label} · {INJURY_LABELS[c.injuryType]?.label} · {c.area}
              {c.distanceMeters !== null && ` · ${(c.distanceMeters / 1000).toFixed(1)} km`}
            </p>
            <div className="mt-2 flex gap-2">
              <Link href={`/c/${c.caseNumber}`} className="text-sm text-info underline">
                View
              </Link>
              <button
                className="ml-auto rounded-full bg-critical px-4 py-1 text-sm font-bold text-white"
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
