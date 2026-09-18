import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { VerificationStatus, VerificationTier } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { findNgoOrVetMembership } from '@/lib/org-membership';

const BodySchema = z.object({ upiHandle: z.string().min(3).max(100) });

/**
 * Tier 3 request (build brief §2/§11): a VERIFIED org asks to also be
 * PAYMENT_APPROVED so it can run fundraisers (fundraiser/route.ts gates
 * on Organisation.paymentApprovedAt, only ever set by the Command Center
 * decision route once an admin approves this).
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }

  const membership = await findNgoOrVetMembership(session.user.id);
  if (!membership) {
    return NextResponse.json({ error: 'You are not a member of a verified organisation.' }, { status: 403 });
  }

  const parsed = BodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existingPending = await db.verification.findFirst({
    where: {
      organisationId: membership.organisationId,
      targetTier: VerificationTier.PAYMENT_APPROVED,
      status: VerificationStatus.PENDING,
    },
  });
  if (existingPending) {
    return NextResponse.json({ error: 'A payment-approval request is already pending review.' }, { status: 409 });
  }

  await db.$transaction([
    db.organisation.update({
      where: { id: membership.organisationId },
      data: { upiHandle: parsed.data.upiHandle },
    }),
    db.verification.create({
      data: {
        organisationId: membership.organisationId,
        targetTier: VerificationTier.PAYMENT_APPROVED,
        documents: [],
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
