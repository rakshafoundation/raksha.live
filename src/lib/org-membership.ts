import { Organisation, OrganisationType, VerificationTier } from '@prisma/client';
import { db } from './db';

/**
 * Resolves the caller's verified NGO/vet organisation membership. Shared
 * by every route that acts "as an org" (accept-receiving, capacity
 * updates, the intake/animals-in-care queues) so the eligibility rule
 * lives in one place: a verified OrganisationMember of an NGO_SHELTER or
 * VET_HOSPITAL org with VERIFIED/PAYMENT_APPROVED tier.
 *
 * Returns the first matching membership — most staff belong to one org.
 * A user with multiple org memberships would need an explicit picker,
 * which isn't built yet.
 */
export async function findNgoOrVetMembership(
  userId: string
): Promise<{ organisationId: string; organisation: Organisation } | null> {
  const membership = await db.organisationMember.findFirst({
    where: {
      userId,
      organisation: {
        type: { in: [OrganisationType.NGO_SHELTER, OrganisationType.VET_HOSPITAL] },
        verificationTier: { in: [VerificationTier.VERIFIED, VerificationTier.PAYMENT_APPROVED] },
      },
    },
    include: { organisation: true },
  });
  if (!membership) return null;
  return { organisationId: membership.organisationId, organisation: membership.organisation };
}
