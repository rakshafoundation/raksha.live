import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { CaseStatus, UserRoleName } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

/** Cases needing foster: RECOVERY-stage only (build brief §9 Foster view). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }
  if (!session.user.roles.includes(UserRoleName.FOSTER)) {
    return NextResponse.json({ error: 'Foster role required.' }, { status: 403 });
  }

  const cases = await db.case.findMany({
    where: { status: CaseStatus.RECOVERY },
    include: { photos: true },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });

  const myApplications = await db.fosterPlacement.findMany({
    where: { fosterId: session.user.id, caseId: { in: cases.map((c) => c.id) } },
    select: { caseId: true },
  });
  const appliedCaseIds = new Set(myApplications.map((a) => a.caseId));

  return NextResponse.json({
    cases: cases.map((c) => ({
      caseNumber: c.caseNumber,
      animalName: c.animalName,
      species: c.species,
      area: c.area,
      photoUrl: c.photos[0]?.url ?? null,
      alreadyApplied: appliedCaseIds.has(c.id),
    })),
  });
}
