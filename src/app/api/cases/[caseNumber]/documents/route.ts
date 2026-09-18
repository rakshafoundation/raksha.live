import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { saveCasePhoto } from '@/lib/storage';
import { isReceivingOrgMember } from '@/lib/case-org-auth';

const BodySchema = z.object({ label: z.string().min(1).max(200) });

/**
 * Vet report / treatment document upload. Shown publicly on the case
 * page — see CaseDocument in schema.prisma for why that's a deliberate
 * departure from this platform's usual private-by-default medical data.
 */
export async function POST(request: NextRequest, { params }: { params: { caseNumber: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }

  const kase = await db.case.findUnique({ where: { caseNumber: params.caseNumber } });
  if (!kase) return NextResponse.json({ error: 'Case not found' }, { status: 404 });

  if (!(await isReceivingOrgMember(session.user.id, kase.receivingOrganisationId))) {
    return NextResponse.json({ error: 'Only the organisation treating this case can upload documents.' }, { status: 403 });
  }

  const formData = await request.formData();
  const parsed = BodySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'A file is required.' }, { status: 400 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await saveCasePhoto(buffer, file.type || 'application/octet-stream');

  const doc = await db.caseDocument.create({
    data: {
      caseId: kase.id,
      organisationId: kase.receivingOrganisationId!,
      uploadedByUserId: session.user.id,
      url,
      label: parsed.data.label,
    },
  });

  return NextResponse.json({ id: doc.id, url: doc.url });
}
