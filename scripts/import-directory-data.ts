/**
 * One-off (but re-runnable) import of a real, curated Mumbai animal-
 * welfare directory — NGOs/shelters, charitable & private vet hospitals,
 * pet stores, vet pharmacies, and ambulance/pet-transport services —
 * supplied directly by Raksha, not scraped. See
 * src/lib/directory-seed-data.ts for the source list (coordinates there
 * are neighbourhood-level, not geocoded — see that file's header) and
 * src/app/api/admin/directory/route.ts for the write path this posts to.
 *
 * The in-app importer (src/app/api/admin/directory/bulk-import/route.ts)
 * is the primary supported path — this script is a local/manual
 * alternative for anyone with the repo cloned and Node.js installed.
 *
 * Posts each entry to a live deployment's POST /api/admin/directory,
 * which only needs HTTPS (no direct Postgres connection required) and
 * already de-dupes by name+category+~100m, so this script is safe to
 * re-run.
 *
 * Usage:
 *   TARGET_BASE_URL=https://your-app.vercel.app \
 *   ADMIN_DIRECTORY_SECRET=... \
 *   npx tsx scripts/import-directory-data.ts [--dry-run]
 */
import { DIRECTORY_SEED_DATA } from '../src/lib/directory-seed-data';

const TARGET_BASE_URL = process.env.TARGET_BASE_URL;
const ADMIN_DIRECTORY_SECRET = process.env.ADMIN_DIRECTORY_SECRET;
const DRY_RUN = process.argv.includes('--dry-run');

if (!TARGET_BASE_URL || !ADMIN_DIRECTORY_SECRET) {
  console.error('Missing required env vars: TARGET_BASE_URL, ADMIN_DIRECTORY_SECRET');
  process.exit(1);
}

async function main() {
  const tally = { created: 0, skipped: 0, error: 0, noPhone: 0 };

  for (const entry of DIRECTORY_SEED_DATA) {
    if (!entry.phone) {
      console.log(`Skipping (no phone number available): ${entry.name}`);
      tally.noPhone++;
      continue;
    }

    const payload = {
      name: entry.name,
      category: entry.category,
      area: entry.area,
      latitude: entry.latitude,
      longitude: entry.longitude,
      phone: entry.phone,
      hours: entry.hours,
      isOpen24x7: entry.isOpen24x7,
    };

    if (DRY_RUN) {
      console.log(`[dry-run] would add: ${entry.name}`);
      tally.created++;
      continue;
    }

    const res = await fetch(`${TARGET_BASE_URL}/api/admin/directory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_DIRECTORY_SECRET! },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.warn(`FAILED: ${entry.name} — ${res.status} ${JSON.stringify(body)}`);
      tally.error++;
      continue;
    }
    const body = await res.json();
    if (body.skipped) {
      console.log(`SKIPPED (duplicate): ${entry.name}`);
      tally.skipped++;
    } else {
      console.log(`CREATED: ${entry.name}`);
      tally.created++;
    }
  }

  console.log('\n=== Done ===');
  console.log(`Created: ${tally.created}, skipped (duplicates): ${tally.skipped}, errors: ${tally.error}, no phone (skipped): ${tally.noPhone}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
