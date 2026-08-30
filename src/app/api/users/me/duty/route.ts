import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

/** Availability toggle (build brief §6/§7): off-duty responders get no pings. */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const { onDuty } = await request.json();
  const updated = await db.user.update({
    where: { id: session.user.id },
    data: { onDuty: Boolean(onDuty) },
  });
  return NextResponse.json({ onDuty: updated.onDuty });
}
