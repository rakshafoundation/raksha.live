'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface NetworkCase {
  caseNumber: string;
  animalName: string;
  status: string;
  latitude: number;
  longitude: number;
  area: string;
  reporter: { name: string; phone: string | null };
  assessment: { suspectedInjury: string; urgency: string; disclaimer?: string } | null;
}

const STEPS = [
  { fromStatus: 'ACCEPTED', toStatus: 'ASSIGNED', label: 'Reached location', photo: false },
  { fromStatus: 'ASSIGNED', toStatus: 'PICKED_UP', label: 'Animal secured', photo: true },
  { fromStatus: 'PICKED_UP', toStatus: 'AT_VET', label: 'Handed over', photo: true },
];

export default function RescuerActiveCasePage() {
  const params = useParams<{ caseNumber: string }>();
  const [data, setData] = useState<NetworkCase | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/cases/${params.caseNumber}/network`);
    if (res.ok) setData(await res.json());
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.caseNumber]);

  async function advance(toStatus: string, photo: File | null) {
    setSubmitting(true);
    setError(null);
    try {
      let res: Response;
      if (photo) {
        const formData = new FormData();
        formData.set('targetStatus', toStatus);
        formData.set('photo', photo);
        res = await fetch(`/api/cases/${params.caseNumber}/events`, { method: 'POST', body: formData });
      } else {
        res = await fetch(`/api/cases/${params.caseNumber}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetStatus: toStatus }),
        });
      }
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? 'Could not update status');
        return;
      }
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  if (!data) return <main className="p-4">Loading…</main>;

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${data.latitude},${data.longitude}`;
  const currentStepIndex = STEPS.findIndex((s) => s.fromStatus === data.status);
  const doneWithSteps = currentStepIndex === -1 && data.status !== 'ACCEPTED';

  return (
    <main className="flex flex-col gap-4 p-4 pb-16">
      <h1 className="text-xl font-bold">
        {data.animalName} · {data.caseNumber}
      </h1>
      <p className="text-sm text-zinc-500">{data.area}</p>

      {data.assessment && (
        <div className="card border-ai">
          <p className="mb-1 font-semibold text-ai">✨ AI handling note</p>
          <p>{data.assessment.suspectedInjury}</p>
          <p className="font-medium text-urgent">Urgency: {data.assessment.urgency}</p>
          <p className="text-xs text-zinc-500">⚠️ Triage guidance, not a diagnosis.</p>
        </div>
      )}

      <div className="flex gap-3">
        <a href={mapsUrl} target="_blank" rel="noreferrer" className="btn-primary flex-1 text-center">
          Navigate
        </a>
        {data.reporter.phone && (
          <a href={`tel:${data.reporter.phone}`} className="flex-1 rounded-card border-2 border-zinc-300 py-4 text-center font-bold">
            Call reporter
          </a>
        )}
      </div>

      {error && <p className="text-sm text-critical">{error}</p>}

      <div className="flex flex-col gap-3">
        {STEPS.map((step, i) => {
          const isDone = STEPS.findIndex((s) => s.fromStatus === data.status) > i || doneWithSteps;
          const isCurrent = step.fromStatus === data.status;
          const isLocked = !isDone && !isCurrent;
          return (
            <StepButton
              key={step.toStatus}
              label={step.label}
              requiresPhoto={step.photo}
              done={isDone}
              locked={isLocked}
              submitting={submitting}
              onSubmit={(photo) => advance(step.toStatus, photo)}
            />
          );
        })}
      </div>

      {data.status === 'AT_VET' && (
        <p className="card text-center font-semibold text-success">
          ✅ Handed over. This case now continues at the vet/NGO.
        </p>
      )}
    </main>
  );
}

function StepButton({
  label,
  requiresPhoto,
  done,
  locked,
  submitting,
  onSubmit,
}: {
  label: string;
  requiresPhoto: boolean;
  done: boolean;
  locked: boolean;
  submitting: boolean;
  onSubmit: (photo: File | null) => void;
}) {
  const [photo, setPhoto] = useState<File | null>(null);

  if (done) {
    return <div className="card text-success">✓ {label}</div>;
  }

  return (
    <div className={`card ${locked ? 'opacity-40' : ''}`}>
      <p className="mb-2 font-medium">
        {label} {requiresPhoto && '📸 (photo required)'}
      </p>
      {requiresPhoto && !locked && (
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          className="mb-2 block text-sm"
        />
      )}
      <button
        disabled={locked || submitting || (requiresPhoto && !photo)}
        onClick={() => onSubmit(photo)}
        className="btn-primary w-full"
      >
        {submitting ? 'Updating…' : label}
      </button>
    </div>
  );
}
