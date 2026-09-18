'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PhoneCall, Sparkles, CheckCircle2, MessageSquare, FileText, HeartHandshake, ArrowLeft } from 'lucide-react';

interface CaseUpdate {
  id: string;
  organisationName: string;
  message: string;
  photoUrl: string | null;
  createdAt: string;
}

interface CaseDoc {
  id: string;
  organisationName: string;
  label: string;
  url: string;
  createdAt: string;
}

interface NetworkCase {
  caseNumber: string;
  animalName: string;
  status: string;
  outcomeType: string | null;
  area: string;
  reporter: { name: string; phone: string | null };
  assessment: { suspectedInjury: string; urgency: string } | null;
  receivingOrganisationId: string | null;
  isMyReceivingOrg: boolean;
  updates: CaseUpdate[];
  documents: CaseDoc[];
  fundraiser: { goalAmount: number; raisedAmount: number; paymentLink: string | null } | null;
}

const OUTCOME_OPTIONS = [
  { value: 'RELEASED', label: 'Released (recovered)', requiresPhoto: true },
  { value: 'FOSTERED', label: 'Moved to foster care', requiresPhoto: false },
  { value: 'ADOPTED', label: 'Adopted', requiresPhoto: false },
  { value: 'DECEASED', label: 'Deceased', requiresPhoto: false },
];

