'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Navigation, PhoneCall, Sparkles, Camera, CheckCircle2, Building2 } from 'lucide-react';

interface NearestHelpEntry {
  organisationId: string;
  name: string;
  distanceMeters: number;
  phone: string;
  available: boolean;
}

interface NetworkCase {
  caseNumber: string;
  animalName: string;
  status: string;
  latitude: number;
  longitude: number;
  area: string;
  reporter: { name: string; phone: string | null };
  assessment: { suspectedInjury: string; urgency: string; disclaimer?: string } | null;
  receivingOrganisationName: string | null;
  nearestHelp: NearestHelpEntry[];
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

  if (!data) return <main className="px-4 pt-16 text-center text-zinc-400">Loading…</main>;

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${data.latitude},${data.longitude}`;
  const currentStepIndex = STEPS.findIndex((s) => s.fromStatus === data.status);
  const doneWithSteps = currentStepIndex === -1 && data.status !== 'ACCEPTED';

  return (
    <main className="flex flex-col gap-5 px-4 pb-16 pt-6">
      <header>
        <p className="text-xs font-semibold text-zinc-400">{data.caseNumber}</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">{data.animalName}</h1>
        <p className="text-sm text-zinc-500">{data.area}</p>
      </header>

      {data.assessment && (
        <div className="card border-ai/25 bg-purple-50/40">
          <p className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-ai">
            <Sparkles className="h-4 w-4" /> AI handling note
          </p>
          <p className="font-semibold text-zinc-900">{data.assessment.suspectedInjury}</p>
          <p className="text-sm font-bold uppercase tracking-wide text-urgent">{data.assessment.urgency}</p>
          <p className="mt-1 text-xs text-zinc-400">⚠️ Triage guidance, not a diagnosis.</p>
        </div>
      )}

      <div className="flex gap-3">
        <a href={mapsUrl} target="_blank" rel="noreferrer" className="btn-primary gap-2">
          <Navigation className="h-4 w-4" /> Navigate
        </a>
        {data.reporter.phone && (
          <a href={`tel:${data.reporter.phone}`} className="btn-secondary gap-2">
            <PhoneCall className="h-4 w-4" /> Call reporter
          </a>
        )}
      </div>

      {data.receivingOrganisationName ? (
        <div className="card flex items-center gap-2 border-info/25 bg-blue-50/40 font-semibold text-info">
          <Building2 className="h-4 w-4 shrink-0" /> Bring to: {data.receivingOrganisationName} (already agreed to
          receive this case)
        </div>
      ) : (
        data.nearestHelp.length > 0 && (
          <div className="card">
            <p className="section-label mb-3">No destination confirmed yet — nearest options</p>
            <ul className="flex flex-col gap-2.5">
              {data.nearestHelp.map((h) => (
                <li key={h.organisationId} className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-zinc-900">{h.name}</p>
                    <p className="text-xs text-zinc-500">
                      {(h.distanceMeters / 1000).toFixed(1)} km · {h.available ? 'Available' : 'Busy'}
                    </p>
                  </div>
                  <a
                    href={`tel:${h.phone}`}
                    className="flex shrink-0 items-center gap-1.5 rounded-full bg-info px-3 py-1.5 text-xs font-bold text-white"
                  >
                    <PhoneCall className="h-3.5 w-3.5" /> Call
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )
      )}

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
        <p className="card flex flex-col items-center gap-2 py-6 text-center font-semibold text-success">
          <CheckCircle2 className="h-8 w-8" />
          Handed over. This case now continues at the vet/NGO.
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
    return (
      <div className="card flex items-center gap-2 text-success">
        <CheckCircle2 className="h-4 w-4" /> {label}
      </div>
    );
  }

  return (
    <div className={`card transition-opacity ${locked ? 'opacity-40' : ''}`}>
      <p className="mb-2 flex items-center gap-1.5 font-semibold text-zinc-900">
        {label} {requiresPhoto && <Camera className="h-4 w-4 text-zinc-400" />}
      </p>
      {requiresPhoto && !locked && (
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          className="mb-2 block text-sm text-zinc-500"
        />
      )}
      <button
        disabled={locked || submitting || (requiresPhoto && !photo)}
        onClick={() => onSubmit(photo)}
        className="btn-primary"
      >
        {submitting ? 'Updating…' : label}
      </button>
    </div>
  );
}
