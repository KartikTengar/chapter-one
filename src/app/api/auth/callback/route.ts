import { authenticatedDestination } from "@/lib/auth/redirects";
import { isAuthConfigError } from "@/lib/auth/errors";
import { applicationOrigin } from "@/lib/supabase/env-check";
import { createRouteClient, noStore } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

function callbackError(code: unknown): "expired_link" | "callback_failed" {
  return ["otp_expired", "flow_state_expired", "flow_state_not_found", "bad_code_verifier", "expired_link"].includes(String(code))
    ? "expired_link"
    : "callback_failed";
}

export async function GET(request: NextRequest) {
  let origin: string;
  try {
    origin = applicationOrigin(request.nextUrl.origin);
  } catch {
    return noStore(NextResponse.json({ error: "Authentication is not configured.", code: "AUTH_CONFIG" }, { status: 503 }));
  }

  const failure = (code: string) => noStore(NextResponse.redirect(new URL(`/login?error=${code}`, origin)));
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  if (searchParams.has("error") || searchParams.has("error_code")) {
    return failure(callbackError(searchParams.get("error_code") ?? searchParams.get("error")));
  }
  if (!code || searchParams.getAll("code").length !== 1) return failure("callback_failed");

  let adapter: ReturnType<typeof createRouteClient> | undefined;
  try {
    adapter = createRouteClient(request);
    const { error } = await adapter.supabase.auth.exchangeCodeForSession(code);
    if (error) return adapter.applyCookies(failure(callbackError(error.code)));

    const { data: { user }, error: userError } = await adapter.supabase.auth.getUser();
    if (userError || !user) return adapter.applyCookies(failure("callback_failed"));

    const requested = searchParams.get("next") ?? searchParams.get("redirect");
    if (requested === "/reset-password") {
      return adapter.applyCookies(NextResponse.redirect(new URL("/reset-password", origin)));
    }

    const { data: profile, error: profileError } = await adapter.supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const destination = authenticatedDestination(profileError ? null : profile?.role, requested);
    return adapter.applyCookies(NextResponse.redirect(new URL(destination, origin)));
  } catch (error) {
    const response = failure(isAuthConfigError(error) ? "AUTH_CONFIG" : "callback_failed");
    return adapter ? adapter.applyCookies(response) : response;
  }
}
