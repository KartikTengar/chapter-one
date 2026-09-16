"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resetPassword } from "@/lib/supabase/auth";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await resetPassword(email);
      if (result.error) {
        const isNetworkError =
          result.error.code === "NETWORK_ERROR" ||
          result.error.name === "NetworkError" ||
          result.error.status === 0 ||
          result.error.message?.includes("Network error");

        if (isNetworkError) {
          setError(
            "Unable to connect to the authentication service. Please try again."
          );
        } else {
          setError("Unable to send reset email. Please try again.");
        }
        setLoading(false);
        return;
      }
      setSent(true);
    } catch {
      setError("Unable to connect to the authentication service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--accent)]/15 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-[var(--accent)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-[var(--foreground)] font-medium">
          Check your email for a password reset link.
        </p>
        <button
          onClick={() => router.replace("/login")}
          className="text-[var(--accent)] text-sm hover:underline mt-2"
        >
          Back to login
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label
          htmlFor="reset-email"
          className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2"
        >
          Email
        </label>
        <input
          id="reset-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl bg-[var(--surface)] border border-white/[0.06] px-4 py-3 text-[var(--foreground)] text-base outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors"
          placeholder="you@college.edu"
        />
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-[var(--accent)] text-[var(--background)] font-bold py-4 text-base transition-all hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
      >
        {loading ? "Sending..." : "SEND RESET LINK"}
      </button>
    </form>
  );
}