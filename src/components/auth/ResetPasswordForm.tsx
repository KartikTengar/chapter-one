"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { getRecoveryUser, updatePassword, finishPasswordReset, getAuthErrorMessage } from "@/lib/supabase/auth";
import { Button } from "@/components/ui/Button";
import { PasswordField } from "./PasswordField";
import { FormMessage } from "./FormMessage";
import { validatePasswords, hasErrors, focusFirstError, type FieldErrors } from "./validation";
import styles from "./AuthShell.module.scss";

export function ResetPasswordForm({ invalidLink = false }: { invalidLink?: boolean }) {
  const [sessionState, setSessionState] = useState<"checking" | "ready" | "invalid" | "unavailable">("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState(false);
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);
  const check = useRef<ReturnType<typeof getRecoveryUser> | null>(null);

  useEffect(() => {
    let canceled = false;
    if (invalidLink) return () => { canceled = true; };
    check.current ??= getRecoveryUser();
    void check.current.then((result) => {
      if (canceled) return;
      if (result.error) {
        setError(result.error.message);
        setSessionState("unavailable");
      } else setSessionState(result.user ? "ready" : "invalid");
    });
    return () => { canceled = true; };
  }, [invalidLink]);

  async function completeSignOut() {
    const result = await finishPasswordReset();
    if (result.error) {
      setError(`Your password was updated, but sign-out did not finish. ${result.error.message} Retry sign-out below.`);
      return false;
    }
    window.location.replace("/login?status=password-updated");
    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || sessionState !== "ready") return;
    setError("");
    if (!updated) {
      const validation = validatePasswords(password, confirmPassword);
      setErrors(validation);
      if (hasErrors(validation)) {
        focusFirstError(event.currentTarget, validation);
        return;
      }
    }
    submitting.current = true;
    setLoading(true);
    let navigating = false;
    let passwordWasUpdated = updated;
    try {
      if (!passwordWasUpdated) {
        const result = await updatePassword(password);
        if (result.error) {
          setError(result.error.message);
          return;
        }
        passwordWasUpdated = true;
        setUpdated(true);
        setPassword("");
        setConfirmPassword("");
      }
      navigating = await completeSignOut();
    } catch (error: unknown) {
      setError(`${passwordWasUpdated ? "Your password was updated, but sign-out did not finish. " : ""}${getAuthErrorMessage(error)}`);
    } finally {
      if (!navigating) {
        submitting.current = false;
        setLoading(false);
      }
    }
  }

  if (invalidLink || sessionState === "invalid") return (
    <div className={styles.form}>
      <FormMessage message="No valid reset session was found. Open the latest reset link in the browser where you requested it, or request a new link." error />
      <Link href="/forgot-password">Request a new reset link</Link>
    </div>
  );
  if (sessionState === "checking") return <p role="status" className={styles.notice}>Checking your reset session…</p>;
  if (sessionState === "unavailable") return (
    <div className={styles.form}>
      <FormMessage message={error} error />
      <Button variant="secondary" onClick={() => window.location.reload()}>Retry session check</Button>
      <Link href="/forgot-password">Request a new reset link</Link>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate aria-busy={loading}>
      {updated ? <FormMessage message="Your password has been updated. Finish signing out before signing in with your new password." /> : <>
        <PasswordField id="reset-password" name="password" label="New password" autoComplete="new-password" required minLength={8} maxLength={128} aria-describedby="reset-password-hint" value={password} onChange={(event) => setPassword(event.target.value)} error={errors.password} disabled={loading} />
        <p id="reset-password-hint" className={styles.hint}>Use 8–128 characters and a password you have not used before.</p>
        <PasswordField id="reset-confirm" name="confirmPassword" label="Confirm new password" autoComplete="new-password" required minLength={8} maxLength={128} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} error={errors.confirmPassword} disabled={loading} />
      </>}
      <FormMessage message={error} error />
      <Button type="submit" loading={loading} className={styles.submit}>{loading ? (updated ? "Signing out…" : "Updating password…") : (updated ? "Retry sign-out" : "Update password")}</Button>
      {!updated && <Link href="/forgot-password">Request a new reset link</Link>}
    </form>
  );
}
