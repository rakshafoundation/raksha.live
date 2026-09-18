'use client';

import { useEffect, useState } from 'react';
import { Search, CheckCircle2, X } from 'lucide-react';
import { LocationPicker } from '@/components/LocationPicker';

const CATEGORIES = [
  { value: 'NGO' as const, label: 'NGO / Shelter' },
  { value: 'VET' as const, label: 'Vet / Clinic' },
];

interface ClaimableListing {
  id: string;
  name: string;
  area: string;
  phone: string;
}

export function ProviderOnboardingForm({ onDone }: { onDone: () => void }) {
  const [category, setCategory] = useState<'NGO' | 'VET'>('NGO');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ClaimableListing[]>([]);
  const [searching, setSearching] = useState(false);
  const [claimed, setClaimed] = useState<ClaimableListing | null>(null);
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [document, setDocument] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (claimed || query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/provider/claimable-listings?category=${category}&q=${encodeURIComponent(query)}`);
        if (res.ok) setResults((await res.json()).listings);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, category, claimed]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!document) {
      setError('A registration/license document is required for verification.');
      return;
    }
    if (!claimed) {
      if (!location) {
        setError('Tap the map to set your location.');
        return;
      }
      if (!name || !area || !phone) {
        setError('Name, area, and phone are required.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set('category', category);
      formData.set('document', document);
      if (claimed) {
        formData.set('claimListingId', claimed.id);
      } else {
        formData.set('name', name);
        formData.set('area', area);
        formData.set('phone', phone);
        formData.set('latitude', String(location!.latitude));
        formData.set('longitude', String(location!.longitude));
      }

      const res = await fetch('/api/provider/onboarding', { method: 'POST', body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error?.formErrors?.join(', ') || body.error || `Failed (${res.status})`);
      }
      onDone();
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-3.5">
      <div>
        <label className="text-xs font-semibold text-zinc-500">Category</label>
        <div className="mt-1.5 flex gap-2">
          {CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.value}
              onClick={() => {
                setCategory(c.value);
                setClaimed(null);
                setQuery('');
              }}
              className={`flex-1 rounded-2xl border-2 px-3 py-3 text-sm font-bold transition ${
                category === c.value ? 'border-critical bg-red-50 text-critical' : 'border-zinc-200 text-zinc-500'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {claimed ? (
        <div className="rounded-2xl border-2 border-success/40 bg-green-50 p-3.5">
          <p className="flex items-center gap-1.5 text-sm font-bold text-success">
            <CheckCircle2 className="h-4 w-4" /> Claiming this listing
          </p>
          <p className="mt-1 font-semibold text-zinc-900">{claimed.name}</p>
          <p className="text-sm text-zinc-500">
            {claimed.area} · {claimed.phone}
          </p>
          <button
            type="button"
            onClick={() => setClaimed(null)}
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 underline"
          >
            <X className="h-3 w-3" /> Not this one
          </button>
        </div>
      ) : (
        <div>
          <label className="text-xs font-semibold text-zinc-500">
            Search for your existing listing (skip if you're not already in the directory)
          </label>
          <div className="relative mt-1.5">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              className="input-field pl-10"
              placeholder="Search by name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {searching && <p className="mt-1.5 text-xs text-zinc-400">Searching…</p>}
          {results.length > 0 && (
            <div className="mt-2 flex flex-col gap-1.5">
              {results.map((r) => (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => {
                    setClaimed(r);
                    setQuery('');
                    setResults([]);
                  }}
                  className="rounded-2xl border border-zinc-200 p-3 text-left transition active:scale-[0.98]"
                >
                  <p className="font-semibold text-zinc-900">{r.name}</p>
                  <p className="text-xs text-zinc-500">
                    {r.area} · {r.phone}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!claimed && (
        <>
          <div>
            <label className="text-xs font-semibold text-zinc-500">Organisation name</label>
            <input className="input-field mt-1.5" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bandra Animal Hospital" />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-500">Area</label>
            <input className="input-field mt-1.5" value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Bandra West" />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-500">Phone</label>
            <input className="input-field mt-1.5" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 90000 00000" />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-500">Location</label>
            <div className="mt-1.5">
              <LocationPicker value={location} onChange={setLocation} />
            </div>
          </div>
        </>
      )}

      <div>
        <label className="text-xs font-semibold text-zinc-500">Registration / license document</label>
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setDocument(e.target.files?.[0] ?? null)}
          className="mt-1.5 block w-full text-sm text-zinc-500"
        />
        <p className="mt-1 text-xs text-zinc-400">An admin reviews this before your account is verified.</p>
      </div>

      {error && <p className="text-sm font-semibold text-critical">{error}</p>}

      <button type="submit" disabled={submitting} className="btn-primary">
        {submitting ? 'Submitting…' : 'Submit for verification'}
      </button>
    </form>
  );
}
