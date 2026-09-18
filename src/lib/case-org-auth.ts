import { db } from './db';

/**
 * Shared by every provider-portal route that acts "as the org treating
 * this case" (updates, documents, fundraiser, and the org branch of
 * events/route.ts) — true only when the case already has a receiving
 * org AND the caller is a member of exactly that org. Being staff of
 * some other org, or of no org, is never sufficient.
 */
export async function isReceivingOrgMember(
  userId: string,
  receivingOrganisationId: string | null
): Promise<boolean> {
  if (!receivingOrganisationId) return false;
  const membership = await db.organisationMember.findFirst({
    where: { userId, organisationId: receivingOrganisationId },
    select: { id: true },
  });
  return membership != null;
}
