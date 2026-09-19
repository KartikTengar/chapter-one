import { safeRedirectPath } from "@/lib/auth/redirects";

export type AuthSearchParams = Record<string, string | string[] | undefined>;
export type FieldErrors = Partial<Record<"fullName" | "email" | "password" | "confirmPassword", string>>;

export function validateEmail(email: string) {
  return email.trim().length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ? undefined : "Enter a valid email address.";
}

export function validatePasswords(password: string, confirmation: string): FieldErrors {
  return {
    password: password.length < 8 || password.length > 128 ? "Use between 8 and 128 characters." : undefined,
    confirmPassword: password !== confirmation ? "Passwords do not match." : undefined,
  };
}

export function hasErrors(errors: FieldErrors) {
  return Object.values(errors).some(Boolean);
}

export function focusFirstError(form: HTMLFormElement, errors: FieldErrors) {
  const field = Object.keys(errors).find((key) => errors[key as keyof FieldErrors]);
  if (field) (form.elements.namedItem(field) as HTMLInputElement | null)?.focus();
}

export function getQueryNotice(query: AuthSearchParams): { kind: "error" | "status"; message: string } | undefined {
  if (query.error === "expired_link") return { kind: "error", message: "This link has expired or has already been used. Please request a new link." };
  if (query.error === "callback_failed") return { kind: "error", message: "We could not verify this link. Please try signing in or request a new link." };
  if (query.status === "logged-out") return { kind: "status", message: "You have been signed out." };
  if (query.status === "password-updated") return { kind: "status", message: "Your password was updated. Sign in with your new password." };
  return undefined;
}

export function sanitizeAuthRedirect(value: string | string[] | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const safe = safeRedirectPath(value, "/");
  return safe === "/" ? undefined : safe;
}

export function loginDestination(redirectTo?: string) {
  const safe = sanitizeAuthRedirect(redirectTo);
  return safe ? `/login?${new URLSearchParams({ redirect: safe })}` : "/login";
}
