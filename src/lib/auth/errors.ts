export const AUTH_CONFIG_MESSAGE = "Authentication is not configured. Please contact the site administrator.";

export class AuthConfigError extends Error {
  readonly code = "AUTH_CONFIG";

  constructor() {
    super(AUTH_CONFIG_MESSAGE);
    this.name = "AuthConfigError";
  }
}

export function isAuthConfigError(error: unknown): error is AuthConfigError {
  return error instanceof AuthConfigError || (
    typeof error === "object" && error !== null &&
    "code" in error && error.code === "AUTH_CONFIG"
  );
}

export function getAuthErrorMessage(error: unknown): string {
  if (isAuthConfigError(error)) return AUTH_CONFIG_MESSAGE;
  const code = typeof error === "string" ? error : (
    typeof error === "object" && error !== null && "code" in error ? error.code : null
  );
  switch (code) {
    case "AUTH_CONFIG":
      return AUTH_CONFIG_MESSAGE;
    case "expired_link":
    case "otp_expired":
    case "flow_state_expired":
    case "flow_state_not_found":
      return "This link has expired or has already been used. Please request a new one.";
    case "callback_failed":
      return "We could not complete authentication. Please try again.";
    case "invalid_credentials":
      return "Invalid email or password.";
    case "email_not_confirmed":
      return "Please confirm your email before signing in.";
    default:
      return "Authentication failed. Please try again.";
  }
}
