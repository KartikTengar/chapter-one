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
    <label className="c1-branch-selector">
      <span>Filter leaderboard</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
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
