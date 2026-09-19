import { createClient } from "@/lib/supabase/client";
import { AUTH_CONFIG_MESSAGE, isAuthConfigError } from "@/lib/auth/errors";

type ErrorDetails = { code?: string; status?: number; name?: string; message?: string };

function details(error: unknown): ErrorDetails {
  return error && typeof error === "object" ? error as ErrorDetails : {};
}

export function getAuthErrorMessage(error: unknown): string {
  if (isAuthConfigError(error)) return AUTH_CONFIG_MESSAGE;
  const err = details(error);
  if (err.status === 429 || err.code === "over_email_send_rate_limit" || err.code === "over_request_rate_limit") {
    return "Too many requests. Please wait a few minutes and try again.";
  }
  switch (err.code) {
    case "invalid_credentials": return "The email or password is incorrect.";
    case "email_not_confirmed": return "Please confirm your email before signing in. Check your inbox for the confirmation link.";
    case "weak_password": return "Please choose a stronger password with at least 8 characters.";
    case "same_password": return "Choose a password different from your current password.";
    case "session_not_found":
    case "refresh_token_not_found":
    case "refresh_token_already_used":
    case "otp_expired": return "This session or link has expired. Please request a new reset link.";
    case "configuration_error": return "Authentication is temporarily unavailable. Please try again later.";
  }
  if (/NEXT_PUBLIC_|Invalid (supabaseUrl|URL)|supabaseUrl is required|supabaseKey is required/i.test(err.message ?? "")) {
    return "Authentication is temporarily unavailable. Please try again later.";
  }
  if (err.code === "NETWORK_ERROR" || err.name === "NetworkError" || err.name === "AuthRetryableFetchError" || err.status === 0 || /Failed to fetch|fetch failed|network|Load failed/i.test(err.message ?? "")) {
    return "Unable to reach the authentication service. Check your connection and try again.";
  }
  return "Something went wrong. Please try again.";
}

function safeError(error: unknown) {
  const err = details(error);
  return {
    message: getAuthErrorMessage(error),
    code: typeof err.code === "string" ? err.code : "unexpected_error",
    status: typeof err.status === "number" ? err.status : undefined,
    name: "AuthenticationError",
  };
}

function callbackUrl(next: "/dashboard" | "/reset-password") {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const origin = configured || (typeof window !== "undefined" ? window.location.origin : "");
  try {
    const url = new URL(origin);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
      throw new Error();
    }
    return `${url.origin}/api/auth/callback?next=${next}`;
  } catch {
    throw { code: "configuration_error" };
  }
}

export async function signUp(formData: { fullName: string; email: string; password: string }) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: formData.email.trim(),
      password: formData.password,
      options: {
        data: { full_name: formData.fullName.trim() },
        emailRedirectTo: callbackUrl("/dashboard"),
      },
    });
    if (error && ["user_already_exists", "email_exists", "email_already_exists"].includes(error.code ?? "")) {
      return { data: { user: null, session: null }, error: null };
    }
    return { data, error: error ? safeError(error) : null };
  } catch (error: unknown) {
    return { data: { user: null, session: null }, error: safeError(error) };
  }
}

export async function signIn(email: string, password: string) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return { data, error: error ? safeError(error) : null };
  } catch (error: unknown) {
    return { data: { user: null, session: null }, error: safeError(error) };
  }
}

export async function signOut() {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut({ scope: "local" });
    return { error: error ? safeError(error) : null };
  } catch (error: unknown) {
    return { error: safeError(error) };
  }
}

export async function resetPassword(email: string) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: callbackUrl("/reset-password"),
    });
    if (error?.code === "user_not_found") return { data: {}, error: null };
    return { data, error: error ? safeError(error) : null };
  } catch (error: unknown) {
    return { data: null, error: safeError(error) };
  }
}

export async function getRecoveryUser() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error?.name === "AuthSessionMissingError") return { user: null, error: null };
    return { user: data.user, error: error ? safeError(error) : null };
  } catch (error: unknown) {
    return { user: null, error: safeError(error) };
  }
}

export async function updatePassword(password: string) {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error ? safeError(error) : null };
  } catch (error: unknown) {
    return { error: safeError(error) };
  }
}

export async function finishPasswordReset() {
  const local = await signOut();
  if (local.error) return local;
  try {
    const response = await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin", cache: "no-store", redirect: "error" });
    if (!response.ok) return { error: safeError({ status: response.status }) };
    const result: unknown = await response.json();
    if (!result || typeof result !== "object" || !("ok" in result) || result.ok !== true) {
      return { error: safeError({ code: "logout_not_confirmed" }) };
    }
    return { error: null };
  } catch (error: unknown) {
    return { error: safeError(error) };
  }
}

export async function updateProfile(userId: string, formData: {
  full_name?: string;
  phone?: string;
  year?: string;
  branch?: string;
  college_id?: string;
}) {
  try {
    const supabase = createClient();
    const fields = ["full_name", "phone", "year", "branch", "college_id"] as const;
    const updates = Object.fromEntries(fields.flatMap((key) => typeof formData[key] === "string" ? [[key, formData[key]]] : []));
    const { data, error } = await supabase.from("profiles").update(updates).eq("id", userId).select().single();
    return { data, error: error ? safeError(error) : null };
  } catch (error: unknown) {
    return { data: null, error: safeError(error) };
  }
}
