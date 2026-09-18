'use client';

import { useState } from 'react';
import { LocationPicker } from '@/components/LocationPicker';

const CATEGORIES = [
  { value: 'NGO' as const, label: 'NGO / Shelter' },
  { value: 'VET' as const, label: 'Vet / Clinic' },
];

export function ProviderOnboardingForm({ onDone }: { onDone: () => void }) {
  const [category, setCategory] = useState<'NGO' | 'VET'>('NGO');
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [document, setDocument] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!location) {
      setError('Tap the map to set your location.');
      return;
    }
    if (!document) {
      setError('A registration/license document is required for verification.');
      return;
    }
    if (!name || !area || !phone) {
      setError('Name, area, and phone are required.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set('category', category);
      formData.set('name', name);
      formData.set('area', area);
      formData.set('phone', phone);
      formData.set('latitude', String(location.latitude));
      formData.set('longitude', String(location.longitude));
      formData.set('document', document);

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
              onClick={() => setCategory(c.value)}
              className={`flex-1 rounded-2xl border-2 px-3 py-3 text-sm font-bold transition ${
                category === c.value ? 'border-critical bg-red-50 text-critical' : 'border-zinc-200 text-zinc-500'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

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
