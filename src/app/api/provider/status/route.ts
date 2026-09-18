import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { VerificationStatus, VerificationTier } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * Drives which of the three /provider states to render: onboarding form
 * (no org yet), pending-verification message (org exists, tier NONE),
 * or the full dashboard (verified). Also reports whether a payment-
 * approval request is pending, so the dashboard can distinguish
 * "not requested yet" from "waiting on admin".
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }

  const membership = await db.organisationMember.findFirst({
    where: { userId: session.user.id },
    include: { organisation: true },
  });

  if (!membership) {
    return NextResponse.json({ hasOrg: false });
  }

  const pendingPaymentApproval = await db.verification.findFirst({
    where: {
      organisationId: membership.organisationId,
      targetTier: VerificationTier.PAYMENT_APPROVED,
      status: VerificationStatus.PENDING,
    },
  });

  return NextResponse.json({
    hasOrg: true,
    organisation: {
      id: membership.organisation.id,
      name: membership.organisation.name,
      type: membership.organisation.type,
      verificationTier: membership.organisation.verificationTier,
      paymentApproved: Boolean(membership.organisation.paymentApprovedAt),
      paymentApprovalPending: Boolean(pendingPaymentApproval),
    },
  });
}
