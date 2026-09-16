import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(_req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasKey = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return NextResponse.json({
    supabaseUrlConfigured: Boolean(url),
    supabasePublicKeyConfigured: hasKey,
    supabaseHost: url ? new URL(url).hostname : null,
    supabaseUrl: url ?? null,
    timestamp: new Date().toISOString(),
  });
}