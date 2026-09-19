import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { sanitizeAuthRedirect, type AuthSearchParams } from "@/components/auth/validation";

export const metadata: Metadata = {
  title: "Sign in | Chapter One",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<AuthSearchParams> }) {
  const query = await searchParams;
  return (
    <AuthShell title="Welcome back." description="Sign in to continue your Chapter One experience." searchParams={query} footer={<p>New here? <Link href="/signup">Create your account</Link></p>}>
      <LoginForm redirectTo={sanitizeAuthRedirect(query.redirect)} />
    </AuthShell>
  );
}
