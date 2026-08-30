import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Raksha Network — Animal rescue, coordinated',
  description:
    'One animal. One case. One coordinated response. Report, track, and fund animal rescue cases in Mumbai.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="mx-auto min-h-screen max-w-3xl">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
