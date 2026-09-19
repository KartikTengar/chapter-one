"use client";

import { useRef, useState, type FormEvent } from "react";
import { resetPassword, getAuthErrorMessage } from "@/lib/supabase/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormMessage } from "./FormMessage";
import { validateEmail, focusFirstError } from "./validation";
import styles from "./AuthShell.module.scss";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string>();
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const validation = validateEmail(email);
    setEmailError(validation);
    setError("");
    if (validation) {
      focusFirstError(event.currentTarget, { email: validation });
      return;
    }
    submitting.current = true;
    setLoading(true);
    try {
      const result = await resetPassword(email);
      if (result.error) setError(result.error.message);
      else setSent(true);
    } catch (error: unknown) {
      setError(getAuthErrorMessage(error));
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  if (sent) return <FormMessage message="If an account exists for this email, you will receive a password reset link. Check your inbox and spam folder." />;

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate aria-busy={loading}>
      <Input id="forgot-email" name="email" label="Email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} error={emailError} disabled={loading} />
      <FormMessage message={error} error />
      <Button type="submit" loading={loading} className={styles.submit}>{loading ? "Sending link…" : "Send reset link"}</Button>
    </form>
  );
}
