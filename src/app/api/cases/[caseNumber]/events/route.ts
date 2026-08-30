import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { AssignmentStatus, CaseOutcomeType, CaseStatus, UserRoleName } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { saveCasePhoto } from '@/lib/storage';
import { applyCaseTransition } from '@/lib/case-events';

const RESPONDER_ROLES: UserRoleName[] = [
  UserRoleName.RESCUER,
  UserRoleName.AMBULANCE,
  UserRoleName.NGO,
  UserRoleName.VET,
];

const BodySchema = z.object({
  targetStatus: z.nativeEnum(CaseStatus),
  outcomeType: z.nativeEnum(CaseOutcomeType).optional(),
  outcomeReason: z.string().optional(),
  note: z.string().optional(),
});

/**
 * Status transitions for network roles (build brief §6/§8/§11: rescuer
 * sequential proof buttons, vet outcome buttons, etc).
 *
 * Authorization here is deliberately minimal for the pilot: any
 * verified responder role may ACCEPT an open case (first-come, matching
 * §5's "eligible responders" pool the Command Center dispatches from);
 * every subsequent transition requires being the case's accepted
 * responder, or ADMIN. This needs hardening (org-scoped assignment,
 * capacity checks) before real dispatch volume — see README.
 */
export async function POST(request: NextRequest, { params }: { params: { caseNumber: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }

  const isResponder = session.user.roles.some((r) => RESPONDER_ROLES.includes(r));
  const isAdmin = session.user.roles.includes(UserRoleName.ADMIN);
  if (!isResponder && !isAdmin) {
    return NextResponse.json({ error: 'Only verified network roles can update case status.' }, { status: 403 });
  }

  const contentType = request.headers.get('content-type') ?? '';
  let body: z.infer<typeof BodySchema>;
  let photoUrl: string | null = null;

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    body = BodySchema.parse(Object.fromEntries(formData.entries()));
    const photoFile = formData.get('photo');
    if (photoFile instanceof File && photoFile.size > 0) {
      const buffer = Buffer.from(await photoFile.arrayBuffer());
      photoUrl = await saveCasePhoto(buffer, photoFile.type || 'image/jpeg');
    }
  } else {
    body = BodySchema.parse(await request.json());
  }

  const kase = await db.case.findUnique({ where: { caseNumber: params.caseNumber } });
  if (!kase) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }

  if (body.targetStatus === CaseStatus.ACCEPTED) {
    if (kase.status !== CaseStatus.TRIAGED) {
      return NextResponse.json({ error: 'Case is not open for acceptance.' }, { status: 409 });
    }
    if (!isAdmin && session.user.verificationTier === 'NONE') {
      return NextResponse.json({ error: 'Only verified responders can accept cases.' }, { status: 403 });
    }
    await db.assignment.create({
      data: {
        caseId: kase.id,
        responderUserId: session.user.id,
        status: AssignmentStatus.ACCEPTED,
        respondedAt: new Date(),
      },
    });
  } else if (!isAdmin) {
    const acceptedAssignment = await db.assignment.findFirst({
      where: { caseId: kase.id, responderUserId: session.user.id, status: AssignmentStatus.ACCEPTED },
    });
    if (!acceptedAssignment) {
      return NextResponse.json(
        { error: 'Only the responder who accepted this case can update it further.' },
        { status: 403 }
      );
    }
  }

  const actorRole =
    session.user.roles.find((r) => RESPONDER_ROLES.includes(r)) ?? UserRoleName.ADMIN;

  try {
    const updated = await applyCaseTransition({
      caseId: kase.id,
      actorId: session.user.id,
      actorRole,
      targetStatus: body.targetStatus,
      photoUrl,
      outcomeType: body.outcomeType,
      outcomeReason: body.outcomeReason,
      note: body.note,
    });
    return NextResponse.json({ status: updated.status });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Transition failed' }, { status: 400 });
  }
}
