'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import { InjuryType, Species } from '@prisma/client';
import { InjuryTiles } from '@/components/InjuryTiles';
import { SpeciesChips } from '@/components/SpeciesChips';
import { ANIMAL_NAME_SUGGESTIONS } from '@/lib/labels';

type Step = 'location' | 'photo' | 'details' | 'duplicate' | 'name' | 'done';

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

export default function ReportFlowPage() {
  const { data: session, status: sessionStatus } = useSession();
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

  // Sign-in is placed after the reporter has already invested time in the
  // report (build brief §2 step 4). We persist the draft so nothing is
  // lost while they complete social sign-in and come back.
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const saved = typeof window !== 'undefined' ? localStorage.getItem(DRAFT_KEY) : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Draft;
        setDraft(parsed);
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
        setLocationError('Could not get GPS location — enter the nearest landmark below and drop an approximate pin.');
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

  return (
    <main className="flex flex-col gap-6 p-4 pb-16">
      <h1 className="text-xl font-bold text-critical">Report an animal emergency</h1>

      {step === 'location' && (
        <section className="flex flex-col gap-4">
          <p className="text-zinc-600">Where is the animal?</p>
          <button className="btn-primary" onClick={useMyLocation} disabled={locating}>
            {locating ? 'Locating…' : '📍 Use my location'}
          </button>
          {locationError && <p className="text-sm text-critical">{locationError}</p>}
          {draft.latitude && draft.longitude && (
            <p className="text-sm text-success">
              Location captured ({draft.latitude.toFixed(5)}, {draft.longitude.toFixed(5)})
            </p>
          )}
          <input
            className="rounded-card border border-zinc-300 p-3"
            placeholder="Nearest landmark / area (e.g. Worli Sea Face)"
            value={draft.area}
            onChange={(e) => setDraft((d) => ({ ...d, area: e.target.value }))}
          />
          <button
            className="btn-primary"
            disabled={!draft.latitude || !draft.area}
            onClick={() => setStep('photo')}
          >
            Continue
          </button>
        </section>
      )}

      {step === 'photo' && (
        <section className="flex flex-col gap-4">
          <p className="text-zinc-600">Take a photo — AI will assess it instantly.</p>
          {photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreview} alt="Selected" className="rounded-card border border-zinc-200" />
          ) : (
            <label className="tap-tile cursor-pointer py-10">
              <span className="text-3xl">📷</span>
              <span>Tap to take/select photo</span>
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
          <button className="btn-primary" onClick={() => setStep('details')}>
            Continue
          </button>
          {!photoFile && (
            <button className="text-sm text-zinc-500 underline" onClick={() => setStep('details')}>
              I can't take a photo
            </button>
          )}
        </section>
      )}

      {step === 'details' && (
        <section className="flex flex-col gap-6">
          <div>
            <p className="mb-2 font-medium text-zinc-700">What's wrong?</p>
            <InjuryTiles value={draft.injuryType} onChange={(v) => setDraft((d) => ({ ...d, injuryType: v }))} />
          </div>
          <div>
            <p className="mb-2 font-medium text-zinc-700">Species</p>
            <SpeciesChips value={draft.species} onChange={(v) => setDraft((d) => ({ ...d, species: v }))} />
          </div>
          <button
            className="btn-primary"
            disabled={!draft.injuryType || !draft.species || checkingDuplicates}
            onClick={checkDuplicatesAndAdvance}
          >
            {checkingDuplicates ? 'Checking…' : 'Continue'}
          </button>
        </section>
      )}

      {step === 'duplicate' && candidates[0] && (
        <section className="flex flex-col gap-4">
          <div className="card border-urgent bg-amber-50">
            <p className="font-semibold text-urgent">⚠️ This may already be an active case</p>
            <p className="mt-2 font-medium">
              {candidates[0].caseNumber} · {candidates[0].animalName} · {candidates[0].distanceMeters}m away · Reported{' '}
              {candidates[0].minutesSinceReported} min ago
            </p>
            <Link href={`/c/${candidates[0].caseNumber}`} className="mt-2 inline-block text-sm text-info underline">
              View this case
            </Link>
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              setDraft((d) => ({ ...d, mergeIntoCaseNumber: candidates[0]!.caseNumber }));
              setStep('name');
            }}
          >
            YES, SAME ANIMAL — follow this case
          </button>
          <button
            className="rounded-card border-2 border-zinc-300 px-6 py-4 font-bold"
            onClick={() => {
              setDraft((d) => ({ ...d, mergeIntoCaseNumber: null }));
              setStep('name');
            }}
          >
            NO, DIFFERENT ANIMAL — continue report
          </button>
        </section>
      )}

      {step === 'name' && sessionStatus !== 'authenticated' && (
        <section className="flex flex-col gap-4">
          <p className="text-zinc-600">Almost there — sign in to submit your report.</p>
          <button className="btn-primary" onClick={saveDraftAndRequireSignIn}>
            Sign in to get help now
          </button>
          <p className="text-xs text-zinc-500">Your report so far is saved — nothing will be lost.</p>
        </section>
      )}

      {step === 'name' && sessionStatus === 'authenticated' && (
        <section className="flex flex-col gap-4">
          <p className="font-medium text-zinc-700">What should we call them?</p>
          <input
            className="rounded-card border border-zinc-300 p-3 text-lg"
            placeholder="Animal's name"
            value={draft.animalName}
            onChange={(e) => setDraft((d) => ({ ...d, animalName: e.target.value }))}
          />
          <div className="flex flex-wrap gap-2">
            {ANIMAL_NAME_SUGGESTIONS.map((n) => (
              <button
                key={n}
                className="rounded-full border border-zinc-300 px-3 py-1 text-sm"
                onClick={() => setDraft((d) => ({ ...d, animalName: n }))}
              >
                {n}
              </button>
            ))}
          </div>
          {submitError && <p className="text-sm text-critical">{submitError}</p>}
          <button className="btn-primary" disabled={!draft.animalName || submitting} onClick={submitReport}>
            {submitting ? 'Submitting…' : 'Get help now'}
          </button>
        </section>
      )}

      {step === 'done' && result && (
        <section className="flex flex-col gap-4">
          {result.merged ? (
            <div className="card">
              <p className="font-semibold text-success">✅ You're now following {result.caseNumber}</p>
              <Link href={`/c/${result.caseNumber}`} className="mt-2 inline-block text-info underline">
                Track case →
              </Link>
            </div>
          ) : (
            <>
              <div className="card">
                <p className="font-semibold text-success">
                  ✅ Case {result.case.caseNumber} · "{result.case.animalName}" created
                </p>
              </div>
              {result.assessment && (
                <div className="card border-ai">
                  <p className="mb-1 flex items-center gap-1 font-semibold text-ai">✨ AI assessment</p>
                  <p>Possible: {result.assessment.suspectedInjury}</p>
                  <p className="font-medium text-urgent">Urgency: {result.assessment.urgency}</p>
                  <p className="text-xs text-zinc-500">⚠️ {result.assessment.disclaimer}</p>
                  <p className="mt-3 font-medium">DO NOW</p>
                  <ul className="list-disc pl-5 text-sm">
                    {result.assessment.doNow.map((step: string, i: number) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.nearestHelp?.length > 0 && (
                <div className="card">
                  <p className="mb-2 font-semibold">NEAREST HELP</p>
                  <ul className="flex flex-col gap-2">
                    {result.nearestHelp.map((h: any) => (
                      <li key={h.organisationId} className="flex items-center justify-between">
                        <span>
                          {h.name} ✓ — {(h.distanceMeters / 1000).toFixed(1)} km ·{' '}
                          {h.available ? 'Available' : 'Busy'}
                        </span>
                        <a href={`tel:${h.phone}`} className="rounded-full bg-info px-3 py-1 text-xs font-bold text-white">
                          CALL
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-center text-sm text-zinc-500">
                We're notifying rescuers. You'll get updates.
              </p>
              <Link href={`/c/${result.case.caseNumber}`} className="btn-primary text-center">
                Track case
              </Link>
            </>
          )}
        </section>
      )}
    </main>
  );
}
