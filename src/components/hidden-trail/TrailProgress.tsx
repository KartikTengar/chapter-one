import { MapPin, Image } from "lucide-react";

export function TrailProgress({
  currentLevel,
  totalLevels
}: {
  currentLevel: number;
  totalLevels: number;
}) {
  // Calculate progress percentage
  const progressPercent = (currentLevel / totalLevels) * 100;

  // Create the trail visualization
  const trailItems = [];
  for (let i = 1; i <= totalLevels; i++) {
    const isCompleted = i < currentLevel;
    const isCurrent = i === currentLevel;
    
    trailItems.push(
      <div key={i} className="flex items-center gap-2">
        <div className="relative">
<div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? "bg-[var(--accent)]" : isCurrent ? "bg-[var(--accent)]/20 animate-pulse" : "bg-[var(--surface)]/20"} border border-white/[0.06] ${isCurrent ? "border-[var(--accent)]/30" : ""}`}>
            {isCompleted ? (
              <Image className="h-4 w-4" aria-hidden="true" />
            ) : isCurrent ? (
              <MapPin className="h-4 w-4 text-[var(--accent)]" />
            ) : (
              <div className="h-2 w-2 bg-[var(--muted)]" />
            )}
          </div>
{i < totalLevels && (
             <div className={`h-0.5 w-12 flex-1 ${isCompleted || isCurrent ? "bg-[var(--accent)]/20" : "bg-[var(--surface)]/10"}`} />
           )}
        </div>
        <span className="text-xs text-zinc-400 uppercase tracking-wider">{String(i).padStart(2, '0')}</span>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h2 className="text-xl font-black text-[var(--foreground)] uppercase tracking-tight mb-6">
        YOUR JOURNEY
      </h2>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-zinc-400 uppercase tracking-wider">
            START
          </span>
          <span className="text-sm text-zinc-400 uppercase tracking-wider">
            FINISH
          </span>
        </div>
        <div className="space-y-2">
          {trailItems}
        </div>
        <div className="mt-6">
          <div className="flex justify-between text-xs text-zinc-400 uppercase tracking-wider">
            <span>{currentLevel}/{totalLevels} MARKERS FOUND</span>
            <span>{Math.round(progressPercent)}% COMPLETE</span>
          </div>
          <div className="w-full bg-[var(--surface)]/20 rounded-full h-2.5 mt-2">
            <div className="bg-[var(--accent)] rounded-full h-2.5 transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}