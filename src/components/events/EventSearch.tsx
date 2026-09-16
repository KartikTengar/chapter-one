"use client";

import { Search } from "lucide-react";

interface EventSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
}

export function EventSearch({ query, onQueryChange }: EventSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
      <input
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search events..."
        className="w-full rounded-xl bg-[var(--surface)] border border-white/[0.06] pl-11 pr-4 py-3 text-[var(--foreground)] text-sm outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors placeholder:text-zinc-500"
      />
    </div>
  );
}