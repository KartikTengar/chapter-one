"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";

interface ProfileCompletionProps {
  completion: number;
  isComplete: boolean;
}

export function ProfileCompletion({ completion, isComplete }: ProfileCompletionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-[var(--surface)] border border-white/[0.06] rounded-2xl p-5 sm:p-6"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--foreground)]">
          YOUR PROFILE
        </h3>
        {isComplete ? (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
            <Check className="h-3 w-3" />
            Complete
          </span>
        ) : (
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
            {completion}%
          </span>
        )}
      </div>
      <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${completion}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full bg-[var(--accent)] rounded-full"
        />
      </div>
      {!isComplete && (
        <a
          href="/profile"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)] hover:underline"
        >
          Complete Profile <ArrowRight className="h-3 w-3" />
        </a>
      )}
    </motion.div>
  );
}