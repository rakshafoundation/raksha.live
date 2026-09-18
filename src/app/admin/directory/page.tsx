'use client';

import { useEffect, useState } from 'react';
import { DirectoryCategory } from '@prisma/client';
import { CheckCircle2, ListPlus } from 'lucide-react';
import { CATEGORY_LABELS } from '@/lib/directory-categories';
import { LocationPicker } from '@/components/LocationPicker';

const SECRET_STORAGE_KEY = 'raksha-admin-directory-secret';

const EMPTY_FORM = {
  name: '',
  category: 'VET' as DirectoryCategory,
  area: '',
  phone: '',
  hours: '',
  isOpen24x7: false,
};

export default function AdminDirectoryPage() {
  const [secret, setSecret] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(SECRET_STORAGE_KEY);
    if (saved) setSecret(saved);
  }, []);

  function updateSecret(value: string) {
    setSecret(value);
    localStorage.setItem(SECRET_STORAGE_KEY, value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!secret) {
      setError('Enter the admin secret first.');
      return;
    }
    if (!location) {
      setError('Tap the map to set a location.');
      return;
    }
    if (!form.name || !form.area || !form.phone) {
      setError('Name, area, and phone are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/directory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({
          ...form,
          hours: form.hours || null,
          latitude: location.latitude,
          longitude: location.longitude,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error?.formErrors?.join(', ') || body.error || `Failed (${res.status})`);
      }
      setAdded((prev) => [`${form.name} — ${CATEGORY_LABELS[form.category]}`, ...prev]);
      // Keep the secret and category (batches of the same type are common)
      // but clear everything else so the form is ready for the next entry.
      setForm((f) => ({ ...EMPTY_FORM, category: f.category }));
      setLocation(null);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex flex-col gap-5 px-4 pb-16 pt-6">
      <header className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-info">
          <ListPlus className="h-4.5 w-4.5" />
        </span>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-zinc-900">Add a directory listing</h1>
          <p className="text-sm text-zinc-500">NGOs, vets, pharmacies, shops — shows up on /directory immediately</p>
        </div>
      </header>

      <div className="card">
        <label className="text-xs font-semibold text-zinc-500">Admin secret</label>
        <input
          type="password"
          className="input-field mt-1.5"
          placeholder="Paste ADMIN_DIRECTORY_SECRET"
          value={secret}
          onChange={(e) => updateSecret(e.target.value)}
        />
      </div>

      <form onSubmit={handleSubmit} className="card flex flex-col gap-3.5">
        <div>
          <label className="text-xs font-semibold text-zinc-500">Name</label>
          <input
            className="input-field mt-1.5"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Bandra Animal Hospital"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-500">Category</label>
          <select
            className="input-field mt-1.5"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as DirectoryCategory }))}
          >
            {(Object.keys(CATEGORY_LABELS) as DirectoryCategory[]).map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-500">Area</label>
          <input
            className="input-field mt-1.5"
            value={form.area}
            onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
            placeholder="e.g. Bandra West"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-500">Phone</label>
          <input
            className="input-field mt-1.5"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="+91 90000 00000"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-500">Hours (optional)</label>
          <input
            className="input-field mt-1.5"
            value={form.hours}
            onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))}
            placeholder="e.g. 9am–9pm"
            disabled={form.isOpen24x7}
          />
        </div>

        <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
          <input
            type="checkbox"
            checked={form.isOpen24x7}
            onChange={(e) => setForm((f) => ({ ...f, isOpen24x7: e.target.checked }))}
          />
          Open 24×7
        </label>

        <div>
          <label className="text-xs font-semibold text-zinc-500">Location</label>
          <div className="mt-1.5">
            <LocationPicker value={location} onChange={setLocation} />
          </div>
        </div>

        {error && <p className="text-sm font-semibold text-critical">{error}</p>}

        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'Adding…' : 'Add listing'}
        </button>
      </form>

      {added.length > 0 && (
        <div className="card">
          <p className="mb-2 text-xs font-semibold text-zinc-500">Added this session</p>
          <ul className="flex flex-col gap-1.5">
            {added.map((label, i) => (
              <li key={i} className="flex items-center gap-1.5 text-sm text-zinc-700">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" /> {label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
