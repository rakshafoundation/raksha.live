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
  name: z.string().min(1).max(200),
  area: z.string().min(1).max(200),
  phone: z.string().min(1).max(40),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
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

  const organisation = await db.$transaction(async (tx) => {
    const org = await tx.organisation.create({
      data: {
        name: input.name,
        type: mapping.orgType,
        area: input.area,
        latitude: input.latitude,
        longitude: input.longitude,
        phone: input.phone,
        verificationTier: VerificationTier.NONE,
        directoryListing: {
          create: {
            name: input.name,
            category: mapping.directoryCategory,
            area: input.area,
            latitude: input.latitude,
            longitude: input.longitude,
            phone: input.phone,
          },
        },
      },
    });

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

  return NextResponse.json({ organisationId: organisation.id, name: organisation.name });
}
