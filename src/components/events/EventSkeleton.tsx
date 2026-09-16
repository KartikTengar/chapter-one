export function EventSkeleton() {
  return (
    <div className="bg-[var(--surface)] border border-white/[0.06] rounded-xl overflow-hidden">
      <div className="aspect-[16/9] bg-zinc-800 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-16 bg-zinc-800 rounded-full animate-pulse" />
        <div className="h-4 w-3/4 bg-zinc-800 rounded animate-pulse" />
        <div className="h-3 w-1/2 bg-zinc-800 rounded animate-pulse" />
        <div className="h-3 w-1/3 bg-zinc-800 rounded animate-pulse" />
      </div>
    </div>
  );
}