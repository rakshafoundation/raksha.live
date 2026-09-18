import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { saveCasePhoto } from '@/lib/storage';
import { isReceivingOrgMember } from '@/lib/case-org-auth';

const BodySchema = z.object({ message: z.string().min(1).max(1000) });

/**
 * A public progress note from the receiving org — separate from
 * CaseEvent (state-machine transitions only). See CaseUpdate in
 * schema.prisma.
 */
export async function POST(request: NextRequest, { params }: { params: { caseNumber: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }

  const kase = await db.case.findUnique({ where: { caseNumber: params.caseNumber } });
  if (!kase) return NextResponse.json({ error: 'Case not found' }, { status: 404 });

  if (!(await isReceivingOrgMember(session.user.id, kase.receivingOrganisationId))) {
    return NextResponse.json({ error: 'Only the organisation treating this case can post updates.' }, { status: 403 });
  }

  const contentType = request.headers.get('content-type') ?? '';
  let message: string;
  let photoUrl: string | null = null;

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const parsed = BodySchema.safeParse(Object.fromEntries(formData.entries()));
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    message = parsed.data.message;
    const photoFile = formData.get('photo');
    if (photoFile instanceof File && photoFile.size > 0) {
      const buffer = Buffer.from(await photoFile.arrayBuffer());
      photoUrl = await saveCasePhoto(buffer, photoFile.type || 'image/jpeg');
    }
  } else {
    const parsed = BodySchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    message = parsed.data.message;
  }

  const update = await db.caseUpdate.create({
    data: {
      caseId: kase.id,
      organisationId: kase.receivingOrganisationId!,
      authorUserId: session.user.id,
      message,
      photoUrl,
    },
  });

  return NextResponse.json({ id: update.id });
}
