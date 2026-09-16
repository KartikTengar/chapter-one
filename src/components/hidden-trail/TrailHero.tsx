import { Image } from "lucide-react";

export function TrailHero({
  level,
  totalLevels,
  totalPoints
}: {
  level: number;
  totalLevels: number;
  totalPoints: number;
}) {
  return (
    <div className="mb-12 text-center">
      <h1 className="text-5xl font-black text-[var(--foreground)] uppercase tracking-tight mb-6">
        HIDDEN TRAIL
      </h1>
      <div className="flex items-center justify-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          <span className="text-xl font-bold text-[var(--accent)]">
            {level}
          </span>
          <span className="text-xs text-zinc-400 uppercase tracking-wider">
            /
          </span>
          <span className="text-xl font-bold text-[var(--foreground)]">
            {totalLevels}
          </span>
          <span className="text-xs text-zinc-400 ml-2 uppercase tracking-wider">
            MARKERS
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 uppercase tracking-wider">
            SCORE
          </span>
          <span className="text-3xl font-bold text-[var(--accent)] ml-2">
            {totalPoints}
          </span>
        </div>
      </div>
      <p className="text-xl text-zinc-400 max-w-xl mx-auto">
        TEN MARKERS.<br className="hidden sm:inline" />
        ONE JOURNEY.
      </p>
    </div>
  );
}