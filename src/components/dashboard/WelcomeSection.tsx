"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface WelcomeSectionProps {
  userName: string;
}

export function WelcomeSection({ userName }: WelcomeSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--foreground)] uppercase tracking-tight leading-tight">
            GOOD EVENING, {userName.toUpperCase()}
          </h1>
          <p className="text-zinc-400 mt-2 text-sm sm:text-base">
            YOUR FRESHER JOURNEY STARTS HERE.
          </p>
        </div>
        <Link
          href="/profile"
          className="self-start sm:self-auto rounded-full px-5 py-2.5 border border-white/[0.12] text-[var(--foreground)] text-sm font-medium hover:bg-white/[0.04] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          View Profile
        </Link>
      </div>
      <p className="text-zinc-500 mt-4 text-sm max-w-xl">
        Events, games, new people and memories — all in one place.
      </p>
    </motion.div>
  );
}