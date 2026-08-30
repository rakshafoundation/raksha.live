import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { CaseStatus, UserRoleName } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { distanceMeters } from '@/lib/geo';

const RESPONDER_ROLES: UserRoleName[] = [
  UserRoleName.RESCUER,
  UserRoleName.AMBULANCE,
  UserRoleName.NGO,
  UserRoleName.VET,
];

/**
 * Open-cases-near-me queue (build brief §6). Only shows cases the
 * network can act on (TRIAGED = triaged and awaiting acceptance) — never
 * lists REPORTED cases still mid-triage, and never a case someone else
 * already accepted.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !session.user.roles.some((r) => RESPONDER_ROLES.includes(r))) {
    return NextResponse.json({ error: 'Responder role required.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get('lat'));
  const lng = Number(searchParams.get('lng'));
  const hasLocation = Number.isFinite(lat) && Number.isFinite(lng);

  const openCases = await db.case.findMany({
    where: { status: CaseStatus.TRIAGED },
    include: { aiAssessments: { orderBy: { createdAt: 'desc' }, take: 1 } },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });

  const withDistance = openCases.map((c) => ({
    caseNumber: c.caseNumber,
    animalName: c.animalName,
    species: c.species,
    injuryType: c.injuryType,
    area: c.area,
    createdAt: c.createdAt,
    urgency: c.aiAssessments[0]?.urgency ?? null,
    distanceMeters: hasLocation
      ? Math.round(distanceMeters({ latitude: lat, longitude: lng }, { latitude: c.latitude, longitude: c.longitude }))
      : null,
  }));

  withDistance.sort((a, b) => {
    // Distance × severity, nearest CRITICAL first when location is known;
    // otherwise oldest-first so nothing waits forever.
    if (hasLocation && a.distanceMeters !== null && b.distanceMeters !== null) {
      const severityWeight = (u: string | null) => (u === 'CRITICAL' ? 0 : u === 'URGENT' ? 1 : 2);
      const scoreA = a.distanceMeters * (1 + severityWeight(a.urgency) * 0.5);
      const scoreB = b.distanceMeters * (1 + severityWeight(b.urgency) * 0.5);
      return scoreA - scoreB;
    }
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  return NextResponse.json({ cases: withDistance });
}
