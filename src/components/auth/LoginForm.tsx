"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { signIn, getAuthErrorMessage } from "@/lib/supabase/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordField } from "./PasswordField";
import { FormMessage } from "./FormMessage";
import { validateEmail, hasErrors, focusFirstError, loginDestination, type FieldErrors } from "./validation";
import styles from "./AuthShell.module.scss";

export function LoginForm({ redirectTo }: { redirectTo?: string } = {}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const validation = { email: validateEmail(email), password: !password || password.length > 128 ? "Enter your password (up to 128 characters)." : undefined };
    setErrors(validation);
    setError("");
    if (hasErrors(validation)) {
      focusFirstError(event.currentTarget, validation);
      return;
    }
    submitting.current = true;
    setLoading(true);
    let navigating = false;
    try {
      const result = await signIn(email, password);
      if (result.error) setError(result.error.message);
      else if (!result.data.session) setError("Sign-in could not be completed. Please try again.");
      else {
        window.location.replace(loginDestination(redirectTo));
        navigating = true;
      }
    } catch (error: unknown) {
      setError(getAuthErrorMessage(error));
    } finally {
      if (!navigating) {
        submitting.current = false;
        setLoading(false);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate aria-busy={loading}>
      <Input id="login-email" name="email" label="Email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} error={errors.email} disabled={loading} />
      <PasswordField id="login-password" name="password" label="Password" autoComplete="current-password" required maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} error={errors.password} disabled={loading} />
      <Link href="/forgot-password" className={styles.formLink}>Forgot password?</Link>
      <FormMessage message={error} error />
      <Button type="submit" loading={loading} className={styles.submit}>{loading ? "Signing in…" : "Sign in"}</Button>
    </form>
  );
}
