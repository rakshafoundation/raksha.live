'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { InjuryType, Species } from '@prisma/client';
import {
  MapPin,
  Camera,
  RotateCcw,
  AlertTriangle,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  LogIn,
} from 'lucide-react';
import { InjuryTiles } from '@/components/InjuryTiles';
import { SpeciesChips } from '@/components/SpeciesChips';
import { StepProgress } from '@/components/StepProgress';
import { ANIMAL_NAME_SUGGESTIONS } from '@/lib/labels';

type Step = 'location' | 'photo' | 'details' | 'duplicate' | 'name' | 'done';

const STEP_INDEX: Record<Step, number> = {
  location: 1,
  photo: 2,
  details: 3,
  duplicate: 4,
  name: 4,
  done: 4,
};
const STEP_LABEL: Record<Step, string> = {
  location: 'Where is the animal?',
  photo: 'Add a photo',
  details: "What's wrong?",
  duplicate: 'Quick check',
  name: 'Almost there',
  done: 'Done',
};

interface DuplicateCandidate {
  caseId: string;
  caseNumber: string;
  animalName: string;
  distanceMeters: number;
  minutesSinceReported: number;
  status: string;
}

interface Draft {
  latitude: number | null;
  longitude: number | null;
  area: string;
  species: Species | null;
  injuryType: InjuryType | null;
  animalName: string;
  mergeIntoCaseNumber: string | null;
}

const DRAFT_KEY = 'raksha_report_draft_v1';

function BottomBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white pb-safe pt-3 shadow-[0_-4px_16px_-4px_rgba(0,0,0,0.06)]">
      <div className="mx-auto flex max-w-3xl flex-col gap-2 px-4">{children}</div>
    </div>
  );
}

