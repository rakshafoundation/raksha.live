import { DirectoryCategory } from '@prisma/client';
import { db } from './db';

export interface DirectoryListingInput {
  name: string;
  category: DirectoryCategory;
  area: string;
  latitude: number;
  longitude: number;
  phone: string;
  hours?: string | null;
  isOpen24x7?: boolean;
}

/**
 * Shared by the single-add route (src/app/api/admin/directory/route.ts)
 * and the bulk importer (src/app/api/admin/directory/bulk-import/route.ts)
 * so both get the same idempotency guarantee: re-adding the same
 * name+category within ~100m skips instead of duplicating, which is what
 * makes the bulk importer safe to re-run after a partial batch.
 */
export async function createDirectoryListingIfNew(
  data: DirectoryListingInput
): Promise<{ id: string; created: boolean }> {
  const nearbyMatch = await db.directoryListing.findFirst({
    where: {
      category: data.category,
      name: { equals: data.name, mode: 'insensitive' },
      latitude: { gte: data.latitude - 0.001, lte: data.latitude + 0.001 },
      longitude: { gte: data.longitude - 0.001, lte: data.longitude + 0.001 },
    },
  });
  if (nearbyMatch) {
    return { id: nearbyMatch.id, created: false };
  }

  const listing = await db.directoryListing.create({ data });
  return { id: listing.id, created: true };
}
