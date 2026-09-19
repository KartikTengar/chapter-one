import { AUTH_CONFIG_MESSAGE, isAuthConfigError } from "@/lib/auth/errors";
import { applicationOrigin } from "@/lib/supabase/env-check";
import { createRouteClient, noStore } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const failure = (error: string, code: string, status: number) =>
    noStore(NextResponse.json({ ok: false, error, code }, { status }));

  let origin: string;
  try {
    origin = applicationOrigin(request.nextUrl.origin);
  } catch {
    return failure(AUTH_CONFIG_MESSAGE, "AUTH_CONFIG", 503);
  }

  if (request.headers.get("origin") !== origin || request.headers.get("sec-fetch-site") === "cross-site") {
    return failure("Invalid request origin.", "INVALID_ORIGIN", 403);
  }

  let adapter: ReturnType<typeof createRouteClient> | undefined;
  try {
    adapter = createRouteClient(request);
    const { error } = await adapter.supabase.auth.signOut({ scope: "local" });
    if (error) return adapter.applyCookies(failure("Unable to sign out. Please try again.", "LOGOUT_FAILED", 500));
    adapter.clearAuthCookies();
    return adapter.applyCookies(NextResponse.json({ ok: true }));
  } catch (error) {
    const response = isAuthConfigError(error)
      ? failure(AUTH_CONFIG_MESSAGE, "AUTH_CONFIG", 503)
      : failure("Unable to sign out. Please try again.", "LOGOUT_FAILED", 500);
    return adapter ? adapter.applyCookies(response) : response;
  }
}
