import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { AppHeader } from '@/components/AppHeader';

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Raksha Network — Animal rescue, coordinated',
  description:
    'One animal. One case. One coordinated response. Report, track, and fund animal rescue cases in Mumbai.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sans.variable}>
      <body className="min-h-screen bg-canvas font-sans text-zinc-900 antialiased">
        <Providers>
          <AppHeader />
          <div className="mx-auto max-w-3xl">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
