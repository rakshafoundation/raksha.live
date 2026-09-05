import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { CaseStatus, OrganisationType, UserRoleName, VerificationTier } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { distanceMeters } from '@/lib/geo';

const STAGES_STILL_OPEN_FOR_INTAKE: CaseStatus[] = [
  CaseStatus.TRIAGED,
  CaseStatus.ACCEPTED,
  CaseStatus.ASSIGNED,
  CaseStatus.PICKED_UP,
];

/**
 * Incoming cases for an NGO/vet org — cases not yet at a destination
 * (AT_VET or later means somewhere has already taken them in), sorted by
 * distance from the org's own location. Cases this org has already
 * accepted are included and flagged so their "Admit" queue is visible in
 * the same list, not a separate screen.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }
  if (!session.user.roles.some((r) => r === UserRoleName.NGO || r === UserRoleName.VET)) {
    return NextResponse.json({ error: 'NGO/vet role required.' }, { status: 403 });
  }

  const membership = await db.organisationMember.findFirst({
    where: {
      userId: session.user.id,
      organisation: {
        type: { in: [OrganisationType.NGO_SHELTER, OrganisationType.VET_HOSPITAL] },
        verificationTier: { in: [VerificationTier.VERIFIED, VerificationTier.PAYMENT_APPROVED] },
      },
    },
    include: { organisation: true },
  });
  if (!membership) {
    return NextResponse.json(
      { error: 'You are not a verified member of an NGO or vet/hospital organisation.' },
      { status: 403 }
    );
  }
  const org = membership.organisation;

  const cases = await db.case.findMany({
    where: {
      status: { in: STAGES_STILL_OPEN_FOR_INTAKE },
      OR: [{ receivingOrganisationId: null }, { receivingOrganisationId: org.id }],
    },
    include: { aiAssessments: { orderBy: { createdAt: 'desc' }, take: 1 } },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });

  const withDistance = cases
    .map((c) => ({
      caseNumber: c.caseNumber,
      animalName: c.animalName,
      species: c.species,
      injuryType: c.injuryType,
      area: c.area,
      status: c.status,
      urgency: c.aiAssessments[0]?.urgency ?? null,
      acceptedByUs: c.receivingOrganisationId === org.id,
      distanceMeters: Math.round(
        distanceMeters({ latitude: org.latitude, longitude: org.longitude }, { latitude: c.latitude, longitude: c.longitude })
      ),
    }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  return NextResponse.json({ cases: withDistance, organisation: { name: org.name, type: org.type } });
}
