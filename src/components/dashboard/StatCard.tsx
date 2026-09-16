"use client";

import { motion } from "framer-motion";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
}

export function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ scale: 1.02 }}
      className="bg-[var(--surface)] border border-white/[0.06] rounded-2xl p-5 sm:p-6 hover:border-[var(--accent)]/20 transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {label}
        </p>
        <div className="w-8 h-8 rounded-lg bg-[var(--accent-dim)] flex items-center justify-center">
          <Icon className="h-4 w-4 text-[var(--accent)]" />
        </div>
      </div>
      <p className="text-2xl sm:text-3xl font-black text-[var(--foreground)]">
        {value}
      </p>
    </motion.div>
  );
}