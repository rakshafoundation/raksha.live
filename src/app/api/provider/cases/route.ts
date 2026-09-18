import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { CaseStatus } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { findNgoOrVetMembership } from '@/lib/org-membership';

/**
 * Cases this org is treating (accept-receiving already claimed them),
 * for the /provider dashboard's "My cases" list. Includes closed cases
 * too, capped and most-recent-first, so a case doesn't just vanish from
 * view the moment it closes.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }

  const membership = await findNgoOrVetMembership(session.user.id);
  if (!membership) {
    return NextResponse.json({ error: 'You are not a verified member of an NGO or vet/hospital organisation.' }, { status: 403 });
  }

  const cases = await db.case.findMany({
    where: { receivingOrganisationId: membership.organisationId },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 50,
    select: {
      caseNumber: true,
      animalName: true,
      status: true,
      outcomeType: true,
      fundraisingGoalAmount: true,
      fundraisingRaisedAmount: true,
    },
  });

  return NextResponse.json({
    cases: cases.map((c) => ({ ...c, isActive: c.status !== CaseStatus.CLOSED })),
  });
}
