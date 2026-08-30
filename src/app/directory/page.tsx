import { DirectoryCategory } from '@prisma/client';
import { db } from '@/lib/db';
import Link from 'next/link';

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
    <main className="flex flex-col gap-4 p-4 pb-16">
      <h1 className="text-xl font-bold">Network directory</h1>

      <div className="flex flex-wrap gap-2">
        <CategoryChip label="All" href="/directory" active={!category} />
        {(Object.keys(CATEGORY_LABELS) as DirectoryCategory[]).map((c) => (
          <CategoryChip key={c} label={CATEGORY_LABELS[c]} href={`/directory?category=${c}`} active={category === c} />
        ))}
      </div>

      <Link
        href={category ? `/directory?category=${category}&open24x7=true` : '/directory?open24x7=true'}
        className={`self-start rounded-full border px-3 py-1 text-sm ${open24x7 ? 'border-critical bg-red-50 text-critical' : 'border-zinc-300'}`}
      >
        Open 24×7
      </Link>

      <div className="flex flex-col gap-2">
        {listings.length === 0 && <p className="text-zinc-500">No listings yet — seed the directory from the 89-practice base (see prisma/seed.ts).</p>}
        {listings.map((l) => (
          <div key={l.id} className="card">
            <div className="flex items-center justify-between">
              <span className="font-semibold">
                {l.name} {l.organisation && l.organisation.verificationTier !== 'NONE' && '✓'}
              </span>
              {l.isOpen24x7 && <span className="text-xs font-bold text-success">OPEN 24×7</span>}
            </div>
            <p className="text-sm text-zinc-500">
              {CATEGORY_LABELS[l.category]} · {l.area}
              {l.claimedAt && ' · Claimed'}
            </p>
            <a href={`tel:${l.phone}`} className="mt-1 inline-block text-sm text-info">
              {l.phone}
            </a>
          </div>
        ))}
      </div>
    </main>
  );
}

function CategoryChip({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-sm ${active ? 'border-critical bg-red-50 text-critical' : 'border-zinc-300'}`}
    >
      {label}
    </Link>
  );
}
