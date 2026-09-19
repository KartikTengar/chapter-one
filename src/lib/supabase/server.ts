import "server-only";
import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { authCookieOptions, getSupabaseConfig } from "@/lib/supabase/env-check";

export function noStore<T extends NextResponse>(response: T): T {
  response.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export function createRouteClient(request: NextRequest) {
  const { url, key } = getSupabaseConfig();
  const pending = noStore(new NextResponse(null));
  const supabase = createSupabaseServerClient(url, key, {
    cookieOptions: authCookieOptions(),
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          pending.cookies.set(name, value, { ...options, ...authCookieOptions() });
        });
        Object.entries(headers).forEach(([name, value]) => pending.headers.set(name, value));
      },
    },
  });

  return {
    supabase,
    clearAuthCookies() {
      const storageKey = `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;
      const names = new Set([
        ...request.cookies.getAll().map(({ name }) => name),
        ...pending.cookies.getAll().map(({ name }) => name),
      ]);
      for (const name of names) {
        const suffix = name.slice(storageKey.length);
        if (name.startsWith(storageKey) && /^(?:\.\d+|-code-verifier(?:\.\d+)?)?$/.test(suffix)) {
          request.cookies.delete(name);
          pending.cookies.set(name, "", { ...authCookieOptions(), maxAge: 0 });
        }
      }
    },
    applyCookies<T extends NextResponse>(response: T): T {
      pending.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
      pending.headers.forEach((value, name) => {
        if (name !== "set-cookie") response.headers.set(name, value);
      });
      return noStore(response);
    },
  };
}

export async function createServerClient() {
  const { url, key } = getSupabaseConfig();
  const cookieStore = await cookies();
  return createSupabaseServerClient(url, key, {
    cookieOptions: authCookieOptions(),
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, { ...options, ...authCookieOptions() })
          );
        } catch {}
      },
    },
  });
}

export async function getUser() {
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return error ? null : user;
}

export async function requireUser() {
  return getUser();
}

export async function requireAdmin() {
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return !profileError && profile?.role === "admin" ? user : null;
}
