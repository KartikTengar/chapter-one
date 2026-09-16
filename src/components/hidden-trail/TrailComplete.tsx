import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";
import type { ParticipantStatus, GameConfig, CompletionWithLevel, GameLevel } from "@/lib/hidden-trail/game";

export function TrailComplete({
  participant,
  gameConfig,
  completions,
  levels
}: {
  participant: ParticipantStatus | null;
  gameConfig: GameConfig | null;
  completions: CompletionWithLevel[];
  levels: GameLevel[];
}) {
  // Calculate duration if completed
  let durationText = "";
  if (participant?.started_at && participant?.completed_at) {
    const start = new Date(participant.started_at);
    const end = new Date(participant.completed_at);
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffSeconds = Math.floor((diffMs % 60000) / 1000);
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    durationText = `${hours}h ${minutes}m ${diffSeconds}s`;
  }

  // Count achievements (placeholder - would come from server in real implementation)
  const achievements = [
    { name: "TRAIL BLAZER", description: "Completed all levels." },
    // Add more based on actual achievements
  ];

  if (!participant || !gameConfig) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-container mx-auto py-12">
          <div className="text-center">
            <p className="text-zinc-400">Trail completion data not available.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-container mx-auto py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-[var(--foreground)] uppercase tracking-tight mb-6">
            TRAIL COMPLETE
          </h1>
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-[var(--accent)]">
                {levels.length}
              </span>
              <span className="text-xs text-zinc-400 uppercase tracking-wider">
                /
              </span>
              <span className="text-xl font-bold text-[var(--foreground)]">
                {levels.length}
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
                {participant.total_points}
              </span>
            </div>
          </div>
          <p className="text-xl text-zinc-400 max-w-xl mx-auto">
            YOU FOUND THE HIDDEN TRAIL
          </p>
        </div>

        <div className="grid gap-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[var(--surface)]/30 border border-white/[0.06] rounded-2xl p-6">
              <p className="text-xs text-zinc-400 uppercase tracking-wider mb-2">
                MARKERS FOUND
              </p>
              <p className="text-2xl font-black text-[var(--accent)]">
                {completions.length} / {levels.length}
              </p>
            </div>
            <div className="bg-[var(--surface)]/30 border border-white/[0.06] rounded-2xl p-6">
              <p className="text-xs text-zinc-400 uppercase tracking-wider mb-2">
                TOTAL SCORE
              </p>
              <p className="text-2xl font-black text-[var(--foreground)]">
                {participant.total_points}
              </p>
            </div>
            <div className="bg-[var(--surface)]/30 border border-white/[0.06] rounded-2xl p-6">
              <p className="text-xs text-zinc-400 uppercase tracking-wider mb-2">
                START TIME
              </p>
              <p className="text-lg font-black text-[var(--foreground)]">
                {participant.started_at ? new Date(participant.started_at).toLocaleString() : "N/A"}
              </p>
            </div>
            <div className="bg-[var(--surface)]/30 border border-white/[0.06] rounded-2xl p-6">
              <p className="text-xs text-zinc-400 uppercase tracking-wider mb-2">
                COMPLETION TIME
              </p>
              <p className="text-lg font-black text-[var(--foreground)]">
                {participant.completed_at ? new Date(participant.completed_at).toLocaleString() : "N/A"}
              </p>
            </div>
            <div className="bg-[var(--surface)]/30 border border-white/[0.06] rounded-2xl p-6">
              <p className="text-xs text-zinc-400 uppercase tracking-wider mb-2">
                DURATION
              </p>
              <p className="text-lg font-black text-[var(--foreground)]">
                {durationText || "N/A"}
              </p>
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-[var(--surface)]/30 border border-white/[0.06] rounded-2xl p-6">
            <h2 className="text-xl font-black text-[var(--foreground)] uppercase tracking-tight mb-6">
              ACHIEVEMENTS EARNED
            </h2>
            {achievements.length > 0 ? (
              <div className="flex flex-wrap gap-4">
                {achievements.map((achievement, index) => (
                  <div key={index} className="bg-[var(--accent)]/20 border border-white/[0.06] rounded-xl p-4 flex items-center gap-3">
                    <Trophy className="h-5 w-5 text-[var(--accent)]" />
                    <div>
                      <p className="text-sm font-bold text-[var(--foreground)]">
                        {achievement.name}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-400 text-center">
                No achievements earned yet.
              </p>
            )}
          </div>

          {/* Completion Details */}
          <div className="bg-[var(--surface)]/30 border border-white/[0.06] rounded-2xl p-6">
            <h2 className="text-xl font-black text-[var(--foreground)] uppercase tracking-tight mb-6">
              JOURNEY SUMMARY
            </h2>
            <div className="space-y-4">
{completions.map((completion, index) => (
                  <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-[var(--accent)]">
                        {String(completion.level.level_number).padStart(2, '0')}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {completion.level.title}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-zinc-400">
                      <span>Points: +{completion.points_awarded}</span>
                    </div>
                  </div>
               ))}
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-medium text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
          >
            <ArrowRight className="h-4 w-4" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}