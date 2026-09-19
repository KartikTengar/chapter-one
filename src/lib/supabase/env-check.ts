import { AuthConfigError, AUTH_CONFIG_MESSAGE } from "@/lib/auth/errors";

function isLocalHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

function validUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    if (!/^https?:\/\//.test(value) || value.includes("\\") || [...value].some((character) => character.charCodeAt(0) <= 32)) return null;
    if (url.username || url.password || url.search || url.hash) return null;
    if (url.pathname !== "/" || /your[_-]|placeholder|example\./i.test(value)) return null;
    if (url.protocol !== "https:" && !(
      process.env.NODE_ENV !== "production" && url.protocol === "http:" && isLocalHostname(url.hostname)
    )) return null;
    return url;
  } catch {
    return null;
  }
}

function publicKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";
}

function validPublicKey(key: string): boolean {
  if (/your[_-]|placeholder/i.test(key)) return false;
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return true;
  const parts = key.split(".");
  if (parts.length !== 3 || !parts.every((part) => /^[A-Za-z0-9_-]+$/.test(part))) return false;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.role === "anon";
  } catch {
    return false;
  }
}

export function assertSupabaseEnv(): { ok: boolean; url: boolean; key: boolean; message: string } {
  const url = validUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "") !== null;
  const key = validPublicKey(publicKey());
  return {
    ok: url && key,
    url,
    key,
    message: url && key ? "Authentication is configured." : AUTH_CONFIG_MESSAGE,
  };
}

export function getSupabaseConfig(): { url: string; key: string } {
  if (!assertSupabaseEnv().ok) throw new AuthConfigError();
  return { url: process.env.NEXT_PUBLIC_SUPABASE_URL!, key: publicKey() };
}

export function authCookieOptions() {
  return { path: "/", sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", httpOnly: false };
}

export function applicationOrigin(requestOrigin: string): string {
  const configured = validUrl(process.env.NEXT_PUBLIC_APP_URL ?? "");
  if (configured) return configured.origin;
  const local = validUrl(requestOrigin);
  if (process.env.NODE_ENV !== "production" && local && isLocalHostname(local.hostname)) return local.origin;
  throw new AuthConfigError();
}
