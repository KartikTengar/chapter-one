import { createClient } from "@/lib/supabase/client";

function getSupabaseClient() {
  return createClient();
}

function getErrorMessage(error: unknown): string {
  const err = error as Error & { status?: number; code?: string; name?: string; message?: string };
  
  // Check for specific Supabase error codes
  if (err.code === "email_not_confirmed") {
    return "Please check your email and confirm your account before logging in.";
  }
  if (err.code === "invalid_credentials") {
    return "Invalid email or password.";
  }
  if (err.code === "email_already_exists") {
    return "An account with this email already exists.";
  }
  if (err.code === "weak_password") {
    return "Password is too weak. Please use a stronger password.";
  }
  if (err.code === "over_email_send_rate_limit") {
    return "Too many requests. Please wait a moment and try again.";
  }
  
  // Check for network errors
  const isNetworkError =
    err.code === "NETWORK_ERROR" ||
    err.name === "NetworkError" ||
    err.status === 0 ||
    err.message?.includes("Network error") ||
    err.message?.includes("fetch failed") ||
    err.message?.includes("Failed to fetch");
  
  if (isNetworkError) {
    // Check if the error is due to invalid Supabase URL
    const msg = err.message || "";
    if (msg.includes("YOUR_PROJECT_REF") || msg.includes("YOUR_ANON_PUBLIC_KEY") || msg.includes("YOUR_PROJECT_REF.supabase.co")) {
      return "Supabase configuration error: Please set valid NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local";
    }
    return "Unable to connect to the authentication service. Please check your connection and try again.";
  }
  
  // Return the original error message if available
  return err.message || "An unexpected error occurred. Please try again.";
}

export async function signUp(formData: {
  fullName: string;
  email: string;
  password: string;
}) {
  const supabase = getSupabaseClient();
  try {
    const result = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          role: "student",
        },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      data: { user: null, session: null },
      error: {
        message: getErrorMessage(error),
        status: (error as Error & { status?: number }).status ?? 0,
        code: (error as Error & { code?: string }).code ?? "UNKNOWN_ERROR",
        name: (error as Error & { name?: string }).name ?? "Error",
      },
    };
  }
}

export async function signIn(email: string, password: string) {
  const supabase = getSupabaseClient();
  try {
    const result = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return result;
  } catch (error: unknown) {
    return {
      data: { user: null, session: null },
      error: {
        message: getErrorMessage(error),
        status: (error as Error & { status?: number }).status ?? 0,
        code: (error as Error & { code?: string }).code ?? "UNKNOWN_ERROR",
        name: (error as Error & { name?: string }).name ?? "Error",
      },
    };
  }
}

export async function signOut() {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();
  return { error: error ? { message: getErrorMessage(error) } : null };
}

export async function resetPassword(email: string) {
  const supabase = getSupabaseClient();
  const result = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "/login",
  });
  return result;
}

export async function updateProfile(userId: string, formData: {
  full_name?: string;
  phone?: string;
  year?: string;
  branch?: string;
  college_id?: string;
}) {
  const supabase = getSupabaseClient();
  const result = await supabase
    .from("profiles")
    .update(formData)
    .eq("id", userId)
    .select()
    .single();
  return result;
}

export async function getServerSession() {
  const supabase = getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
