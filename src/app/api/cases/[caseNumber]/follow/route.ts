import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(_request: NextRequest, { params }: { params: { caseNumber: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Sign in to follow a case.' }, { status: 401 });
  }

  const found = await db.case.findUnique({ where: { caseNumber: params.caseNumber } });
  if (!found) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }

  await db.caseFollower.upsert({
    where: { caseId_userId: { caseId: found.id, userId: session.user.id } },
    update: {},
    create: { caseId: found.id, userId: session.user.id },
  });

  return NextResponse.json({ following: true });
}
