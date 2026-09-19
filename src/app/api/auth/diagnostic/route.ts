import { assertSupabaseEnv } from "@/lib/supabase/env-check";
import { NextResponse } from "next/server";

export async function GET() {
  const headers = { "Cache-Control": "private, no-store, max-age=0", Pragma: "no-cache", Expires: "0" };
  if (process.env.NODE_ENV !== "development") return new NextResponse(null, { status: 404, headers });
  const config = assertSupabaseEnv();
  return NextResponse.json({
    ok: config.ok,
    supabaseUrlConfigured: config.url,
    supabasePublicKeyConfigured: config.key,
  }, { headers });
}
