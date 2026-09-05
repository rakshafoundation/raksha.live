import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { AssignmentStatus, CaseStatus, UserRoleName } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { findNgoOrVetMembership } from '@/lib/org-membership';

const ALREADY_CLAIMED = 'ALREADY_CLAIMED';

/**
 * An NGO or vet/hospital claims responsibility for TREATING a case —
 * independent of whichever rescuer (if any) does the physical pickup.
 * This is what lets a rescuer know where to bring the animal (build
 * brief §7 screens 12/13: NGO "accept intake", Vet "Admit").
 *
 * First-come, like the rescuer accept flow: once a receiving org is set,
 * a second org cannot claim the same case. Deliberately independent of
 * CaseStatus — a case can be claimed for treatment at any point before
 * it's closed, whether or not a rescuer has picked it up yet.
 */
export async function POST(_request: NextRequest, { params }: { params: { caseNumber: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }
  if (!session.user.roles.some((r) => r === UserRoleName.NGO || r === UserRoleName.VET)) {
    return NextResponse.json({ error: 'Only NGO/vet staff can accept a case for treatment.' }, { status: 403 });
  }

  const membership = await findNgoOrVetMembership(session.user.id);
  if (!membership) {
    return NextResponse.json(
      { error: 'You are not a verified member of an NGO or vet/hospital organisation.' },
      { status: 403 }
    );
  }

  const kase = await db.case.findUnique({ where: { caseNumber: params.caseNumber } });
  if (!kase) return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  if (kase.status === CaseStatus.CLOSED) {
    return NextResponse.json({ error: 'Case is already closed.' }, { status: 409 });
  }

  try {
    await db.$transaction(async (tx) => {
      // Re-check inside the transaction to close the race between an
      // earlier read and this write — two orgs accepting at once.
      const fresh = await tx.case.findUnique({
        where: { id: kase.id },
        select: { receivingOrganisationId: true },
      });
      if (fresh?.receivingOrganisationId && fresh.receivingOrganisationId !== membership.organisationId) {
        throw new Error(ALREADY_CLAIMED);
      }

      await tx.case.update({
        where: { id: kase.id },
        data: { receivingOrganisationId: membership.organisationId },
      });

      const existingAssignment = await tx.assignment.findFirst({
        where: { caseId: kase.id, organisationId: membership.organisationId },
        select: { id: true },
      });
      if (existingAssignment) {
        await tx.assignment.update({
          where: { id: existingAssignment.id },
          data: { status: AssignmentStatus.ACCEPTED, respondedAt: new Date() },
        });
      } else {
        await tx.assignment.create({
          data: {
            caseId: kase.id,
            organisationId: membership.organisationId,
            status: AssignmentStatus.ACCEPTED,
            respondedAt: new Date(),
          },
        });
      }
    });
  } catch (e) {
    if (e instanceof Error && e.message === ALREADY_CLAIMED) {
      return NextResponse.json({ error: 'Another organisation has already accepted this case.' }, { status: 409 });
    }
    throw e;
  }

  return NextResponse.json({ receivingOrganisation: membership.organisation.name });
}
