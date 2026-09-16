export function assertSupabaseEnv(): { ok: boolean; url: boolean; key: boolean; message: string } {
  const urlExists = typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" && process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0;
  const keyExists = typeof process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY === "string" && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.length > 0;
  const isDev = process.env.NODE_ENV === "development";
  
  // Check for placeholder values
  const urlHasPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("YOUR_PROJECT_REF") ?? false;
  const keyHasPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.includes("YOUR_ANON_PUBLIC_KEY") ?? false;
  
  // In development, allow placeholder values
  if (isDev && (urlHasPlaceholder || keyHasPlaceholder)) {
    return { 
      ok: true, 
      url: true, 
      key: true, 
      message: "Supabase using placeholder credentials in development mode. Set real credentials in .env.local for full functionality." 
    };
  }
  
  const urlValid = process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("https://") && process.env.NEXT_PUBLIC_SUPABASE_URL?.includes(".supabase.co");
  const ok = urlExists && keyExists && (isDev || (!urlHasPlaceholder && !keyHasPlaceholder));
  
  const message = !ok
    ? `Missing Supabase environment variables. Required: NEXT_PUBLIC_SUPABASE_URL (got: ${urlExists ? "present" : "missing"}), NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (got: ${keyExists ? "present" : "missing"}). Replace placeholder values in .env.local with real Supabase project settings.`
    : urlValid ? "Supabase environment configured correctly." : "NEXT_PUBLIC_SUPABASE_URL format may be incorrect (expected https://<ref>.supabase.co).";
  return { ok, url: urlExists, key: keyExists, message };
}
