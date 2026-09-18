import { NextRequest, NextResponse } from 'next/server';
import { DIRECTORY_SEED_DATA } from '@/lib/directory-seed-data';
import { createDirectoryListingIfNew } from '@/lib/directory-admin';

/**
 * Runs the curated-data import (src/lib/directory-seed-data.ts) entirely
 * inside Vercel's serverless runtime, writing straight to the database —
 * no terminal, no direct DB access, just opening a URL. Originally this
 * also geocoded each address at request time via Nominatim, but every
 * single request failed with "could not geocode" when run from Vercel:
 * Nominatim (and similarly-policied free geocoders) actively throttle or
 * block cloud datacenter IP ranges, which is exactly what a Vercel
 * function calls from. directory-seed-data.ts now carries pre-set
 * neighbourhood-level coordinates instead, so this route has no external
 * dependency left and completes in one request — no more batching or
 * "Continue" clicking needed.
 *
 * GET with ?secret=... runs the whole import and returns an HTML report.
 * Idempotent: re-opening the URL only skips anything already imported,
 * via the same ~100m+name dedupe the single-listing admin route uses.
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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

  const lines: string[] = [];
  const tally = { created: 0, skipped: 0, error: 0, noPhone: 0 };

  for (const entry of DIRECTORY_SEED_DATA) {
    if (!entry.phone) {
      lines.push(`<li class="skip">— skipped (no phone on file): ${escapeHtml(entry.name)}</li>`);
      tally.noPhone++;
      continue;
    }

    try {
      const { created } = await createDirectoryListingIfNew({
        name: entry.name,
        category: entry.category,
        area: entry.area,
        latitude: entry.latitude,
        longitude: entry.longitude,
        phone: entry.phone,
        hours: entry.hours,
        isOpen24x7: entry.isOpen24x7,
      });
      if (created) {
        lines.push(`<li class="ok">✓ added: ${escapeHtml(entry.name)}</li>`);
        tally.created++;
      } else {
        lines.push(`<li class="skip">— already exists: ${escapeHtml(entry.name)}</li>`);
        tally.skipped++;
      }
    } catch (err: any) {
      lines.push(`<li class="err">✗ error: ${escapeHtml(entry.name)} — ${escapeHtml(err.message ?? 'unknown')}</li>`);
      tally.error++;
    }
  }

  return renderPage(
    'Directory import',
    `<h1>Directory import — done</h1>
     <p>Added ${tally.created}, already present ${tally.skipped}, no phone on file ${tally.noPhone}, errors ${tally.error} — ${DIRECTORY_SEED_DATA.length} total.</p>
     <ul>${lines.join('')}</ul>
     <a class="btn" href="/directory">View the directory →</a>`
  );
}
