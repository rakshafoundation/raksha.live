import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { isReceivingOrgMember } from '@/lib/case-org-auth';

const BodySchema = z.object({
  goalAmount: z.coerce.number().int().positive().max(10_000_000),
  raisedAmount: z.coerce.number().int().min(0).max(10_000_000),
  paymentLink: z.string().url().max(500),
});

/**
 * Redirect-only fundraising (build brief §11 non-negotiable: "platform
 * holds no funds"). This only ever stores a goal, a self-reported
 * running total, and a link to the org's own payment page — donors are
 * sent there to actually pay, never handled by this platform.
 *
 * Gated on Organisation.paymentApprovedAt exactly as the brief specifies
 * ("Contribute button gated on payment-approved flag, server-side") —
 * an org that hasn't had its payment details admin-approved cannot set
 * up a fundraiser here, full stop.
 */
export async function POST(request: NextRequest, { params }: { params: { caseNumber: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }

  const kase = await db.case.findUnique({ where: { caseNumber: params.caseNumber } });
  if (!kase) return NextResponse.json({ error: 'Case not found' }, { status: 404 });

  if (!(await isReceivingOrgMember(session.user.id, kase.receivingOrganisationId))) {
    return NextResponse.json({ error: 'Only the organisation treating this case can manage its fundraiser.' }, { status: 403 });
  }

  const org = await db.organisation.findUnique({ where: { id: kase.receivingOrganisationId! } });
  if (!org?.paymentApprovedAt) {
    return NextResponse.json(
      { error: 'Your organisation’s payment details must be admin-approved before you can raise funds.' },
      { status: 403 }
    );
  }

  const parsed = BodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await db.case.update({
    where: { id: kase.id },
    data: {
      fundraisingGoalAmount: parsed.data.goalAmount,
      fundraisingRaisedAmount: parsed.data.raisedAmount,
      fundraisingPaymentLink: parsed.data.paymentLink,
    },
  });

  return NextResponse.json({ ok: true });
}
