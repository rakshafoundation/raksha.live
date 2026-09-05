'use client';

import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { Heart, Share2, Check } from 'lucide-react';

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
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white pb-safe pt-3 shadow-[0_-4px_16px_-4px_rgba(0,0,0,0.06)]">
      <div className="mx-auto flex max-w-3xl gap-3 px-4">
        <button
          onClick={follow}
          className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3.5 font-bold transition active:scale-[0.98] ${
            following ? 'border-ai bg-purple-50 text-ai' : 'border-zinc-200 text-zinc-700'
          }`}
        >
          {following ? <Check className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
          {following ? 'Following' : 'Follow case'}
        </button>
        <button
          onClick={share}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-zinc-200 px-4 py-3.5 font-bold text-zinc-700 transition active:scale-[0.98]"
        >
          <Share2 className="h-4 w-4" /> Share
        </button>
      </div>
    </div>
  );
}
