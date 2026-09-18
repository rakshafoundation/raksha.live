import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { AssignmentStatus, CaseStatus, UserRoleName } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { findNearestHelp } from '@/lib/nearest-help';
import { isReceivingOrgMember } from '@/lib/case-org-auth';

const RESPONDER_ROLES: UserRoleName[] = [
  UserRoleName.RESCUER,
  UserRoleName.AMBULANCE,
  UserRoleName.NGO,
  UserRoleName.VET,
];

/**
 * Network-view case detail: exact GPS + reporter phone + AI handling
 * guidance, for the assigned responder (or any responder previewing an
 * still-open case before accepting) — build brief §3 "network view".
 * Never used for the public case page; see src/lib/public-projection.ts
 * for that boundary.
 */
export async function GET(_request: NextRequest, { params }: { params: { caseNumber: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }
  const isResponder = session.user.roles.some((r) => RESPONDER_ROLES.includes(r));
  const isAdmin = session.user.roles.includes(UserRoleName.ADMIN);
  if (!isResponder && !isAdmin) {
    return NextResponse.json({ error: 'Network role required.' }, { status: 403 });
  }

  const kase = await db.case.findUnique({
    where: { caseNumber: params.caseNumber },
    include: {
      reporter: { select: { name: true, phone: true } },
      aiAssessments: { orderBy: { createdAt: 'desc' }, take: 1 },
      assignments: { where: { status: AssignmentStatus.ACCEPTED } },
      photos: true,
      receivingOrganisation: { select: { name: true } },
      updates: { include: { organisation: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
      documents: { include: { organisation: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
    },
  });
  if (!kase) return NextResponse.json({ error: 'Case not found' }, { status: 404 });

  const isOpenForPreview = kase.status === CaseStatus.TRIAGED;
  const isMyAssignment = kase.assignments.some((a) => a.responderUserId === session.user.id);
  const isMyReceivingOrg = await isReceivingOrgMember(session.user.id, kase.receivingOrganisationId);
  if (!isAdmin && !isOpenForPreview && !isMyAssignment && !isMyReceivingOrg) {
    return NextResponse.json({ error: 'Not assigned to this case.' }, { status: 403 });
  }

  // Only worth showing nearby options once there's actually a decision
  // left to make — once a receiving org exists, that's where to go.
  const nearestHelp = kase.receivingOrganisation
    ? []
    : await findNearestHelp({ latitude: kase.latitude, longitude: kase.longitude }, 5, kase.receivingOrganisationId);

  return NextResponse.json({
    caseNumber: kase.caseNumber,
    animalName: kase.animalName,
    species: kase.species,
    injuryType: kase.injuryType,
    status: kase.status,
    outcomeType: kase.outcomeType,
    latitude: kase.latitude,
    longitude: kase.longitude,
    area: kase.area,
    reporter: { name: kase.reporter.name, phone: kase.reporter.phone },
    assessment: kase.aiAssessments[0] ?? null,
    photos: kase.photos.map((p) => p.url),
    receivingOrganisationId: kase.receivingOrganisationId,
    receivingOrganisationName: kase.receivingOrganisation?.name ?? null,
    isMyReceivingOrg,
    nearestHelp,
    updates: kase.updates.map((u) => ({
      id: u.id,
      organisationName: u.organisation.name,
      message: u.message,
      photoUrl: u.photoUrl,
      createdAt: u.createdAt,
    })),
    documents: kase.documents.map((d) => ({
      id: d.id,
      organisationName: d.organisation.name,
      label: d.label,
      url: d.url,
      createdAt: d.createdAt,
    })),
    fundraiser:
      kase.fundraisingGoalAmount != null
        ? {
            goalAmount: kase.fundraisingGoalAmount,
            raisedAmount: kase.fundraisingRaisedAmount ?? 0,
            paymentLink: kase.fundraisingPaymentLink,
          }
        : null,
  });
}
