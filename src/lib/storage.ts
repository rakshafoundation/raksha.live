import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

/**
 * Case photo storage. Uses Supabase Storage when configured
 * (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY set — see
 * .env.example); otherwise falls back to the local filesystem under
 * public/uploads/, which is enough for local dev but does NOT work on
 * a serverless host like Vercel (no persistent disk between
 * invocations) — real deployments must set the Supabase env vars.
 *
 * Case photos are public content and belong in a public bucket, which
 * is all this function writes to. Verification/compliance documents
 * are a different concern entirely: they need a *separate*, private,
 * encrypted bucket with admin-only access, and must never go through
 * this function — that upload path isn't built yet (see README).
 */
// Env vars set through a dashboard UI (copy-pasted across several apps, in
// this project's case) routinely pick up a leading Byte Order Mark or
// trailing whitespace/newline — invisible in any text field, but fatal to
// the HTTP client: header values must be Latin-1, and a BOM (U+FEFF) is
// not. Strip both defensively rather than trusting clean paste-in.
function sanitizeEnvValue(value: string): string {
  return value.replace(/^﻿/, '').trim();
}

export async function saveCasePhoto(buffer: Buffer, mimeType: string): Promise<string> {
  const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
  const filename = `${randomUUID()}.${ext}`;

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = sanitizeEnvValue(process.env.STORAGE_BUCKET_PHOTOS || 'raksha-case-photos');

  if (rawUrl && rawKey) {
    const supabaseUrl = sanitizeEnvValue(rawUrl);
    const serviceRoleKey = sanitizeEnvValue(rawKey);

    // Fails loudly with a specific, actionable message instead of the
    // opaque "ByteString" TypeError the fetch client throws when a header
    // value has a character outside Latin-1 — this pinpoints exactly
    // which env var still has a bad character even after sanitizing.
    // eslint-disable-next-line no-control-regex
    const badCharPattern = /[^\x00-\xFF]/;
    if (badCharPattern.test(supabaseUrl)) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL contains a non-Latin-1 character even after trimming — re-copy it fresh from Supabase.');
    }
    if (badCharPattern.test(serviceRoleKey)) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY contains a non-Latin-1 character even after trimming — re-copy it fresh from Supabase.');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { error } = await supabase.storage.from(bucket).upload(filename, buffer, {
      contentType: mimeType,
      upsert: false,
    });
    if (error) {
      throw new Error(`Supabase Storage upload failed: ${error.message}`);
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(filename);
    return data.publicUrl;
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return `/uploads/${filename}`;
}
