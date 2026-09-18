import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { DirectoryCategory } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

const CATEGORY_MAP: Record<'NGO' | 'VET', DirectoryCategory> = {
  NGO: DirectoryCategory.NGO,
  VET: DirectoryCategory.VET,
};

/**
 * Search over unclaimed directory listings (organisationId still null —
 * e.g. the bulk-imported real Mumbai dataset) so a real NGO/vet signing
 * up can claim their own existing entry instead of creating a
 * duplicate. Requires a real search term so this can't be used to list
 * the whole directory.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }

  const category = request.nextUrl.searchParams.get('category');
  const q = request.nextUrl.searchParams.get('q')?.trim();
  if (category !== 'NGO' && category !== 'VET') {
    return NextResponse.json({ error: 'Invalid category.' }, { status: 400 });
  }
  if (!q || q.length < 2) {
    return NextResponse.json({ listings: [] });
  }

  const listings = await db.directoryListing.findMany({
    where: {
      organisationId: null,
      category: CATEGORY_MAP[category],
      name: { contains: q, mode: 'insensitive' },
    },
    select: { id: true, name: true, area: true, phone: true },
    take: 10,
  });

  return NextResponse.json({ listings });
}
