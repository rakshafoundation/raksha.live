import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

/**
 * Local-filesystem fallback for case photo storage.
 *
 * TODO(production): swap this for S3-compatible storage (Supabase Storage
 * or Cloudflare R2) per build brief §9 — case photos are public content
 * and belong in a public bucket. Verification/compliance documents are a
 * different concern entirely: they must go in a *separate*, private,
 * encrypted bucket with admin-only access and must never be served by
 * this function or from /public.
 */
export async function saveCasePhoto(buffer: Buffer, mimeType: string): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
  const filename = `${randomUUID()}.${ext}`;
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return `/uploads/${filename}`;
}
