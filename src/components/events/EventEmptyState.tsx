import { Calendar } from "lucide-react";

export function EventEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Calendar className="h-12 w-12 text-zinc-500 mb-4" />
      <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">No registered events</h3>
      <p className="text-sm text-zinc-500">Browse upcoming events and join one!</p>
    </div>
  );
}