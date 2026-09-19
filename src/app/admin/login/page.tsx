import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { sanitizeAuthRedirect, type AuthSearchParams } from "@/components/auth/validation";

export const metadata: Metadata = {
  title: "Organiser sign in | Chapter One",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<AuthSearchParams> }) {
  const query = await searchParams;
  return (
    <AuthShell title="Behind the scenes." description="Sign in with your Chapter One account. Organiser access is verified after sign-in; other accounts continue to their dashboard." searchParams={query} admin footer={<p>Looking for your account? <Link href="/login">Student sign in</Link></p>}>
      <LoginForm redirectTo={sanitizeAuthRedirect(query.redirect)} />
    </AuthShell>
  );
}
