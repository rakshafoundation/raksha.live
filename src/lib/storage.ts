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
export async function saveCasePhoto(buffer: Buffer, mimeType: string): Promise<string> {
  const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
  const filename = `${randomUUID()}.${ext}`;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.STORAGE_BUCKET_PHOTOS || 'raksha-case-photos';

  if (supabaseUrl && serviceRoleKey) {
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
