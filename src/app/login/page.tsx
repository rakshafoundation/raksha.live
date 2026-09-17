'use client';

import { getProviders, signIn } from 'next-auth/react';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { LogoMark } from '@/components/Logo';

function LoginForm() {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  // Which providers are actually registered server-side (authOptions only
  // adds Google when its client ID/secret are configured) — checked via
  // NextAuth's own endpoint rather than assumed, so this button never
  // shows for a provider that isn't wired up and would silently fail.
  const [providers, setProviders] = useState<Record<string, unknown> | null>(null);
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') ?? '/';

  useEffect(() => {
    getProviders().then(setProviders);
  }, []);

  const hasGoogle = Boolean(providers?.google);
  const hasDevLogin = Boolean(providers?.['dev-login']);

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 px-4 pb-16 pt-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <LogoMark className="h-10 w-10 text-info" />
        <h1 className="text-xl font-extrabold tracking-tight text-zinc-900">Sign in to Raksha Network</h1>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        {hasGoogle && (
          <button onClick={() => signIn('google', { callbackUrl })} className="btn-secondary shadow-soft">
            Continue with Google
          </button>
        )}

        {hasDevLogin && (
          <div className="card mt-2 flex flex-col gap-3">
            <p className="text-xs text-zinc-400">
              Dev login — phone only, no OTP. For local testing only; production requires OTP
              verification.
            </p>
            <input
              className="input-field"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="input-field"
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button
              onClick={() => signIn('dev-login', { phone, name, callbackUrl })}
              className="btn-primary"
              disabled={!phone}
            >
              Continue
            </button>
          </div>
        )}

        {providers && !hasGoogle && !hasDevLogin && (
          <p className="card text-center text-sm text-critical">
            No sign-in method is configured yet. Set up Google/Facebook/Apple OAuth or enable
            dev login (see .env.example).
          </p>
        )}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
