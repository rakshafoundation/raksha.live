import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { DirectoryCategory, OrganisationType, UserRoleName, VerificationTier } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { saveCasePhoto } from '@/lib/storage';

const CATEGORY_MAP: Record<'NGO' | 'VET', { orgType: OrganisationType; role: UserRoleName; directoryCategory: DirectoryCategory }> = {
  NGO: { orgType: OrganisationType.NGO_SHELTER, role: UserRoleName.NGO, directoryCategory: DirectoryCategory.NGO },
  VET: { orgType: OrganisationType.VET_HOSPITAL, role: UserRoleName.VET, directoryCategory: DirectoryCategory.VET },
};

const BodySchema = z.object({
  category: z.enum(['NGO', 'VET']),
  claimListingId: z.string().optional(),
  name: z.string().min(1).max(200).optional(),
  area: z.string().min(1).max(200).optional(),
  phone: z.string().min(1).max(40).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
});

/**
 * Self-serve service-provider signup (build brief §7/§11 NGO/vet
 * dashboard, extended per later request into a full accept-through-
 * release portal — see /provider). Creates the Organisation at
 * VerificationTier.NONE — it is NOT eligible to accept cases
 * (findNgoOrVetMembership) until an admin approves the Verification
 * request this also creates, via the existing Command Center queue.
 * "No tick without documents — no exceptions" is enforced by requiring
 * a document upload here, not just by convention.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }

  const existingMembership = await db.organisationMember.findFirst({ where: { userId: session.user.id } });
  if (existingMembership) {
    return NextResponse.json({ error: 'You are already registered with an organisation.' }, { status: 409 });
  }

  const formData = await request.formData();
  const parsed = BodySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;
  const mapping = CATEGORY_MAP[input.category];

  const docFile = formData.get('document');
  if (!(docFile instanceof File) || docFile.size === 0) {
    return NextResponse.json({ error: 'A registration/license document is required for verification.' }, { status: 400 });
  }
  const docBuffer = Buffer.from(await docFile.arrayBuffer());
  const docUrl = await saveCasePhoto(docBuffer, docFile.type || 'application/octet-stream');

  // Two ways to establish the org: claim an existing unclaimed listing
  // (the real Mumbai directory data — see claimable-listings/route.ts),
  // which reuses that listing's details and marks it claimed instead of
  // creating a duplicate; or enter details manually, which creates a
  // fresh Organisation + DirectoryListing as before.
  let claimedListing: { name: string; area: string; phone: string; latitude: number; longitude: number } | null = null;
  if (input.claimListingId) {
    const listing = await db.directoryListing.findUnique({ where: { id: input.claimListingId } });
    if (!listing || listing.organisationId) {
      return NextResponse.json({ error: 'That listing is no longer available to claim.' }, { status: 409 });
    }
    claimedListing = listing;
  } else if (!input.name || !input.area || !input.phone || input.latitude == null || input.longitude == null) {
    return NextResponse.json({ error: 'Name, area, phone, and location are required.' }, { status: 400 });
  }

  const orgDetails = claimedListing ?? {
    name: input.name!,
    area: input.area!,
    phone: input.phone!,
    latitude: input.latitude!,
    longitude: input.longitude!,
  };

  const ALREADY_CLAIMED = 'ALREADY_CLAIMED';
  let organisation;
  try {
    organisation = await db.$transaction(async (tx) => {
      const org = await tx.organisation.create({
        data: {
          name: orgDetails.name,
          type: mapping.orgType,
          area: orgDetails.area,
          latitude: orgDetails.latitude,
          longitude: orgDetails.longitude,
          phone: orgDetails.phone,
          verificationTier: VerificationTier.NONE,
        },
      });

      if (input.claimListingId) {
        // Re-check-and-claim atomically inside the transaction — closes
        // the race between the earlier read and this write if two people
        // try to claim the same listing at once.
        const result = await tx.directoryListing.updateMany({
          where: { id: input.claimListingId, organisationId: null },
          data: { organisationId: org.id, claimedAt: new Date() },
        });
        if (result.count === 0) throw new Error(ALREADY_CLAIMED);
      } else {
        await tx.directoryListing.create({
          data: {
            organisationId: org.id,
            name: orgDetails.name,
            category: mapping.directoryCategory,
            area: orgDetails.area,
            latitude: orgDetails.latitude,
            longitude: orgDetails.longitude,
            phone: orgDetails.phone,
          },
        });
      }

      await tx.organisationMember.create({
        data: { organisationId: org.id, userId: session.user.id, isAuthorisedSignatory: true },
      });

      await tx.userRoleAssignment.upsert({
        where: { userId_role: { userId: session.user.id, role: mapping.role } },
        update: {},
        create: { userId: session.user.id, role: mapping.role },
      });

      await tx.verification.create({
        data: {
          organisationId: org.id,
          targetTier: VerificationTier.VERIFIED,
          documents: [{ type: 'registration', storageRef: docUrl }],
        },
      });

      return org;
    });
  } catch (e) {
    if (e instanceof Error && e.message === ALREADY_CLAIMED) {
      return NextResponse.json({ error: 'That listing is no longer available to claim.' }, { status: 409 });
    }
    throw e;
  }

  return NextResponse.json({ organisationId: organisation.id, name: organisation.name });
}
