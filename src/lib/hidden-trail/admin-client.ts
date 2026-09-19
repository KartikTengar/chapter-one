import { createClient as createSupabaseClient } from "@/lib/supabase/client";

export interface ClientAdminUser {
  id: string;
  email: string;
  role: string;
}

/**
 * Client-safe admin identity check (UI gating only).
 *
 * Uses the browser/anonymous Supabase client and reads the current user's own
 * profile role. This is NOT an authorization boundary — every privileged
 * operation is re-authorized server-side (Koa / Next API routes / RLS).
 */
export async function getClientAdminUser(): Promise<ClientAdminUser | null> {
  try {
    const supabase = createSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") return null;
    return {
      id: profile.id,
      email: profile.email ?? user.email ?? "",
      role: profile.role,
    };
  } catch {
    return null;
  }
}