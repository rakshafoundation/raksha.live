'use client';

import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';

export function FollowShareButtons({ caseNumber }: { caseNumber: string }) {
  const { data: session } = useSession();
  const [following, setFollowing] = useState(false);

  async function follow() {
    if (!session?.user) {
      signIn(undefined, { callbackUrl: `/c/${caseNumber}` });
      return;
    }
    const res = await fetch(`/api/cases/${caseNumber}/follow`, { method: 'POST' });
    if (res.ok) setFollowing(true);
  }

  async function share() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      await navigator.share({ title: `Raksha Network · ${caseNumber}`, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  }

  return (
    <div className="flex gap-3">
      <button onClick={follow} className="flex-1 rounded-card border-2 border-ai px-4 py-3 font-bold text-ai">
        {following ? '✓ Following' : 'Follow case'}
      </button>
      <button onClick={share} className="flex-1 rounded-card border-2 border-zinc-300 px-4 py-3 font-bold">
        Share
      </button>
    </div>
  );
}
