"use client";

interface EventFiltersProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export function EventFilters({
  categories,
  selectedCategory,
  onCategoryChange,
}: EventFiltersProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <button
        onClick={() => onCategoryChange("ALL")}
        className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
          selectedCategory === "ALL"
            ? "bg-[var(--accent)] text-[var(--background)]"
            : "bg-[var(--surface)] text-zinc-400 border border-white/[0.06] hover:border-[var(--accent)]/30"
        }`}
      >
        ALL
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onCategoryChange(cat)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
            selectedCategory === cat
              ? "bg-[var(--accent)] text-[var(--background)]"
              : "bg-[var(--surface)] text-zinc-400 border border-white/[0.06] hover:border-[var(--accent)]/30"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}