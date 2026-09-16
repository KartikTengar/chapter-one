"use client";

import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 py-12">
      <div className="max-w-md w-full">
        {/* Branding */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black tracking-wider uppercase text-[var(--foreground)] mb-2">
            CHAPTER ONE
          </h1>
          <p className="text-zinc-400 text-sm tracking-widest uppercase">
            FRESHERS 2026
          </p>
        </div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-[var(--surface)] border border-white/[0.06] rounded-2xl p-8 backdrop-blur-md"
        >
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-1">
            Forgot Password
          </h2>
          <p className="text-zinc-400 text-sm mb-6">
            Enter your email and we&apos;ll send you a reset link.
          </p>

          <ForgotPasswordForm />

          <div className="mt-6 text-center">
            <p className="text-zinc-400 text-sm">
              Remember your password?{" "}
              <a
                href="/login"
                className="text-[var(--accent)] hover:underline font-medium transition-colors"
              >
                Back to login
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
