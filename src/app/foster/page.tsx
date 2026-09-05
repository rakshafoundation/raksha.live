'use client';

import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import { Home as HomeIcon, HeartHandshake, CheckCircle2 } from 'lucide-react';
import { SPECIES_LABELS } from '@/lib/labels';

interface FosterCase {
  caseNumber: string;
  animalName: string;
  species: keyof typeof SPECIES_LABELS;
  area: string;
  photoUrl: string | null;
  alreadyApplied: boolean;
}

export default function FosterFeedPage() {
  const { data: session, status } = useSession();
  const [cases, setCases] = useState<FosterCase[]>([]);
  const [applying, setApplying] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/foster/queue');
    if (res.ok) {
      const data = await res.json();
      setCases(data.cases);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (status === 'authenticated') load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function apply(caseNumber: string) {
    setApplying(caseNumber);
    const res = await fetch(`/api/cases/${caseNumber}/foster-apply`, { method: 'POST' });
    setApplying(null);
    if (res.ok) {
      load();
    } else {
      const data = await res.json();
      alert(data.error ?? 'Could not apply');
    }
  }

  if (status !== 'authenticated') {
    return (
      <main className="flex flex-col items-center gap-4 px-4 pb-16 pt-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-info">
          <HomeIcon className="h-7 w-7" />
        </span>
        <p className="text-zinc-500">Sign in as a registered foster to see animals needing a home.</p>
        <button className="btn-primary max-w-xs" onClick={() => signIn(undefined, { callbackUrl: '/foster' })}>
          Sign in
        </button>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-5 px-4 pb-16 pt-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-zinc-900">Needs a foster</h1>
        <p className="text-sm text-zinc-500">Animals in recovery, ready for a temporary home</p>
      </div>

      {loading && <p className="text-sm text-zinc-400">Loading…</p>}
      {!loading && cases.length === 0 && (
        <div className="card flex flex-col items-center gap-2 py-12 text-center text-zinc-400">
          <HeartHandshake className="h-8 w-8" />
          No animals need fostering right now.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {cases.map((c) => (
          <div key={c.caseNumber} className="card flex flex-col gap-2">
            {c.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.photoUrl} alt="" className="h-28 w-full rounded-2xl object-cover" />
            ) : (
              <div className="flex h-28 w-full items-center justify-center rounded-2xl bg-zinc-100 text-3xl">
                {SPECIES_LABELS[c.species]?.emoji}
              </div>
            )}
            <p className="font-bold text-zinc-900">{c.animalName}</p>
            <p className="text-xs text-zinc-500">
              {SPECIES_LABELS[c.species]?.label} · {c.area}
            </p>
            <Link href={`/c/${c.caseNumber}`} className="text-xs font-semibold text-info">
              View case
            </Link>
            {c.alreadyApplied ? (
              <span className="flex items-center gap-1.5 text-sm font-bold text-success">
                <CheckCircle2 className="h-4 w-4" /> Applied
              </span>
            ) : (
              <button
                className="rounded-full bg-critical px-3 py-2 text-sm font-bold text-white transition active:scale-95"
                disabled={applying === c.caseNumber}
                onClick={() => apply(c.caseNumber)}
              >
                {applying === c.caseNumber ? 'Applying…' : 'Apply'}
              </button>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
