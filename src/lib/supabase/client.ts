import { createBrowserClient } from "@supabase/ssr";
import { authCookieOptions, getSupabaseConfig } from "@/lib/supabase/env-check";

export function createClient() {
  const { url, key } = getSupabaseConfig();
  return createBrowserClient(url, key, { cookieOptions: authCookieOptions() });
}
