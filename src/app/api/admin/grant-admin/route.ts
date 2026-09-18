import { NextRequest, NextResponse } from 'next/server';
import { UserRoleName } from '@prisma/client';
import { db } from '@/lib/db';

/**
 * One-time bootstrap for a real ADMIN account. The only ADMIN in
 * prisma/seed.ts is a demo user (admin@raksha.demo) with no real login
 * attached, and nothing else in the app grants the ADMIN role — so on a
 * fresh deployment there is no way for anyone to actually reach the
 * Command Center. This closes that gap the same way
 * /api/admin/directory/bulk-import does: a clickable, secret-gated URL,
 * since there's no direct production DB connection available to grant
 * roles any other way.
 *
 * Finds an EXISTING user by email or phone (they must have signed in at
 * least once already — this never creates an account) and grants
 * ADMIN. Safe to leave wired up long-term (unlike the directory
 * importer, there's no data to exhaust), but treat the secret with the
 * same care as a root password: anyone with it can grant themselves
 * full admin access.
 */
export async function GET(request: NextRequest) {
  const expectedSecret = process.env.ADMIN_GRANT_SECRET;
  const secret = request.nextUrl.searchParams.get('secret');
  if (!expectedSecret || secret !== expectedSecret) {
    return new NextResponse('Invalid or missing secret. Add ?secret=... to the URL.', { status: 403 });
  }

  const identifier = request.nextUrl.searchParams.get('identifier')?.trim();
  if (!identifier) {
    return new NextResponse('Add ?identifier=<email or phone> to the URL — the account must have signed in at least once already.', {
      status: 400,
    });
  }

  // A literal "+" in a phone number (e.g. "+919876543210") decodes to a
  // space in a query string's application/x-www-form-urlencoded parsing
  // — the same class of bug as an unencoded "@" in a connection string.
  // A pasted-not-typed URL usually survives fine, but hand-typed or
  // hand-edited ones don't, so tolerate a leading space standing in for
  // a dropped "+" rather than 404 on it.
  const candidates = identifier.startsWith(' ') ? [identifier, `+${identifier.slice(1)}`] : [identifier];

  const user = await db.user.findFirst({
    where: { OR: [{ email: { in: candidates } }, { phone: { in: candidates } }] },
  });
  if (!user) {
    return new NextResponse(
      `No account found for "${identifier}". Sign in once first (Google or dev-login), then revisit this link.`,
      { status: 404 }
    );
  }

  await db.userRoleAssignment.upsert({
    where: { userId_role: { userId: user.id, role: UserRoleName.ADMIN } },
    update: {},
    create: { userId: user.id, role: UserRoleName.ADMIN },
  });

  return new NextResponse(
    `${user.name} (${user.email ?? user.phone}) is now an admin. Visit /command-center — you may need to reload the page once for the new role to take effect.`,
    { status: 200 }
  );
}
