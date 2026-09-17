import { NextResponse } from 'next/server';

/**
 * TEMPORARY diagnostic endpoint — deployed while tracking down an
 * invisible-character corruption in a copy-pasted Supabase env var
 * (see storage.ts's sanitizeEnvValue). Reports only structural metadata
 * (length, char codes at the edges, positions/codes of any character
 * outside Latin-1) — never the actual secret value, so it's safe to
 * share the JSON output in chat. DELETE THIS ROUTE once the corruption
 * is found and fixed; it has no business existing in the app long-term.
 */
function analyze(value: string | undefined) {
  if (value === undefined) return { present: false };
  const badChars: Array<{ index: number; code: number }> = [];
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code > 255) badChars.push({ index: i, code });
  }
  return {
    present: true,
    length: value.length,
    firstCharCodes: value.slice(0, 8).split('').map((c) => c.charCodeAt(0)),
    lastCharCodes: value.slice(-8).split('').map((c) => c.charCodeAt(0)),
    badChars,
  };
}

export async function GET() {
  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: analyze(process.env.NEXT_PUBLIC_SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: analyze(process.env.SUPABASE_SERVICE_ROLE_KEY),
    STORAGE_BUCKET_PHOTOS: analyze(process.env.STORAGE_BUCKET_PHOTOS),
  });
}
