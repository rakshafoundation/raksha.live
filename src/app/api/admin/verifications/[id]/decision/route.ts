import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { UserRoleName, VerificationStatus } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * Verification queue decision (build brief §11 Command Center). "No tick
 * without documents — no exceptions" is enforced by process, not code: an
 * admin must open and check the documents before calling this, which is
 * why this route only ever records the decision, never auto-approves.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.roles.includes(UserRoleName.ADMIN)) {
    return NextResponse.json({ error: 'Admin only.' }, { status: 403 });
  }

  const { approve, rejectionReason } = await request.json();
  const verification = await db.verification.findUnique({ where: { id: params.id } });
  if (!verification) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.verification.update({
    where: { id: params.id },
    data: {
      status: approve ? VerificationStatus.APPROVED : VerificationStatus.REJECTED,
      reviewedByAdminId: session.user.id,
      reviewedAt: new Date(),
      rejectionReason: approve ? null : rejectionReason,
    },
  });

  if (approve) {
    if (verification.userId) {
      await db.user.update({
        where: { id: verification.userId },
        data: { verificationTier: verification.targetTier },
      });
    }
    if (verification.organisationId) {
      await db.organisation.update({
        where: { id: verification.organisationId },
        data: { verificationTier: verification.targetTier },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
