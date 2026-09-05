import { DirectoryCategory } from '@prisma/client';
import { db } from '@/lib/db';
import Link from 'next/link';
import { BadgeCheck, Clock, PhoneCall, Search } from 'lucide-react';

export const dynamic = 'force-dynamic';

const CATEGORY_LABELS: Record<DirectoryCategory, string> = {
  NGO: 'NGOs',
  VET: 'Vets',
  VET_LAB_DIAGNOSTICS: 'Vet labs & diagnostics',
  VET_PHARMACY: 'Veterinary pharmacies',
  PET_FOOD_STORE: 'Pet food stores',
  PET_FRIENDLY_CAFE: 'Pet-friendly cafes',
  TOY_ACCESSORY_SHOP: 'Toy & accessory shops',
  GROOMER: 'Groomers',
  BOARDING: 'Boarding',
  TRAINER: 'Trainers',
};

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

      <div className="flex flex-col gap-2.5">
        {listings.length === 0 && (
          <p className="card text-center text-sm text-zinc-400">
            No listings yet — seed the directory from the 89-practice base (see prisma/seed.ts).
          </p>
        )}
        {listings.map((l) => {
          const verified = Boolean(l.organisation && l.organisation.verificationTier !== 'NONE');
          return (
            <div key={l.id} className="card">
              <div className="flex items-start justify-between gap-2">
                <span className="flex items-center gap-1.5 font-bold text-zinc-900">
                  {l.name}
                  {verified && <BadgeCheck className="h-4 w-4 shrink-0 text-info" />}
                </span>
                {l.isOpen24x7 && (
                  <span className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-bold text-success">
                    OPEN 24×7
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-zinc-500">
                {CATEGORY_LABELS[l.category]} · {l.area}
                {l.claimedAt && (
                  <span className="ml-1.5 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[11px] font-semibold text-zinc-500">
                    Claimed
                  </span>
                )}
              </p>
              <a href={`tel:${l.phone}`} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-info">
                <PhoneCall className="h-3.5 w-3.5" /> {l.phone}
              </a>
            </div>
          );
        })}
      </div>
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
