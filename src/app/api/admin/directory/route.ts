import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DirectoryCategory } from '@prisma/client';
import { createDirectoryListingIfNew } from '@/lib/directory-admin';

/**
 * Adds a directory listing (real vets/NGOs/pharmacies/etc.), gated by a
 * shared secret rather than a logged-in ADMIN role. The role-based path
 * (see command-center) needs an ADMIN user to already exist, which today
 * only happens via prisma/seed.ts against a DB nobody but the deploy
 * pipeline can reach — this route is the practical way to seed real data
 * into a live deployment without a direct DB connection or a bootstrapping
 * chicken-and-egg problem. Never wire this to write anything beyond public
 * directory listings.
 */
const ListingSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.nativeEnum(DirectoryCategory),
  area: z.string().min(1).max(200),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  phone: z.string().min(1).max(40),
  hours: z.string().max(200).optional().nullable(),
  isOpen24x7: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.ADMIN_DIRECTORY_SECRET;
  if (!expectedSecret) {
    return NextResponse.json({ error: 'ADMIN_DIRECTORY_SECRET is not configured on the server.' }, { status: 503 });
  }
  if (request.headers.get('x-admin-secret') !== expectedSecret) {
    return NextResponse.json({ error: 'Invalid or missing admin secret.' }, { status: 403 });
  }

  const parsed = ListingSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id, created } = await createDirectoryListingIfNew(parsed.data);
  return NextResponse.json(created ? { id } : { id, skipped: 'duplicate' });
}
