import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/SignupForm";
import type { AuthSearchParams } from "@/components/auth/validation";

export const metadata: Metadata = {
  title: "Create account | Chapter One",
  robots: { index: false, follow: false },
};

export default async function SignupPage({ searchParams }: { searchParams: Promise<AuthSearchParams> }) {
  const query = await searchParams;
  return (
    <AuthShell title="Start your chapter." description="Create an account and make this beginning yours." searchParams={query} footer={<p>Already have an account? <Link href="/login">Sign in</Link></p>}>
      <SignupForm />
    </AuthShell>
  );
}
