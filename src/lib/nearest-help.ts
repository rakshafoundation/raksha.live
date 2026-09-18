import { DirectoryCategory, OrganisationType, VerificationTier } from '@prisma/client';
import { db } from './db';
import { distanceMeters, type LatLng } from './geo';

export interface NearestHelpEntry {
  organisationId: string;
  name: string;
  type: OrganisationType;
  distanceMeters: number;
  phone: string;
  available: boolean;
  acceptedToReceive: boolean;
}

/**
 * Nearest-help auto-list shown directly below the AI assessment (build
 * brief §4a): verified ambulances/vets/NGOs sorted by distance × live
 * availability. "Available" reads OrgCapacity toggles where present;
 * an organisation with no capacity row yet is treated as unknown, not
 * unavailable, so it still surfaces (sorted after known-available ones).
 *
 * `receivingOrganisationId`, when passed, flags whichever org has
 * already committed to treating this specific case (see
 * accept-receiving/route.ts) — that entry is pinned first regardless of
 * distance, since "who already said yes" matters more than "who's
 * closest" once someone has actually said yes.
 */
export async function findNearestHelp(
  location: LatLng,
  limit = 5,
  receivingOrganisationId?: string | null
): Promise<NearestHelpEntry[]> {
  const orgs = await db.organisation.findMany({
    where: { verificationTier: { in: [VerificationTier.VERIFIED, VerificationTier.PAYMENT_APPROVED] } },
    include: { capacity: true },
  });

  return orgs
    .map((org) => {
      const distance = distanceMeters(location, { latitude: org.latitude, longitude: org.longitude });
      const available =
        org.type === OrganisationType.AMBULANCE_OPERATOR
          ? (org.capacity?.ambulanceFree ?? true)
          : (org.capacity?.acceptingEmergencies ?? true);
      return {
        organisationId: org.id,
        name: org.name,
        type: org.type,
        distanceMeters: Math.round(distance),
        phone: org.phone,
        available,
        acceptedToReceive: org.id === receivingOrganisationId,
      };
    })
    .sort((a, b) => {
      if (a.acceptedToReceive !== b.acceptedToReceive) return a.acceptedToReceive ? -1 : 1;
      if (a.available !== b.available) return a.available ? -1 : 1;
      return a.distanceMeters - b.distanceMeters;
    })
    .slice(0, limit);
}

export interface NearbyDirectoryEntry {
  id: string;
  name: string;
  category: DirectoryCategory;
  area: string;
  distanceMeters: number;
  phone: string;
  isOpen24x7: boolean;
}

/**
 * The general Mumbai services directory (NGOs, vets, pharmacies,
 * ambulances, etc. — see prisma/seed.ts / src/lib/directory-seed-data.ts),
 * shown to a reporter right after AI triage as real, callable options
 * near them.
 *
 * Deliberately separate from findNearestHelp() above: that one is the
 * dispatch-eligible rescue-network list tied to this specific case
 * (acceptedToReceive, live capacity) and is often empty or tiny for any
 * given location since it only includes verified network members. This
 * one is informational — "here's who's actually nearby to call" — and
 * draws from the full public directory regardless of network membership.
 */
export async function findNearbyDirectoryListings(location: LatLng, limit = 6): Promise<NearbyDirectoryEntry[]> {
  const listings = await db.directoryListing.findMany();

  return listings
    .map((listing) => ({
      id: listing.id,
      name: listing.name,
      category: listing.category,
      area: listing.area,
      distanceMeters: Math.round(distanceMeters(location, { latitude: listing.latitude, longitude: listing.longitude })),
      phone: listing.phone,
      isOpen24x7: listing.isOpen24x7,
    }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, limit);
}
