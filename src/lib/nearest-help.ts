import { OrganisationType, VerificationTier } from '@prisma/client';
import { db } from './db';
import { distanceMeters, type LatLng } from './geo';

export interface NearestHelpEntry {
  organisationId: string;
  name: string;
  type: OrganisationType;
  distanceMeters: number;
  phone: string;
  available: boolean;
}

/**
 * Nearest-help auto-list shown directly below the AI assessment (build
 * brief §4a): verified ambulances/vets/NGOs sorted by distance × live
 * availability. "Available" reads OrgCapacity toggles where present;
 * an organisation with no capacity row yet is treated as unknown, not
 * unavailable, so it still surfaces (sorted after known-available ones).
 */
export async function findNearestHelp(
  location: LatLng,
  limit = 5
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
      };
    })
    .sort((a, b) => {
      if (a.available !== b.available) return a.available ? -1 : 1;
      return a.distanceMeters - b.distanceMeters;
    })
    .slice(0, limit);
}
