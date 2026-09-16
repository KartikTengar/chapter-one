import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const getSupabaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
};

const getSupabaseKey = (): string => {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ""
  );
};

export async function createServerClient() {
  const cookieStore = await cookies();
  const url = getSupabaseUrl();
  const key = getSupabaseKey();

  return createSupabaseServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
        }
      },
    },
  });
}

export async function getUser() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getSession() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) {
    return null;
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!user) {
    return null;
  }
  const supabase = await createServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return null;
  }
  return user;
}