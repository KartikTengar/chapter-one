"use client";

import { useRef, useState, type FormEvent } from "react";
import { signUp, getAuthErrorMessage } from "@/lib/supabase/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordField } from "./PasswordField";
import { FormMessage } from "./FormMessage";
import { validateEmail, validatePasswords, hasErrors, focusFirstError, type FieldErrors } from "./validation";
import styles from "./AuthShell.module.scss";

export function SignupForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const validation: FieldErrors = {
      fullName: !fullName.trim() || fullName.trim().length > 100 ? "Enter your full name (up to 100 characters)." : undefined,
      email: validateEmail(email),
      ...validatePasswords(password, confirmPassword),
    };
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
      const result = await signUp({ fullName, email, password });
      if (result.error) setError(result.error.message);
      else if (result.data.session) {
        window.location.replace("/login");
        navigating = true;
      } else {
        setPassword("");
        setConfirmPassword("");
        setSent(true);
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

  if (sent) return <FormMessage message="Check your inbox for a confirmation link if your email is eligible for a new account. If you already have an account, sign in or reset your password." />;

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate aria-busy={loading}>
      <Input id="signup-name" name="fullName" label="Full name" autoComplete="name" required maxLength={100} value={fullName} onChange={(event) => setFullName(event.target.value)} error={errors.fullName} disabled={loading} />
      <Input id="signup-email" name="email" label="Email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} error={errors.email} disabled={loading} />
      <PasswordField id="signup-password" name="password" label="Password" autoComplete="new-password" required minLength={8} maxLength={128} aria-describedby="signup-password-hint" value={password} onChange={(event) => setPassword(event.target.value)} error={errors.password} disabled={loading} />
      <p id="signup-password-hint" className={styles.hint}>Use 8–128 characters. A unique passphrase works well.</p>
      <PasswordField id="signup-confirm" name="confirmPassword" label="Confirm password" autoComplete="new-password" required minLength={8} maxLength={128} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} error={errors.confirmPassword} disabled={loading} />
      <FormMessage message={error} error />
      <Button type="submit" loading={loading} className={styles.submit}>{loading ? "Creating account…" : "Create account"}</Button>
    </form>
  );
}
