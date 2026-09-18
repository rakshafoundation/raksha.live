import { NextRequest, NextResponse } from 'next/server';
import { DIRECTORY_SEED_DATA } from '@/lib/directory-seed-data';
import { createDirectoryListingIfNew } from '@/lib/directory-admin';

/**
 * Runs the curated-data import (src/lib/directory-seed-data.ts) entirely
 * inside Vercel's serverless runtime rather than as an external script.
 * Claude's own sandbox network is locked to a narrow allowlist and can
 * reach neither Nominatim (the free geocoder used here) nor this app's
 * own deployed URL — see scripts/import-directory-data.ts's header for
 * the same import logic written as a standalone script for a machine
 * that *does* have normal internet access. Vercel's function runtime
 * has ordinary outbound access, so doing the geocoding + writes here
 * sidesteps that restriction: the human just opens (and re-clicks) a
 * URL, nothing runs from outside the deployment.
 *
 * GET with ?secret=...&offset=0 processes one batch and returns an HTML
 * page with a "Continue" link to the next offset — batched (rather than
 * all ~50 in one request) to stay comfortably inside a serverless
 * function's execution time limit. Idempotent: re-running a batch (or
 * the whole thing) only skips already-created listings, via the same
 * ~100m+name dedupe used by the single-listing admin route.
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BATCH_SIZE = 12;

// Overridable so this can be pointed at a local mock in tests without
// touching real Nominatim — defaults to the real service in production.
const NOMINATIM_SEARCH_URL = process.env.NOMINATIM_SEARCH_URL || 'https://nominatim.openstreetmap.org/search';

async function geocode(address: string): Promise<{ latitude: number; longitude: number } | null> {
  const url = new URL(NOMINATIM_SEARCH_URL);
  url.searchParams.set('q', address);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'in');

  const res = await fetch(url, {
    headers: { 'User-Agent': 'RakshaNetwork-DirectoryImport/1.0 (contact via app admin)' },
  });
  if (!res.ok) return null;
  const results = await res.json();
  if (!results?.[0]) return null;
  return { latitude: Number(results[0].lat), longitude: Number(results[0].lon) };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderPage(title: string, body: string): NextResponse {
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; max-width: 640px; margin: 40px auto; padding: 0 16px; color: #18181b; }
  h1 { font-size: 20px; }
  li { margin-bottom: 4px; }
  .ok { color: #16a34a; } .skip { color: #a1a1aa; } .err { color: #dc2626; }
  a.btn { display: inline-block; margin-top: 20px; padding: 12px 20px; background: #dc2626; color: white; text-decoration: none; border-radius: 12px; font-weight: 700; }
</style></head>
<body>${body}</body></html>`;
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

export async function GET(request: NextRequest) {
  const expectedSecret = process.env.ADMIN_DIRECTORY_SECRET;
  const secret = request.nextUrl.searchParams.get('secret');
  if (!expectedSecret || secret !== expectedSecret) {
    return renderPage('Forbidden', `<h1>Invalid or missing secret</h1><p>Add <code>?secret=...</code> to the URL.</p>`);
  }

  const offset = Number(request.nextUrl.searchParams.get('offset') ?? '0');
  const batch = DIRECTORY_SEED_DATA.slice(offset, offset + BATCH_SIZE);
  const total = DIRECTORY_SEED_DATA.length;

  const lines: string[] = [];
  for (const entry of batch) {
    if (!entry.phone) {
      lines.push(`<li class="skip">— skipped (no phone on file): ${escapeHtml(entry.name)}</li>`);
      continue;
    }

    const location = await geocode(entry.address);
    await sleep(150);

    if (!location) {
      lines.push(`<li class="err">✗ could not geocode: ${escapeHtml(entry.name)}</li>`);
      continue;
    }

    try {
      const { created } = await createDirectoryListingIfNew({
        name: entry.name,
        category: entry.category,
        area: entry.area,
        latitude: location.latitude,
        longitude: location.longitude,
        phone: entry.phone,
        hours: entry.hours,
        isOpen24x7: entry.isOpen24x7,
      });
      lines.push(
        created
          ? `<li class="ok">✓ added: ${escapeHtml(entry.name)}</li>`
          : `<li class="skip">— already exists: ${escapeHtml(entry.name)}</li>`
      );
    } catch (err: any) {
      lines.push(`<li class="err">✗ error: ${escapeHtml(entry.name)} — ${escapeHtml(err.message ?? 'unknown')}</li>`);
    }
  }

  const nextOffset = offset + BATCH_SIZE;
  const done = nextOffset >= total;
  const processedSoFar = Math.min(nextOffset, total);

  const continueLink = done
    ? `<a class="btn" href="/directory">All done — view the directory →</a>`
    : `<a class="btn" href="/api/admin/directory/bulk-import?secret=${encodeURIComponent(secret)}&offset=${nextOffset}">Continue (${processedSoFar}/${total}) →</a>`;

  return renderPage(
    'Directory import',
    `<h1>Directory import — batch ${Math.floor(offset / BATCH_SIZE) + 1}</h1>
     <p>${processedSoFar} of ${total} entries processed.</p>
     <ul>${lines.join('')}</ul>
     ${continueLink}`
  );
}
