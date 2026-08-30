import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { toPublicCase } from '@/lib/public-projection';

/**
 * Public case detail. Always returns the public-safe projection — exact
 * GPS and reporter identity are never in this response (build brief §3,
 * §11 checklist). A network-view variant with exact GPS + reporter phone
 * for assigned responders is a follow-up (needs role/assignment checks
 * layered on top of this handler, not a relaxation of it).
 */
export async function GET(_request: NextRequest, { params }: { params: { caseNumber: string } }) {
  const found = await db.case.findUnique({
    where: { caseNumber: params.caseNumber },
    include: { photos: true, events: true },
  });

  if (!found) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }

  return NextResponse.json({ case: toPublicCase(found) });
}
