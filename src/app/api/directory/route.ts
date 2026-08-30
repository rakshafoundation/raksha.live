import { NextRequest, NextResponse } from 'next/server';
import { DirectoryCategory } from '@prisma/client';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const area = searchParams.get('area');
  const q = searchParams.get('q');
  const open24x7 = searchParams.get('open24x7') === 'true';

  const listings = await db.directoryListing.findMany({
    where: {
      ...(category ? { category: category as DirectoryCategory } : {}),
      ...(area ? { area } : {}),
      ...(open24x7 ? { isOpen24x7: true } : {}),
      ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
    },
    include: { organisation: true },
    orderBy: [{ organisationId: 'desc' }, { name: 'asc' }], // verified rescue-network orgs (have organisationId) rank first
    take: 100,
  });

  return NextResponse.json({
    listings: listings.map((l) => ({
      id: l.id,
      name: l.name,
      category: l.category,
      area: l.area,
      phone: l.phone,
      hours: l.hours,
      isOpen24x7: l.isOpen24x7,
      claimed: Boolean(l.claimedAt),
      verified: Boolean(l.organisation && l.organisation.verificationTier !== 'NONE'),
    })),
  });
}
