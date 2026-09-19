import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import type { AuthSearchParams } from "@/components/auth/validation";

export const metadata: Metadata = {
  title: "Reset password | Chapter One",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<AuthSearchParams> }) {
  const query = await searchParams;
  return (
    <AuthShell title="A fresh start." description="Choose a new password for your account. You will sign in again once it is updated." searchParams={query} footer={<p><Link href="/login">Back to sign in</Link></p>}>
      <ResetPasswordForm invalidLink={query.error === "expired_link" || query.error === "callback_failed"} />
    </AuthShell>
  );
}
