"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { GameConfig, GameLevel, ScanLogWithRelations, LeaderboardEntry, LevelStat } from "@/lib/hidden-trail/game";

interface OverviewData {
  gameConfig: GameConfig | null;
  levels: GameLevel[];
  recentScans: ScanLogWithRelations[];
  leaderboard: LeaderboardEntry[];
  stats: {
    totalParticipants: number;
    activePlayers: number;
    completedPlayers: number;
    successfulCompletions: number;
    wrongAnswers: number;
    invalidScans: number;
    levelStats: LevelStat[];
  };
}

export function GameOverview() {
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [levels, setLevels] = useState<GameLevel[]>([]);
  const [recentScans, setRecentScans] = useState<ScanLogWithRelations[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState({
    totalParticipants: 0,
    activePlayers: 0,
    completedPlayers: 0,
    successfulCompletions: 0,
    wrongAnswers: 0,
    invalidScans: 0,
    levelStats: [] as LevelStat[]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch("/api/admin/hidden-trail/overview");
        
        if (!response.ok) {
          if (response.status === 401) {
            if (mounted) {
              router.replace("/login");
            }
            return;
          }
          throw new Error("Failed to load game overview");
        }
        
        const data: OverviewData = await response.json();
        
        if (!mounted) return;
        
        setGameConfig(data.gameConfig);
        setLevels(data.levels);
        setRecentScans(data.recentScans);
        setLeaderboard(data.leaderboard);
        setStats(data.stats);
        setLoading(false);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load game overview");
          setLoading(false);
        }
      }
    };

    init();
    return () => {
      mounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-[var(--surface)] border border-white/[0.06] rounded-2xl p-6 h-32" />
            ))}
          </div>
          <div className="h-64 bg-[var(--surface)] border border-white/[0.06] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[var(--surface)] border border-white/[0.06] rounded-2xl p-12 text-center">
        <h2 className="text-2xl font-black text-[var(--foreground)] uppercase tracking-tight mb-3">
          Failed to Load Overview
        </h2>
        <p className="text-zinc-500 mb-6">
          {error || "We couldn't load the game overview right now."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-full px-6 py-3 bg-[var(--accent)] text-[var(--background)] font-bold text-sm hover:bg-opacity-90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          RETRY
        </button>
      </div>
    );
  }

  // ... rest of the component remains the same
  // (keeping the JSX rendering part)
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="TOTAL PLAYERS"
          value={stats.totalParticipants}
          icon="👥"
        />
        <StatCard
          label="ACTIVE"
          value={stats.activePlayers}
          icon="🟢"
          accent
        />
        <StatCard
          label="COMPLETED"
          value={stats.completedPlayers}
          icon="🏁"
          accent
        />
        <StatCard
          label="AVG SCORE"
          value={stats.totalParticipants > 0 
            ? Math.round(leaderboard.reduce((sum, l) => sum + l.total_points, 0) / stats.totalParticipants)
            : 0}
          icon="📊"
        />
      </div>

      {/* Level Stats Table */}
      <div className="bg-[var(--surface)] border border-white/[0.06] rounded-2xl p-6">
        <h2 className="text-xl font-black text-[var(--foreground)] uppercase tracking-tight mb-4">
          LEVEL PERFORMANCE
        </h2>
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-white/[0.06]">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-black text-[var(--accent)] uppercase tracking-wider">
                  LEVEL
                </th>
                <th className="px-6 py-3 text-left text-xs font-black text-[var(--accent)] uppercase tracking-wider">
                  TITLE
                </th>
                <th className="px-6 py-3 text-left text-xs font-black text-[var(--accent)] uppercase tracking-wider">
                  COMPLETIONS
                </th>
                <th className="px-6 py-3 text-left text-xs font-black text-[var(--accent)] uppercase tracking-wider">
                  CURRENT VALUE
                </th>
                <th className="px-6 py-3 text-left text-xs font-black text-[var(--accent)] uppercase tracking-wider">
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody className="bg-[var(--background)] divide-y divide-white/[0.06]">
              {stats.levelStats.map((level: { level_number: number; title: string; successfulCompletions: number; currentValue: number; is_active: boolean }, index: number) => (
                <tr key={index} className="hover:bg-[var(--surface)]/20 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-[var(--foreground)]">
                    {String(level.level_number).padStart(2, '0')}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--foreground)]">
                    {level.title}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--accent)] font-medium">
                    {level.successfulCompletions}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--accent)] font-medium">
                    {level.currentValue}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      level.is_active ? "bg-[var(--accent)]/20 text-[var(--accent)]" : "bg-[var(--surface)]/30 text-[var(--muted)]"
                    }`}>
                      {level.is_active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[var(--surface)] border border-white/[0.06] rounded-2xl p-6">
        <h2 className="text-xl font-black text-[var(--foreground)] uppercase tracking-tight mb-4">
          RECENT ACTIVITY
        </h2>
        <div className="space-y-4">
          {recentScans.map((scan: ScanLogWithRelations, index: number) => (
            <div key={index} className="border-b pb-4 last:border-0 last:pb-0 flex items-center gap-4">
              <div className={`flex items-center gap-2 p-2 rounded-full ${scan.result === "answer_correct"
                ? "bg-[var(--accent)]/20"
                : "bg-[var(--surface)]/30"
              }`}>
                {scan.result === "answer_correct" && (
                  <span className="text-[var(--accent)] font-medium">#{scan.scanner_position}</span>
                )}
                {scan.result !== "answer_correct" && (
                  <span className="h-4 w-4">
                    {scan.result === "wrong_answer" ? "❌" : scan.result === "invalid_token" ? "🚫" : "⚠️"}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {scan.profiles?.full_name?.split(" ")[0] || "Anonymous"}
                </p>
                <p className="text-xs text-zinc-400">
                  Level {String(scan.qr_levels?.level_number || 0).padStart(2, '0')}
                </p>
              </div>
              <div className="text-right text-sm">
                {scan.result === "answer_correct" && (
                  <>
                    <span className="text-[var(--accent)] font-medium">+{scan.points_awarded}</span>
                    <span className="ml-2 text-xs text-zinc-400">pts</span>
                  </>
                )}
                {scan.result === "wrong_answer" && (
                  <span className="text-[var(--accent)]">WRONG ANSWER</span>
                )}
                {scan.result === "invalid_token" && (
                  <span className="text-[var(--accent)]">INVALID TOKEN</span>
                )}
                {scan.result === "wrong_sequence" && (
                  <span className="text-[var(--accent)]">WRONG TRAIL</span>
                )}
                {scan.result === "duplicate" && (
                  <span className="text-[var(--accent)]">ALREADY CLEARED</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-[var(--surface)] border border-white/[0.06] rounded-2xl p-6">
        <h2 className="text-xl font-black text-[var(--foreground)] uppercase tracking-tight mb-4">
          TOP 10 PLAYERS
        </h2>
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-white/[0.06]">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-black text-[var(--accent)] uppercase tracking-wider">
                  RANK
                </th>
                <th className="px-6 py-3 text-left text-xs font-black text-[var(--accent)] uppercase tracking-wider">
                  PLAYER
                </th>
                <th className="px-6 py-3 text-left text-xs font-black text-[var(--accent)] uppercase tracking-wider">
                  LEVEL
                </th>
                <th className="px-6 py-3 text-left text-xs font-black text-[var(--accent)] uppercase tracking-wider">
                  POINTS
                </th>
                <th className="px-6 py-3 text-left text-xs font-black text-[var(--accent)] uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-6 py-3 text-left text-xs font-black text-[var(--accent)] uppercase tracking-wider">
                  COMPLETED
                </th>
              </tr>
            </thead>
            <tbody className="bg-[var(--background)] divide-y divide-white/[0.06]">
              {leaderboard.map((entry: LeaderboardEntry, index: number) => (
                <tr key={entry.user_id} className="hover:bg-[var(--surface)]/20 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-[var(--foreground)]">
                    #{index + 1}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--foreground)]">
                    {entry.profiles?.full_name || "Anonymous"}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--accent)] font-medium">
                    {entry.current_level}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--accent)] font-medium">
                    {entry.total_points}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      entry.status === "completed" ? "bg-emerald-500/20 text-emerald-400" :
                      entry.status === "active" ? "bg-[var(--accent)]/20 text-[var(--accent)]" :
                      "bg-[var(--surface)]/30 text-[var(--muted)]"
                    }`}>
                      {entry.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-400">
                    {entry.completed_at 
                      ? new Date(entry.completed_at).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, accent }: { 
  label: string; 
  value: number; 
  icon: string; 
  accent?: boolean;
}) {
  return (
    <div className={`bg-[var(--surface)] border border-white/[0.06] rounded-2xl p-6 ${accent ? "border-[var(--accent)]/30" : ""}`}>
      <p className="text-xs text-zinc-400 uppercase tracking-wider mb-2">
        {label}
      </p>
      <div className="flex items-end gap-2">
        <span className="text-3xl">{icon}</span>
        <span className={`text-4xl font-black ${accent ? "text-[var(--accent)]" : "text-[var(--foreground)]"}`}>
          {value}
        </span>
      </div>
    </div>
  );
}