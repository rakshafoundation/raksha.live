import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { PrismaClient, DirectoryCategory, OrganisationType, UserRoleName, VerificationTier } from '@prisma/client';

const db = new PrismaClient();

/**
 * Seeds the directory (build brief §9/§10 step 10: "import seed CSV").
 *
 * We do NOT ship Raksha's real ~89 veterinary-practice + NGO contact list
 * in this repo — that is real organisational data that belongs in a
 * private import, not committed to source. Put a real export at
 * prisma/directory-seed.csv (same columns as
 * prisma/directory-seed-template.csv) and re-run `npm run db:seed`; until
 * then this script seeds a small, clearly-labelled demo set so the
 * directory/report/triage flows have something to point at locally.
 */
async function seedDirectoryFromCsv(): Promise<boolean> {
  const csvPath = path.join(process.cwd(), 'prisma', 'directory-seed.csv');
  if (!existsSync(csvPath)) return false;

  const rows = parse(readFileSync(csvPath, 'utf-8'), { columns: true, skip_empty_lines: true }) as Array<{
    name: string;
    category: string;
    area: string;
    latitude: string;
    longitude: string;
    phone: string;
    hours?: string;
    isOpen24x7?: string;
  }>;

  for (const row of rows) {
    await db.directoryListing.create({
      data: {
        name: row.name,
        category: row.category as DirectoryCategory,
        area: row.area,
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        phone: row.phone,
        hours: row.hours || null,
        isOpen24x7: row.isOpen24x7 === 'true',
      },
    });
  }

  console.log(`Seeded ${rows.length} directory listings from prisma/directory-seed.csv`);
  return true;
}

async function seedDemoData() {
  const admin = await db.user.upsert({
    where: { email: 'admin@raksha.demo' },
    update: {},
    create: {
      email: 'admin@raksha.demo',
      name: 'Raksha Admin (demo)',
      verificationTier: VerificationTier.PAYMENT_APPROVED,
      roles: { create: [{ role: UserRoleName.ADMIN }] },
    },
  });
  console.log(`Demo admin user: ${admin.email}`);

  const demoOrgs: Array<{
    name: string;
    type: OrganisationType;
    area: string;
    latitude: number;
    longitude: number;
    phone: string;
    category: DirectoryCategory;
  }> = [
    {
      name: 'Demo Worli Animal Ambulance',
      type: OrganisationType.AMBULANCE_OPERATOR,
      area: 'Worli',
      latitude: 19.0176,
      longitude: 72.8177,
      phone: '+91 90000 00001',
      category: DirectoryCategory.NGO,
    },
    {
      name: 'Demo ABC Animal Hospital',
      type: OrganisationType.VET_HOSPITAL,
      area: 'Worli',
      latitude: 19.0148,
      longitude: 72.8171,
      phone: '+91 90000 00002',
      category: DirectoryCategory.VET,
    },
    {
      name: 'Demo PQR NGO Shelter',
      type: OrganisationType.NGO_SHELTER,
      area: 'Lower Parel',
      latitude: 19.0002,
      longitude: 72.8306,
      phone: '+91 90000 00003',
      category: DirectoryCategory.NGO,
    },
  ];

  for (const org of demoOrgs) {
    const created = await db.organisation.upsert({
      where: { id: `demo-${org.name}` },
      update: {},
      create: {
        id: `demo-${org.name}`,
        name: org.name,
        type: org.type,
        area: org.area,
        latitude: org.latitude,
        longitude: org.longitude,
        phone: org.phone,
        verificationTier: VerificationTier.VERIFIED,
        capacity: {
          create: {
            ambulanceFree: true,
            kennelsTotal: 20,
            kennelsFree: 12,
            otAvailableToday: true,
            acceptingEmergencies: true,
            acceptingSterilisation: true,
          },
        },
        directoryListing: {
          create: {
            name: org.name,
            category: org.category,
            area: org.area,
            latitude: org.latitude,
            longitude: org.longitude,
            phone: org.phone,
          },
        },
      },
    });
    console.log(`Demo organisation: ${created.name}`);
  }
}

async function main() {
  const importedFromCsv = await seedDirectoryFromCsv();
  await seedDemoData();
  if (!importedFromCsv) {
    console.log(
      '\nNo prisma/directory-seed.csv found — only demo data was seeded.\n' +
        'To import the real Mumbai network, drop a CSV (see prisma/directory-seed-template.csv for columns) at prisma/directory-seed.csv and re-run `npm run db:seed`.'
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