export default function ProviderCasePage() {
  const params = useParams<{ caseNumber: string }>();
  const [data, setData] = useState<NetworkCase | null>(null);
  const [paymentApproved, setPaymentApproved] = useState(false);
  const [paymentApprovalPending, setPaymentApprovalPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const [caseRes, statusRes] = await Promise.all([
      fetch(`/api/cases/${params.caseNumber}/network`),
      fetch('/api/provider/status'),
    ]);
    if (caseRes.ok) setData(await caseRes.json());
    if (statusRes.ok) {
      const s = await statusRes.json();
      setPaymentApproved(Boolean(s.organisation?.paymentApproved));
      setPaymentApprovalPending(Boolean(s.organisation?.paymentApprovalPending));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.caseNumber]);

  async function advance(targetStatus: string, extra: Record<string, string> = {}, photo: File | null = null) {
    setSubmitting(true);
    setError(null);
    try {
      let res: Response;
      if (photo) {
        const formData = new FormData();
        formData.set('targetStatus', targetStatus);
        Object.entries(extra).forEach(([k, v]) => formData.set(k, v));
        formData.set('photo', photo);
        res = await fetch(`/api/cases/${params.caseNumber}/events`, { method: 'POST', body: formData });
      } else {
        res = await fetch(`/api/cases/${params.caseNumber}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetStatus, ...extra }),
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

  if (!data.isMyReceivingOrg) {
    return (
      <main className="flex flex-col items-center gap-3 px-4 pt-16 text-center">
        <p className="text-zinc-500">This case isn't assigned to your organisation.</p>
        <Link href="/provider" className="text-sm font-semibold text-info">
          Back to dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-5 px-4 pb-20 pt-6">
      <Link href="/provider" className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-zinc-500">
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>

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
        </div>
      )}

      {data.reporter.phone && (
        <a href={`tel:${data.reporter.phone}`} className="btn-secondary w-fit gap-2">
          <PhoneCall className="h-4 w-4" /> Call reporter
        </a>
      )}

      {error && <p className="text-sm text-critical">{error}</p>}

      <StatusPanel status={data.status} submitting={submitting} onAdvance={advance} />

      <UpdateForm caseNumber={data.caseNumber} onPosted={load} />

      <DocumentForm caseNumber={data.caseNumber} onUploaded={load} />

      <FundraiserForm
        caseNumber={data.caseNumber}
        current={data.fundraiser}
        paymentApproved={paymentApproved}
        paymentApprovalPending={paymentApprovalPending}
        onSaved={load}
      />

      {data.updates.length > 0 && (
        <section className="card">
          <h2 className="section-label mb-3 flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" /> Updates posted
          </h2>
          <div className="flex flex-col gap-3">
            {data.updates.map((u) => (
              <p key={u.id} className="text-sm text-zinc-700">
                {u.message}
                <span className="ml-2 text-xs text-zinc-400">
                  {new Date(u.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </p>
            ))}
          </div>
        </section>
      )}

      {data.documents.length > 0 && (
        <section className="card">
          <h2 className="section-label mb-3 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Documents uploaded
          </h2>
          <ul className="flex flex-col gap-1.5">
            {data.documents.map((d) => (
              <li key={d.id}>
                <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-info underline">
                  {d.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

function StatusPanel({
  status,
  submitting,
  onAdvance,
}: {
  status: string;
  submitting: boolean;
  onAdvance: (targetStatus: string, extra?: Record<string, string>, photo?: File | null) => void;
}) {
  const [outcomeType, setOutcomeType] = useState('RELEASED');
  const [outcomePhoto, setOutcomePhoto] = useState<File | null>(null);
  const [reason, setReason] = useState('');
  const [showCantContinue, setShowCantContinue] = useState(false);

  if (status === 'CLOSED') {
    return (
      <div className="card flex flex-col items-center gap-2 py-6 text-center font-semibold text-success">
        <CheckCircle2 className="h-8 w-8" />
        This case is closed.
      </div>
    );
  }

  const beforeArrival = !['AT_VET', 'TREATMENT', 'RECOVERY', 'OUTCOME'].includes(status);

  return (
    <div className="flex flex-col gap-3">
      {beforeArrival && (
        <div className="card text-sm text-zinc-500">Waiting for the rescuer to bring the animal to you.</div>
      )}

      {status === 'AT_VET' && (
        <div className="card">
          <p className="mb-2 font-semibold text-zinc-900">Admitted — begin treatment</p>
          <button className="btn-primary" disabled={submitting} onClick={() => onAdvance('TREATMENT')}>
            Move to treatment
          </button>
        </div>
      )}

      {status === 'TREATMENT' && (
        <div className="card">
          <p className="mb-2 font-semibold text-zinc-900">In treatment</p>
          <button className="btn-primary" disabled={submitting} onClick={() => onAdvance('RECOVERY')}>
            Move to recovery
          </button>
        </div>
      )}

      {status === 'RECOVERY' && (
        <div className="card">
          <p className="mb-2 font-semibold text-zinc-900">Recovering — record the outcome</p>
          <select className="input-field mb-2" value={outcomeType} onChange={(e) => setOutcomeType(e.target.value)}>
            {OUTCOME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {OUTCOME_OPTIONS.find((o) => o.value === outcomeType)?.requiresPhoto && (
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setOutcomePhoto(e.target.files?.[0] ?? null)}
              className="mb-2 block text-sm text-zinc-500"
            />
          )}
          <button
            className="btn-primary"
            disabled={
              submitting ||
              (OUTCOME_OPTIONS.find((o) => o.value === outcomeType)?.requiresPhoto && !outcomePhoto)
            }
            onClick={() => onAdvance('OUTCOME', { outcomeType }, outcomePhoto)}
          >
            Record outcome
          </button>
        </div>
      )}

      {status === 'OUTCOME' && (
        <div className="card">
          <p className="mb-2 font-semibold text-zinc-900">Outcome recorded</p>
          <button className="btn-primary" disabled={submitting} onClick={() => onAdvance('CLOSED')}>
            Close case
          </button>
        </div>
      )}

      {!showCantContinue ? (
        <button className="text-center text-xs font-medium text-zinc-400 underline" onClick={() => setShowCantContinue(true)}>
          Can't continue this case?
        </button>
      ) : (
        <div className="card">
          <p className="mb-2 text-sm font-semibold text-zinc-700">Close as "could not attend"</p>
          <textarea
            className="input-field mb-2"
            placeholder="Reason (required)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <button
            className="btn-secondary"
            disabled={submitting || !reason.trim()}
            onClick={() => onAdvance('CLOSED', { outcomeType: 'COULD_NOT_ATTEND', outcomeReason: reason })}
          >
            Close case
          </button>
        </div>
      )}
    </div>
  );
}

function UpdateForm({ caseNumber, onPosted }: { caseNumber: string; onPosted: () => void }) {
  const [message, setMessage] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);

  async function submit() {
    setPosting(true);
    try {
      const formData = new FormData();
      formData.set('message', message);
      if (photo) formData.set('photo', photo);
      const res = await fetch(`/api/cases/${caseNumber}/updates`, { method: 'POST', body: formData });
      if (res.ok) {
        setMessage('');
        setPhoto(null);
        onPosted();
      }
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="card">
      <p className="section-label mb-2">Post a public update</p>
      <textarea
        className="input-field mb-2"
        placeholder="e.g. Stable, on IV fluids, responding well"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} className="mb-2 block text-sm text-zinc-500" />
      <button className="btn-secondary" disabled={posting || !message.trim()} onClick={submit}>
        {posting ? 'Posting…' : 'Post update'}
      </button>
    </div>
  );
}

function DocumentForm({ caseNumber, onUploaded }: { caseNumber: string; onUploaded: () => void }) {
  const [label, setLabel] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  async function submit() {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set('label', label);
      formData.set('file', file!);
      const res = await fetch(`/api/cases/${caseNumber}/documents`, { method: 'POST', body: formData });
      if (res.ok) {
        setLabel('');
        setFile(null);
        onUploaded();
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="card">
      <p className="section-label mb-2 flex items-center gap-1.5">
        <FileText className="h-3.5 w-3.5" /> Upload a vet report or document
      </p>
      <input
        className="input-field mb-2"
        placeholder="e.g. Vet report — Day 3"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />
      <input type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mb-2 block text-sm text-zinc-500" />
      <button className="btn-secondary" disabled={uploading || !label.trim() || !file} onClick={submit}>
        {uploading ? 'Uploading…' : 'Upload'}
      </button>
    </div>
  );
}

function FundraiserForm({
  caseNumber,
  current,
  paymentApproved,
  paymentApprovalPending,
  onSaved,
}: {
  caseNumber: string;
  current: { goalAmount: number; raisedAmount: number; paymentLink: string | null } | null;
  paymentApproved: boolean;
  paymentApprovalPending: boolean;
  onSaved: () => void;
}) {
  const [goalAmount, setGoalAmount] = useState(String(current?.goalAmount ?? ''));
  const [raisedAmount, setRaisedAmount] = useState(String(current?.raisedAmount ?? '0'));
  const [paymentLink, setPaymentLink] = useState(current?.paymentLink ?? '');
  const [upiHandle, setUpiHandle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!paymentApproved) {
    return (
      <div className="card">
        <p className="section-label mb-2 flex items-center gap-1.5">
          <HeartHandshake className="h-3.5 w-3.5" /> Fundraising
        </p>
        {paymentApprovalPending ? (
          <p className="text-sm text-zinc-500">Payment approval request pending admin review.</p>
        ) : (
          <>
            <p className="mb-2 text-sm text-zinc-500">
              Your payment details need admin approval before you can raise funds for a case.
            </p>
            <input
              className="input-field mb-2"
              placeholder="Your UPI handle (e.g. org@upi)"
              value={upiHandle}
              onChange={(e) => setUpiHandle(e.target.value)}
            />
            <button
              className="btn-secondary"
              disabled={!upiHandle.trim() || saving}
              onClick={async () => {
                setSaving(true);
                const res = await fetch('/api/provider/payment-approval', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ upiHandle }),
                });
                setSaving(false);
                if (res.ok) onSaved();
                else setError((await res.json()).error ?? 'Failed');
              }}
            >
              Request payment approval
            </button>
            {error && <p className="mt-2 text-sm text-critical">{error}</p>}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="card">
      <p className="section-label mb-2 flex items-center gap-1.5">
        <HeartHandshake className="h-3.5 w-3.5" /> Fundraising
      </p>
      <input
        className="input-field mb-2"
        type="number"
        placeholder="Goal amount (₹)"
        value={goalAmount}
        onChange={(e) => setGoalAmount(e.target.value)}
      />
      <input
        className="input-field mb-2"
        type="number"
        placeholder="Raised so far (₹)"
        value={raisedAmount}
        onChange={(e) => setRaisedAmount(e.target.value)}
      />
      <input
        className="input-field mb-2"
        placeholder="Your payment page URL (UPI/Razorpay/etc.)"
        value={paymentLink}
        onChange={(e) => setPaymentLink(e.target.value)}
      />
      {error && <p className="mb-2 text-sm text-critical">{error}</p>}
      <button
        className="btn-secondary"
        disabled={saving || !goalAmount || !paymentLink}
        onClick={async () => {
          setSaving(true);
          setError(null);
          const res = await fetch(`/api/cases/${caseNumber}/fundraiser`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ goalAmount, raisedAmount, paymentLink }),
          });
          setSaving(false);
          if (res.ok) onSaved();
          else setError((await res.json()).error?.toString() ?? 'Could not save');
        }}
      >
        {saving ? 'Saving…' : current ? 'Update fundraiser' : 'Start fundraiser'}
      </button>
    </div>
  );
}
