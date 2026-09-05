'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { LogoMark } from './Logo';

const NAV_LINKS = [
  { href: '/feed', label: 'Live feed' },
  { href: '/directory', label: 'Directory' },
  { href: '/stats', label: 'Stats' },
];

export function AppHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // The report flow gets its own minimal in-flow header — every extra
  // pixel of chrome is friction for someone reporting an emergency
  // one-thumbed. Same for the bare sign-in screen.
  if (pathname?.startsWith('/report') || pathname?.startsWith('/login')) return null;

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-info">
          <LogoMark className="h-6 w-6" />
          <span className="text-[15px] font-bold tracking-tight text-zinc-900">Raksha Network</span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-zinc-500 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname === link.href ? 'text-zinc-900' : 'hover:text-zinc-900'}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {session?.user ? (
            <span className="hidden text-sm font-medium text-zinc-500 sm:inline">
              {session.user.name}
            </span>
          ) : (
            <button
              onClick={() => signIn(undefined, { callbackUrl: pathname })}
              className="hidden text-sm font-semibold text-info sm:inline"
            >
              Sign in
            </button>
          )}
          <Link
            href="/report"
            className="rounded-full bg-critical px-4 py-2 text-sm font-bold text-white shadow-sm shadow-red-900/10 transition active:scale-95"
          >
            Report
          </Link>
        </div>
      </div>
    </header>
  );
}
