/**
 * One-off (but re-runnable) import of a real, curated Mumbai animal-
 * welfare directory — NGOs/shelters, charitable & private vet hospitals,
 * pet stores, vet pharmacies, and ambulance/pet-transport services —
 * supplied directly by Raksha, not scraped. See DIRECTORY_DATA below for
 * the source list and src/app/api/admin/directory/route.ts for the write
 * path this posts to.
 *
 * Geocodes each address via OpenStreetMap's Nominatim (free, no API key)
 * rather than Google Geocoding, since this only needs to run once and
 * avoids requiring yet another Google Cloud key just for a single import.
 * Nominatim's usage policy caps requests at 1/sec and requires a real
 * User-Agent — both respected below.
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
import { DIRECTORY_SEED_DATA, type DirectorySeedEntry } from '../src/lib/directory-seed-data';

const TARGET_BASE_URL = process.env.TARGET_BASE_URL;
const ADMIN_DIRECTORY_SECRET = process.env.ADMIN_DIRECTORY_SECRET;
const DRY_RUN = process.argv.includes('--dry-run');

if (!TARGET_BASE_URL || !ADMIN_DIRECTORY_SECRET) {
  console.error('Missing required env vars: TARGET_BASE_URL, ADMIN_DIRECTORY_SECRET');
  process.exit(1);
}

type SourceEntry = DirectorySeedEntry;
const DIRECTORY_DATA = DIRECTORY_SEED_DATA;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function geocode(address: string): Promise<{ latitude: number; longitude: number } | null> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', address);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'in');

  const res = await fetch(url, {
    headers: { 'User-Agent': 'RakshaNetwork-DirectoryImport/1.0 (one-off data import script)' },
  });
  if (!res.ok) return null;
  const results = await res.json();
  if (!results?.[0]) return null;
  return { latitude: Number(results[0].lat), longitude: Number(results[0].lon) };
}

async function postListing(entry: SourceEntry, location: { latitude: number; longitude: number }): Promise<'created' | 'skipped' | 'error'> {
  const payload = {
    name: entry.name,
    category: entry.category,
    area: entry.area,
    latitude: location.latitude,
    longitude: location.longitude,
    phone: entry.phone,
    hours: entry.hours,
    isOpen24x7: entry.isOpen24x7,
  };

  if (DRY_RUN) {
    console.log(`  [dry-run] would add: ${entry.name} @ ${location.latitude.toFixed(4)},${location.longitude.toFixed(4)}`);
    return 'created';
  }

  const res = await fetch(`${TARGET_BASE_URL}/api/admin/directory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_DIRECTORY_SECRET! },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.warn(`  FAILED: ${entry.name} — ${res.status} ${JSON.stringify(body)}`);
    return 'error';
  }
  const body = await res.json();
  return body.skipped ? 'skipped' : 'created';
}

async function main() {
  const tally = { created: 0, skipped: 0, error: 0, noPhone: 0, noGeocode: 0 };

  for (const entry of DIRECTORY_DATA) {
    if (!entry.phone) {
      console.log(`Skipping (no phone number available): ${entry.name}`);
      tally.noPhone++;
      continue;
    }

    const location = await geocode(entry.address);
    await sleep(1100); // Nominatim usage policy: max 1 request/second

    if (!location) {
      console.warn(`Could not geocode: ${entry.name} (${entry.address})`);
      tally.noGeocode++;
      continue;
    }

    const outcome = await postListing(entry, location);
    console.log(`${outcome.toUpperCase()}: ${entry.name}`);
    tally[outcome]++;
  }

  console.log('\n=== Done ===');
  console.log(
    `Created: ${tally.created}, skipped (duplicates): ${tally.skipped}, errors: ${tally.error}, ` +
      `no phone (skipped): ${tally.noPhone}, could not geocode: ${tally.noGeocode}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
