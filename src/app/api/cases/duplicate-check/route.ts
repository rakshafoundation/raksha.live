import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CaseStatus, Species } from '@prisma/client';
import { db } from '@/lib/db';
import { findDuplicateCandidates, DUPLICATE_GATE_WINDOW_MINUTES } from '@/lib/duplicate-detection';

const QuerySchema = z.object({
  species: z.nativeEnum(Species),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
});

/**
 * Layer 1 duplicate gate, run from the report flow before submission
 * (build brief §2 step 3 / §4b). Only ever used to show the reporter a
 * confirmation screen — never to auto-merge anything.
 */
export async function POST(request: NextRequest) {
  const parsed = QuerySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { species, latitude, longitude } = parsed.data;

  const windowStart = new Date(Date.now() - DUPLICATE_GATE_WINDOW_MINUTES * 60_000);
  const openCases = await db.case.findMany({
    where: {
      species,
      status: { not: CaseStatus.CLOSED },
      createdAt: { gte: windowStart },
    },
    select: { id: true, caseNumber: true, species: true, latitude: true, longitude: true, createdAt: true, status: true, animalName: true },
  });

  const candidates = findDuplicateCandidates(
    { species, location: { latitude, longitude }, reportedAt: new Date() },
    openCases.map((c) => ({
      caseId: c.id,
      caseNumber: c.caseNumber,
      species: c.species,
      location: { latitude: c.latitude, longitude: c.longitude },
      reportedAt: c.createdAt,
    }))
  );

  const withDetail = candidates.map((c) => {
    const full = openCases.find((o) => o.id === c.caseId)!;
    return { ...c, animalName: full.animalName, status: full.status };
  });

  return NextResponse.json({ candidates: withDetail });
}
