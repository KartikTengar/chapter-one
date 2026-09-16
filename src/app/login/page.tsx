"use client";

import { LoginForm } from "@/components/auth/LoginForm";
import { motion } from "framer-motion";

export default function LoginPage() {
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
            Welcome Back
          </h2>
          <p className="text-zinc-400 text-sm mb-6">
            Continue your FRESHERS EXPERIENCE.
          </p>

          <LoginForm />

          <div className="mt-6 text-center">
            <p className="text-zinc-400 text-sm">
              New here?{" "}
              <a
                href="/signup"
                className="text-[var(--accent)] hover:underline font-medium transition-colors"
              >
                Create your account
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
