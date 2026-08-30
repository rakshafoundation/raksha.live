import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { CaseStatus, InjuryType, Species, UserRoleName } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { saveCasePhoto } from '@/lib/storage';
import { formatCaseNumber } from '@/lib/case-id';
import { runTriage } from '@/lib/ai/triage';
import { findNearestHelp } from '@/lib/nearest-help';
import { toPublicCase } from '@/lib/public-projection';

const CreateCaseSchema = z.object({
  animalName: z.string().min(1).max(60),
  species: z.nativeEnum(Species),
  injuryType: z.nativeEnum(InjuryType),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  area: z.string().min(1).max(80),
  // Present when the reporter confirmed "same animal" on the duplicate
  // interstitial — attaches them as a co-reporter instead of creating a
  // new case. This is the ONLY path that merges cases at creation time,
  // and it requires the reporter's own explicit confirmation (never an
  // automated merge) — see build brief §4b / §12.
  mergeIntoCaseNumber: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Sign in required to submit a report.' }, { status: 401 });
  }

  const formData = await request.formData();
  const parsed = CreateCaseSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  const photoFile = formData.get('photo');
  let photoUrl: string | null = null;
  let photoBuffer: Buffer | null = null;
  let photoMimeType: string | null = null;
  if (photoFile instanceof File && photoFile.size > 0) {
    photoBuffer = Buffer.from(await photoFile.arrayBuffer());
    photoMimeType = photoFile.type || 'image/jpeg';
    photoUrl = await saveCasePhoto(photoBuffer, photoMimeType);
  }

  // "Same animal — follow this case": add as co-reporter, never create a
  // second case, never silently merge without this explicit confirmation.
  if (input.mergeIntoCaseNumber) {
    const existing = await db.case.findUnique({ where: { caseNumber: input.mergeIntoCaseNumber } });
    if (!existing) {
      return NextResponse.json({ error: 'Case to follow not found.' }, { status: 404 });
    }
    await db.$transaction([
      db.caseFollower.upsert({
        where: { caseId_userId: { caseId: existing.id, userId: session.user.id } },
        update: {},
        create: { caseId: existing.id, userId: session.user.id },
      }),
      ...(photoUrl
        ? [
            db.casePhoto.create({
              data: { caseId: existing.id, url: photoUrl, uploadedByUserId: session.user.id },
            }),
          ]
        : []),
    ]);
    return NextResponse.json({ merged: true, caseNumber: existing.caseNumber }, { status: 200 });
  }

  const sequence = await db.caseSequence.upsert({
    where: { id: 1 },
    update: { value: { increment: 1 } },
    create: { id: 1, value: 1 },
  });
  const caseNumber = formatCaseNumber(sequence.value);

  const created = await db.case.create({
    data: {
      caseNumber,
      animalName: input.animalName,
      species: input.species,
      injuryType: input.injuryType,
      latitude: input.latitude,
      longitude: input.longitude,
      area: input.area,
      reporterId: session.user.id,
      status: CaseStatus.REPORTED,
      photos: photoUrl
        ? { create: [{ url: photoUrl, uploadedByUserId: session.user.id }] }
        : undefined,
      events: {
        create: [
          {
            actorId: session.user.id,
            actorRole: UserRoleName.REPORTER,
            fromStatus: null,
            toStatus: CaseStatus.REPORTED,
            photoUrl,
          },
        ],
      },
      followers: { create: [{ userId: session.user.id }] },
    },
    include: { photos: true, events: true },
  });

  // AI triage runs synchronously here so the confirmation screen can show
  // it immediately (build brief §2 step 4 / §4a). A slow or failing model
  // call degrades to the safe fallback in runTriage — it never blocks
  // case creation, which has already committed above.
  let assessment = null;
  try {
    const triage = await runTriage({
      species: input.species,
      injuryType: input.injuryType,
      photo: photoBuffer && photoMimeType ? { base64: photoBuffer.toString('base64'), mimeType: photoMimeType } : null,
    });

    const [aiAssessment] = await db.$transaction([
      db.aiAssessment.create({
        data: {
          caseId: created.id,
          suspectedInjury: triage.suspectedInjury,
          urgency: triage.urgency,
          templateId: triage.templateId,
          confidence: triage.confidence,
          rawModelOutput: JSON.parse(JSON.stringify(triage)),
        },
      }),
      db.case.update({ where: { id: created.id }, data: { status: CaseStatus.TRIAGED } }),
      db.caseEvent.create({
        data: {
          caseId: created.id,
          actorId: session.user.id,
          actorRole: UserRoleName.REPORTER,
          fromStatus: CaseStatus.REPORTED,
          toStatus: CaseStatus.TRIAGED,
          note: 'AI triage complete',
        },
      }),
    ]);
    assessment = { ...triage, id: aiAssessment.id };
  } catch {
    // Triage failure must never fail case creation — the case still exists
    // and can be picked up by a human dispatcher.
  }

  const nearestHelp = await findNearestHelp({ latitude: input.latitude, longitude: input.longitude });

  return NextResponse.json(
    {
      case: toPublicCase({ ...created, status: assessment ? CaseStatus.TRIAGED : created.status }),
      assessment,
      nearestHelp,
    },
    { status: 201 }
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const area = searchParams.get('area');

  const cases = await db.case.findMany({
    where: {
      ...(status ? { status: status as CaseStatus } : {}),
      ...(area ? { area } : {}),
    },
    include: { photos: true, events: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ cases: cases.map(toPublicCase) });
}
