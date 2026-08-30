'use client';

import { signIn } from 'next-auth/react';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function LoginForm() {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') ?? '/';

  return (
    <main className="flex flex-col gap-6 p-4 pt-12">
      <h1 className="text-xl font-bold">Sign in to Raksha Network</h1>

      <button
        onClick={() => signIn('google', { callbackUrl })}
        className="rounded-card border border-zinc-300 bg-white px-4 py-3 font-medium"
      >
        Continue with Google
      </button>

      {process.env.NEXT_PUBLIC_DEV_LOGIN_ENABLED === 'true' && (
        <div className="card flex flex-col gap-3">
          <p className="text-xs text-zinc-500">
            Dev login — phone only, no OTP. For local testing only; production
            requires OTP verification.
          </p>
          <input
            className="rounded-card border border-zinc-300 p-3"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="rounded-card border border-zinc-300 p-3"
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
