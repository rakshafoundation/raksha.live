/**
 * Bulk-populates the directory from real Google Places data instead of
 * manual entry (build brief §9/§10 step 10: "import seed data" — this is
 * the automated alternative to typing listings into /admin/directory one
 * at a time, or hand-building prisma/directory-seed.csv).
 *
 * Posts each result to a live deployment's POST /api/admin/directory
 * (see src/app/api/admin/directory/route.ts) rather than writing to the
 * database directly, so it only needs HTTPS — no direct Postgres
 * connection, which is unreachable from most sandboxed/CI environments.
 * That route already de-dupes by name+category+~100m, so this script is
 * safe to re-run (e.g. to pick up new categories or a wider radius later)
 * without creating duplicate listings.
 *
 * Requires a Places API key that is NOT restricted to specific websites
 * (HTTP referrer restrictions only work for browser requests) — use a
 * separate key from NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, ideally deleted or
 * rotated again once the import is done.
 *
 * Usage:
 *   GOOGLE_PLACES_API_KEY=... \
 *   TARGET_BASE_URL=https://your-app.vercel.app \
 *   ADMIN_DIRECTORY_SECRET=... \
 *   npx tsx scripts/import-google-places.ts [--dry-run]
 */
import { DirectoryCategory } from '@prisma/client';

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const TARGET_BASE_URL = process.env.TARGET_BASE_URL;
const ADMIN_DIRECTORY_SECRET = process.env.ADMIN_DIRECTORY_SECRET;
const DRY_RUN = process.argv.includes('--dry-run');

if (!PLACES_API_KEY || !TARGET_BASE_URL || !ADMIN_DIRECTORY_SECRET) {
  console.error('Missing required env vars: GOOGLE_PLACES_API_KEY, TARGET_BASE_URL, ADMIN_DIRECTORY_SECRET');
  process.exit(1);
}

// Center of Mumbai + a radius wide enough to cover the metro area (build
// brief scope is Mumbai). Widen/duplicate this block for other cities later.
const SEARCH_CENTER = { lat: 19.076, lng: 72.8777 };
const SEARCH_RADIUS_METERS = 30_000;

const SEARCHES: Array<{ category: DirectoryCategory; queries: string[] }> = [
  { category: DirectoryCategory.VET, queries: ['veterinary clinic in Mumbai', 'animal hospital in Mumbai'] },
  { category: DirectoryCategory.NGO, queries: ['animal rescue NGO in Mumbai', 'animal welfare organisation in Mumbai', 'animal shelter in Mumbai'] },
  { category: DirectoryCategory.VET_PHARMACY, queries: ['veterinary pharmacy in Mumbai', 'pet pharmacy in Mumbai'] },
];

interface PlaceResult {
  place_id: string;
  name: string;
  geometry: { location: { lat: number; lng: number } };
}

interface PlaceDetails {
  formatted_phone_number?: string;
  opening_hours?: { weekday_text?: string[] };
  address_components?: Array<{ long_name: string; types: string[] }>;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function textSearch(query: string): Promise<PlaceResult[]> {
  const results: PlaceResult[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < 3; page++) {
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    url.searchParams.set('query', query);
    url.searchParams.set('location', `${SEARCH_CENTER.lat},${SEARCH_CENTER.lng}`);
    url.searchParams.set('radius', String(SEARCH_RADIUS_METERS));
    url.searchParams.set('key', PLACES_API_KEY!);
    if (pageToken) url.searchParams.set('pagetoken', pageToken);

    const res = await fetch(url);
    const body = await res.json();
    if (body.status !== 'OK' && body.status !== 'ZERO_RESULTS') {
      console.warn(`  Places API returned ${body.status} for "${query}": ${body.error_message ?? ''}`);
      break;
    }
    results.push(...(body.results ?? []));

    if (!body.next_page_token) break;
    pageToken = body.next_page_token;
    // A next_page_token isn't valid until a couple of seconds after it's issued.
    await sleep(2500);
  }
  return results;
}

async function getDetails(placeId: string): Promise<PlaceDetails> {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('fields', 'formatted_phone_number,opening_hours,address_components');
  url.searchParams.set('key', PLACES_API_KEY!);

  const res = await fetch(url);
  const body = await res.json();
  if (body.status !== 'OK') return {};
  return body.result ?? {};
}

function extractArea(components: PlaceDetails['address_components']): string {
  if (!components) return 'Mumbai';
  const byType = (type: string) => components.find((c) => c.types.includes(type))?.long_name;
  return (
    byType('sublocality_level_1') ??
    byType('sublocality') ??
    byType('neighborhood') ??
    byType('locality') ??
    'Mumbai'
  );
}

function isOpen24x7(weekdayText: string[] | undefined): boolean {
  if (!weekdayText || weekdayText.length < 7) return false;
  return weekdayText.every((line) => /open 24 hours/i.test(line));
}

async function postListing(listing: {
  name: string;
  category: DirectoryCategory;
  area: string;
  latitude: number;
  longitude: number;
  phone: string;
  hours: string | null;
  isOpen24x7: boolean;
}): Promise<'created' | 'skipped' | 'error'> {
  if (DRY_RUN) {
    console.log(`  [dry-run] would add: ${listing.name} (${listing.category}, ${listing.area})`);
    return 'created';
  }
  const res = await fetch(`${TARGET_BASE_URL}/api/admin/directory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_DIRECTORY_SECRET! },
    body: JSON.stringify(listing),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.warn(`  Failed to add ${listing.name}: ${res.status} ${JSON.stringify(body)}`);
    return 'error';
  }
  const body = await res.json();
  return body.skipped ? 'skipped' : 'created';
}

async function main() {
  const seenPlaceIds = new Set<string>();
  const tally = { created: 0, skipped: 0, error: 0, noPhone: 0 };

  for (const { category, queries } of SEARCHES) {
    console.log(`\n=== ${category} ===`);
    for (const query of queries) {
      console.log(`Searching: "${query}"`);
      const results = await textSearch(query);
      console.log(`  ${results.length} results`);

      for (const place of results) {
        if (seenPlaceIds.has(place.place_id)) continue;
        seenPlaceIds.add(place.place_id);

        const details = await getDetails(place.place_id);
        await sleep(150); // gentle pacing, comfortably under quota

        if (!details.formatted_phone_number) {
          tally.noPhone++;
          continue; // phone is required on DirectoryListing — skip entries without one
        }

        const outcome = await postListing({
          name: place.name,
          category,
          area: extractArea(details.address_components),
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          phone: details.formatted_phone_number,
          hours: details.opening_hours?.weekday_text?.[0] ?? null,
          isOpen24x7: isOpen24x7(details.opening_hours?.weekday_text),
        });
        tally[outcome]++;
      }
    }
  }

  console.log('\n=== Done ===');
  console.log(`Created: ${tally.created}, skipped (duplicates): ${tally.skipped}, errors: ${tally.error}, no phone (skipped): ${tally.noPhone}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
