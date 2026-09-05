'use client';

import { signIn } from 'next-auth/react';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { LogoMark } from '@/components/Logo';

function LoginForm() {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') ?? '/';

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 px-4 pb-16 pt-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <LogoMark className="h-10 w-10 text-info" />
        <h1 className="text-xl font-extrabold tracking-tight text-zinc-900">Sign in to Raksha Network</h1>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          onClick={() => signIn('google', { callbackUrl })}
          className="btn-secondary shadow-soft"
        >
          Continue with Google
        </button>

        {process.env.NEXT_PUBLIC_DEV_LOGIN_ENABLED === 'true' && (
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
