"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signUp } from "@/lib/supabase/auth";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  const urlMessage = searchParams.get("message");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(() =>
    urlError
      ? urlError === "confirmation_failed"
        ? "Email confirmation failed. Please try again."
        : urlError === "missing_code"
        ? "Invalid confirmation link. Please sign up again."
        : "An error occurred. Please try again."
      : ""
  );
  const [message, setMessage] = useState(urlMessage ?? "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: err } = await signUp({
        fullName,
        email,
        password,
      });

      if (err) {
        const isNetworkError =
          err.code === "NETWORK_ERROR" ||
          err.name === "NetworkError" ||
          err.message?.includes("Network error") ||
          err.status === 0;

        if (isNetworkError) {
          setError(
            "Unable to connect to the authentication service. Please check your connection and try again."
          );
        } else if (err.status === 400 && err.message.includes("User already registered")) {
          setError("An account with this email already exists.");
        } else if (err.status === 400 && err.message.includes("Password")) {
          setError("Password is too weak. Use at least 6 characters.");
        } else {
          setError(err.message || "Unable to create account. Please try again.");
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        if (data.session) {
          router.replace("/dashboard");
          router.refresh();
        } else {
          setMessage(
            "Account created. Check your email to verify your account."
          );
        }
      } else {
        setError("Account creation succeeded but no user was returned.");
      }
    } catch {
      setError(
        "Unable to connect to the authentication service. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label
          htmlFor="fullName"
          className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2"
        >
          Full Name
        </label>
        <input
          id="fullName"
          type="text"
          required
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-xl bg-[var(--surface)] border border-white/[0.06] px-4 py-3 text-[var(--foreground)] text-base outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors"
          placeholder="Your full name"
        />
      </div>

      <div>
        <label
          htmlFor="signup-email"
          className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2"
        >
          Email
        </label>
        <input
          id="signup-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl bg-[var(--surface)] border border-white/[0.06] px-4 py-3 text-[var(--foreground)] text-base outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors"
          placeholder="you@college.edu"
        />
      </div>

      <div>
        <label
          htmlFor="signup-password"
          className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2"
        >
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl bg-[var(--surface)] border border-white/[0.06] px-4 py-3 text-[var(--foreground)] text-base outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors"
          placeholder="At least 6 characters"
        />
      </div>

      <div>
        <label
          htmlFor="confirm-password"
          className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2"
        >
          Confirm Password
        </label>
        <input
          id="confirm-password"
          type="password"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full rounded-xl bg-[var(--surface)] border border-white/[0.06] px-4 py-3 text-[var(--foreground)] text-base outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors"
          placeholder="Confirm your password"
        />
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {message && (
        <p className="text-sm text-emerald-400">{message}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-[var(--accent)] text-[var(--background)] font-bold py-4 text-base transition-all hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
      >
        {loading ? "Creating account..." : "CREATE ACCOUNT"}
      </button>
    </form>
  );
}