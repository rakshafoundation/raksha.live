'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function VerificationDecisionButtons({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function decide(approve: boolean) {
    setBusy(true);
    const rejectionReason = approve ? undefined : window.prompt('Reason for rejection?') ?? '';
    await fetch(`/api/admin/verifications/${id}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approve, rejectionReason }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button disabled={busy} onClick={() => decide(true)} className="rounded-full bg-success px-3 py-1 text-xs font-bold text-white">
        Approve ✓
      </button>
      <button disabled={busy} onClick={() => decide(false)} className="rounded-full bg-critical px-3 py-1 text-xs font-bold text-white">
        Reject
      </button>
    </div>
  );
}
