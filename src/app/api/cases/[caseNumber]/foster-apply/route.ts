import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { CaseStatus, FosterPlacementStatus, UserRoleName } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * Foster applies to take in an animal — build brief §9 Foster view:
 * "matched 'needs foster' feed with Apply". Deliberately gated to
 * RECOVERY-status cases only: fostering is a post-treatment placement,
 * not an emergency-response role, so this is a different mechanism from
 * the rescuer/NGO/vet "accept" flows on a fresh report (see
 * accept-receiving/route.ts for why those are separate).
 *
 * NGO approval of the application (FosterPlacementStatus APPLIED ->
 * APPROVED) is a Command Center / NGO-dashboard action, not built yet.
 */
export async function POST(_request: NextRequest, { params }: { params: { caseNumber: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }
  if (!session.user.roles.includes(UserRoleName.FOSTER)) {
    return NextResponse.json({ error: 'Only registered fosters can apply.' }, { status: 403 });
  }

  const kase = await db.case.findUnique({ where: { caseNumber: params.caseNumber } });
  if (!kase) return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  if (kase.status !== CaseStatus.RECOVERY) {
    return NextResponse.json(
      { error: 'This case is not yet at the recovery stage — fostering opens once treatment is complete.' },
      { status: 409 }
    );
  }

  const existing = await db.fosterPlacement.findFirst({
    where: { caseId: kase.id, fosterId: session.user.id },
  });
  if (existing) {
    return NextResponse.json({ placementId: existing.id, alreadyApplied: true });
  }

  const placement = await db.fosterPlacement.create({
    data: {
      caseId: kase.id,
      fosterId: session.user.id,
      status: FosterPlacementStatus.APPLIED,
    },
  });

  return NextResponse.json({ placementId: placement.id, alreadyApplied: false });
}