export default function ReportFlowPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<Step>('location');
  const [draft, setDraft] = useState<Draft>({
    latitude: null,
    longitude: null,
    area: '',
    species: null,
    injuryType: null,
    animalName: '',
    mergeIntoCaseNumber: null,
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<DuplicateCandidate[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const restoredRef = useRef(false);

  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const saved = typeof window !== 'undefined' ? localStorage.getItem(DRAFT_KEY) : null;
    if (saved) {
      try {
        setDraft(JSON.parse(saved) as Draft);
        setStep('name');
      } catch {
        // ignore corrupt draft
      }
    }
  }, []);

  function saveDraftAndRequireSignIn() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    signIn(undefined, { callbackUrl: '/report' });
  }

  function useMyLocation() {
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDraft((d) => ({ ...d, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
        setLocating(false);
      },
      () => {
        setLocationError('Could not get GPS — enter the nearest landmark below instead.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }

  async function checkDuplicatesAndAdvance() {
    if (!draft.species || !draft.latitude || !draft.longitude) return;
    setCheckingDuplicates(true);
    try {
      const res = await fetch('/api/cases/duplicate-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ species: draft.species, latitude: draft.latitude, longitude: draft.longitude }),
      });
      const data = await res.json();
      if (data.candidates?.length > 0) {
        setCandidates(data.candidates);
        setStep('duplicate');
      } else {
        setStep('name');
      }
    } finally {
      setCheckingDuplicates(false);
    }
  }

  async function submitReport() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const formData = new FormData();
      formData.set('animalName', draft.animalName || 'Unnamed');
      formData.set('species', draft.species!);
      formData.set('injuryType', draft.injuryType!);
      formData.set('latitude', String(draft.latitude));
      formData.set('longitude', String(draft.longitude));
      formData.set('area', draft.area || 'Mumbai');
      if (draft.mergeIntoCaseNumber) formData.set('mergeIntoCaseNumber', draft.mergeIntoCaseNumber);
      if (photoFile) formData.set('photo', photoFile);

      const res = await fetch('/api/cases', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error?.toString() ?? 'Something went wrong. Please try again.');
        return;
      }
      localStorage.removeItem(DRAFT_KEY);
      setResult(data);
      setStep('done');
    } finally {
      setSubmitting(false);
    }
  }

  const backTargets: Partial<Record<Step, () => void>> = {
    location: () => router.push('/'),
    photo: () => setStep('location'),
    details: () => setStep('photo'),
    duplicate: () => setStep('details'),
    name: () => setStep(candidates.length > 0 ? 'duplicate' : 'details'),
  };

  return (
    <main className="flex min-h-screen flex-col">
      {step !== 'done' && (
        <StepProgress step={STEP_INDEX[step]} total={4} label={STEP_LABEL[step]} onBack={backTargets[step]} />
      )}

      <div className="flex-1 px-4 pb-32 pt-5">
        {step === 'location' && (
          <section key="location" className="flex animate-in flex-col gap-5">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">Where is the animal?</h1>
              <p className="mt-1 text-zinc-500">We'll pinpoint it so the nearest rescuer can find them fast.</p>
            </div>

            {draft.latitude && draft.longitude ? (
              <div className="card flex items-center gap-3 border-success/30 bg-green-50">
                <CheckCircle2 className="h-6 w-6 shrink-0 text-success" />
                <div>
                  <p className="font-semibold text-success">Location captured</p>
                  <button onClick={useMyLocation} className="text-sm font-medium text-zinc-500 underline">
                    Re-capture
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={useMyLocation}
                disabled={locating}
                className="card flex items-center gap-4 border-2 border-dashed border-info/40 bg-blue-50/50 py-6 text-left transition active:scale-[0.98]"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-info text-white">
                  <MapPin className="h-6 w-6" />
                </span>
                <span>
                  <span className="block font-bold text-info">{locating ? 'Locating…' : 'Use my location'}</span>
                  <span className="text-sm text-zinc-500">Fastest — one tap</span>
                </span>
              </button>
            )}
            {locationError && (
              <p className="flex items-center gap-2 text-sm text-critical">
                <AlertTriangle className="h-4 w-4 shrink-0" /> {locationError}
              </p>
            )}

            <div>
              <label className="section-label mb-1.5 block">Nearest landmark / area</label>
              <input
                className="input-field"
                placeholder="e.g. Worli Sea Face, near the bus stop"
                value={draft.area}
                onChange={(e) => setDraft((d) => ({ ...d, area: e.target.value }))}
              />
            </div>
          </section>
        )}

        {step === 'photo' && (
          <section key="photo" className="flex animate-in flex-col gap-5">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">Add a photo</h1>
              <p className="mt-1 flex items-center gap-1.5 text-zinc-500">
                <Sparkles className="h-4 w-4 text-ai" /> AI will assess it instantly to guide the rescuer
              </p>
            </div>

            {photoPreview ? (
              <div className="relative overflow-hidden rounded-card border border-zinc-200 shadow-soft">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoPreview} alt="Selected" className="max-h-80 w-full object-cover" />
                <button
                  onClick={() => {
                    setPhotoFile(null);
                    setPhotoPreview(null);
                  }}
                  className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Retake
                </button>
              </div>
            ) : (
              <label className="card flex cursor-pointer flex-col items-center gap-3 border-2 border-dashed border-zinc-300 bg-zinc-50/60 py-14 text-center transition active:scale-[0.98]">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white">
                  <Camera className="h-7 w-7" />
                </span>
                <span className="font-bold text-zinc-700">Tap to take a photo</span>
                <span className="text-sm text-zinc-400">or choose from gallery</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setPhotoFile(file);
                    setPhotoPreview(file ? URL.createObjectURL(file) : null);
                  }}
                />
              </label>
            )}
          </section>
        )}

        {step === 'details' && (
          <section key="details" className="flex animate-in flex-col gap-7">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">What's wrong?</h1>
              <p className="mt-1 text-zinc-500">Tap the closest match — no need to be exact.</p>
            </div>
            <div>
              <p className="section-label mb-2.5">Injury / situation</p>
              <InjuryTiles value={draft.injuryType} onChange={(v) => setDraft((d) => ({ ...d, injuryType: v }))} />
            </div>
            <div>
              <p className="section-label mb-2.5">Species</p>
              <SpeciesChips value={draft.species} onChange={(v) => setDraft((d) => ({ ...d, species: v }))} />
            </div>
          </section>
        )}

        {step === 'duplicate' && candidates[0] && (
          <section key="duplicate" className="flex animate-in flex-col gap-5">
            <div className="flex flex-col items-center gap-3 pt-4 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-urgent">
                <AlertTriangle className="h-7 w-7" />
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">
                This may already be reported
              </h1>
              <p className="text-zinc-500">Is this the same animal as this active case?</p>
            </div>

            <Link href={`/c/${candidates[0].caseNumber}`} className="card block transition active:scale-[0.98]">
              <p className="text-xs font-semibold text-zinc-400">{candidates[0].caseNumber}</p>
              <p className="text-lg font-bold text-zinc-900">{candidates[0].animalName}</p>
              <p className="mt-1 text-sm text-zinc-500">
                {candidates[0].distanceMeters}m away · reported {candidates[0].minutesSinceReported} min ago ·{' '}
                <span className="font-medium text-info">View case →</span>
              </p>
            </Link>
          </section>
        )}

        {step === 'name' && sessionStatus !== 'authenticated' && (
          <section key="signin" className="flex animate-in flex-col items-center gap-4 pt-8 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-info">
              <LogIn className="h-7 w-7" />
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">Almost there</h1>
            <p className="max-w-xs text-zinc-500">
              Sign in so rescuers can reach you and you can track this case. Nothing you've entered will be lost.
            </p>
          </section>
        )}

        {step === 'name' && sessionStatus === 'authenticated' && (
          <section key="name" className="flex animate-in flex-col gap-5">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">What should we call them?</h1>
              <p className="mt-1 text-zinc-500">Every case gets a name — it helps everyone stay invested.</p>
            </div>
            <input
              className="input-field text-lg font-medium"
              placeholder="Animal's name"
              value={draft.animalName}
              onChange={(e) => setDraft((d) => ({ ...d, animalName: e.target.value }))}
            />
            <div className="flex flex-wrap gap-2">
              {ANIMAL_NAME_SUGGESTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setDraft((d) => ({ ...d, animalName: n }))}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition active:scale-95 ${
                    draft.animalName === n ? 'border-critical bg-red-50 text-critical' : 'border-zinc-200 text-zinc-600'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            {submitError && (
              <p className="flex items-center gap-2 text-sm text-critical">
                <AlertTriangle className="h-4 w-4 shrink-0" /> {submitError}
              </p>
            )}
          </section>
        )}

        {step === 'done' && result && (
          <section className="flex animate-in flex-col gap-4 pt-2">
            {result.merged ? (
              <div className="card flex flex-col items-center gap-3 py-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-success" />
                <p className="text-lg font-bold text-success">You're now following {result.caseNumber}</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center gap-2 pb-2 pt-2 text-center">
                  <CheckCircle2 className="h-10 w-10 text-success" />
                  <p className="text-xl font-extrabold text-zinc-900">
                    Case {result.case.caseNumber} · "{result.case.animalName}" created
                  </p>
                  <p className="text-sm text-zinc-500">We're notifying nearby rescuers now.</p>
                </div>

                {result.assessment && (
                  <div className="card border-ai/25 bg-purple-50/40">
                    <p className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-ai">
                      <Sparkles className="h-4 w-4" /> AI assessment
                    </p>
                    <p className="font-semibold text-zinc-900">{result.assessment.suspectedInjury}</p>
                    <p className="mt-0.5 text-sm font-bold uppercase tracking-wide text-urgent">
                      {result.assessment.urgency}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">⚠️ {result.assessment.disclaimer}</p>
                    <p className="section-label mb-1.5 mt-3">Do now</p>
                    <ul className="flex flex-col gap-1.5 text-sm text-zinc-700">
                      {result.assessment.doNow.map((line: string, i: number) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-ai">•</span> {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.nearestHelp?.length > 0 && (
                  <div className="card">
                    <p className="section-label mb-3">Nearest help</p>
                    <ul className="flex flex-col gap-3">
                      {result.nearestHelp.map((h: any) => (
                        <li key={h.organisationId} className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-zinc-900">{h.name} ✓</p>
                            <p className="text-xs text-zinc-500">
                              {(h.distanceMeters / 1000).toFixed(1)} km · {h.available ? 'Available' : 'Busy'}
                            </p>
                          </div>
                          <a
                            href={`tel:${h.phone}`}
                            className="flex shrink-0 items-center gap-1.5 rounded-full bg-info px-3.5 py-2 text-xs font-bold text-white"
                          >
                            <PhoneCall className="h-3.5 w-3.5" /> Call
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </div>

      <BottomBar>
        {step === 'location' && (
          <button className="btn-primary" disabled={!draft.latitude || !draft.area} onClick={() => setStep('photo')}>
            Continue
          </button>
        )}

        {step === 'photo' && (
          <>
            <button className="btn-primary" onClick={() => setStep('details')}>
              Continue
            </button>
            {!photoFile && (
              <button className="text-center text-sm font-medium text-zinc-400 underline" onClick={() => setStep('details')}>
                I can't take a photo
              </button>
            )}
          </>
        )}

        {step === 'details' && (
          <button
            className="btn-primary"
            disabled={!draft.injuryType || !draft.species || checkingDuplicates}
            onClick={checkDuplicatesAndAdvance}
          >
            {checkingDuplicates ? 'Checking…' : 'Continue'}
          </button>
        )}

        {step === 'duplicate' && (
          <>
            <button
              className="btn-primary"
              onClick={() => {
                setDraft((d) => ({ ...d, mergeIntoCaseNumber: candidates[0]!.caseNumber }));
                setStep('name');
              }}
            >
              Yes, same animal — follow this case
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                setDraft((d) => ({ ...d, mergeIntoCaseNumber: null }));
                setStep('name');
              }}
            >
              No, different animal
            </button>
          </>
        )}

        {step === 'name' && sessionStatus !== 'authenticated' && (
          <button className="btn-primary" onClick={saveDraftAndRequireSignIn}>
            Sign in to get help now
          </button>
        )}

        {step === 'name' && sessionStatus === 'authenticated' && (
          <button className="btn-primary" disabled={!draft.animalName || submitting} onClick={submitReport}>
            {submitting ? 'Submitting…' : 'Get help now'}
          </button>
        )}

        {step === 'done' && result && !result.merged && (
          <Link href={`/c/${result.case.caseNumber}`} className="btn-primary">
            Track case
          </Link>
        )}
        {step === 'done' && result?.merged && (
          <Link href={`/c/${result.caseNumber}`} className="btn-primary">
            Track case
          </Link>
        )}
      </BottomBar>
    </main>
  );
}
