import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import type { AuthSearchParams } from "@/components/auth/validation";

export const metadata: Metadata = {
  title: "Forgot password | Chapter One",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<AuthSearchParams> }) {
  const query = await searchParams;
  return (
    <AuthShell title="Find your way back." description="Enter your account email to request a password reset link. Open it in this browser." searchParams={query} footer={<p>Remember your password? <Link href="/login">Back to sign in</Link></p>}>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
