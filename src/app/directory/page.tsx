import { DirectoryCategory } from '@prisma/client';
import { db } from '@/lib/db';
import Link from 'next/link';
import { Clock, Search } from 'lucide-react';
import { CATEGORY_LABELS } from '@/lib/directory-categories';
import { DirectoryView } from '@/components/DirectoryView';

export const dynamic = 'force-dynamic';

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: { category?: string; open24x7?: string };
}) {
  const category = searchParams.category as DirectoryCategory | undefined;
  const open24x7 = searchParams.open24x7 === 'true';

  const listings = await db.directoryListing.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(open24x7 ? { isOpen24x7: true } : {}),
    },
    include: { organisation: true },
    orderBy: [{ organisationId: 'desc' }, { name: 'asc' }],
    take: 100,
  });

  const items = listings.map((l) => ({
    id: l.id,
    name: l.name,
    category: l.category,
    area: l.area,
    latitude: l.latitude,
    longitude: l.longitude,
    phone: l.phone,
    hours: l.hours,
    isOpen24x7: l.isOpen24x7,
    claimed: Boolean(l.claimedAt),
    verified: Boolean(l.organisation && l.organisation.verificationTier !== 'NONE'),
  }));

  return (
    <main className="flex flex-col gap-5 px-4 pb-16 pt-6">
      <header className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-50 text-success">
          <Search className="h-4.5 w-4.5" />
        </span>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-zinc-900">Network directory</h1>
          <p className="text-sm text-zinc-500">Verified rescue network ranks first</p>
        </div>
      </header>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <CategoryChip label="All" href="/directory" active={!category} />
        {(Object.keys(CATEGORY_LABELS) as DirectoryCategory[]).map((c) => (
          <CategoryChip key={c} label={CATEGORY_LABELS[c]} href={`/directory?category=${c}`} active={category === c} />
        ))}
      </div>

      <Link
        href={category ? `/directory?category=${category}&open24x7=true` : '/directory?open24x7=true'}
        className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
          open24x7 ? 'border-critical bg-red-50 text-critical' : 'border-zinc-200 text-zinc-500'
        }`}
      >
        <Clock className="h-3.5 w-3.5" /> Open 24×7
      </Link>

      <DirectoryView listings={items} />
    </main>
  );
}

function CategoryChip({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
        active ? 'border-critical bg-red-50 text-critical' : 'border-zinc-200 text-zinc-500'
      }`}
    >
      {label}
    </Link>
  );
}
