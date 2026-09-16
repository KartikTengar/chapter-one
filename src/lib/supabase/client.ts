import { createBrowserClient } from "@supabase/ssr";

const getSupabaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
};

const getSupabaseKey = (): string => {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ""
  );
}

function validateEnv() {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
  }
  if (!key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) environment variable");
  }
  
  // In development, allow placeholder values but warn
  const isDev = process.env.NODE_ENV === "development";
  if (!isDev) {
    if (url.includes("YOUR_PROJECT_REF") || url.includes("YOUR_PROJECT_REF.supabase.co")) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL is set to a placeholder value. Please set a valid Supabase project URL in .env.local");
    }
    if (key.includes("YOUR_ANON_PUBLIC_KEY")) {
      throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is set to a placeholder value. Please set a valid Supabase anon/public key in .env.local");
    }
  } else if (url.includes("YOUR_PROJECT_REF") || key.includes("YOUR_ANON_PUBLIC_KEY")) {
    // In development, warn but don't throw - allows development without real credentials
    console.warn("[DEV] Supabase using placeholder credentials. Set real credentials in .env.local for full functionality.");
  }
}

export function createClient() {
  validateEnv();
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  return createBrowserClient(url, key);
}
