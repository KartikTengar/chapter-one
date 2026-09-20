"use client";

import { BRANCH_LABELS, BRANCH_OPTIONS } from "@/lib/profile/branches";

interface BranchSelectorProps {
  value: string;
  onChange: (value: string) => void;
  allLabel?: string;
  disabled?: boolean;
}

export function BranchSelector({
  value,
  onChange,
  allLabel = "All branches",
  disabled = false,
}: BranchSelectorProps) {
  return (
    <label className="inline-flex min-w-0 flex-col gap-2 text-left">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">
        Branch
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="min-h-11 min-w-0 rounded-xl border border-white/[0.1] bg-[var(--surface)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-60"
        aria-label="Select leaderboard branch"
      >
        <option value="">{allLabel}</option>
        {BRANCH_OPTIONS.map((branch) => (
          <option key={branch.value} value={branch.value}>
            {BRANCH_LABELS[branch.value]}
          </option>
        ))}
      </select>
    </label>
  );
}
