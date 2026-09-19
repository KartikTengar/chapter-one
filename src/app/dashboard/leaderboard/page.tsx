"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { getMasterLeaderboard, type MasterLeaderboard } from "@/lib/api/leaderboard";

interface DisplayRow {
  rank: number;
  name: string;
  score: number;
}

export default function DashboardLeaderboardPage() {
  const [rows, setRows] = useState<DisplayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    getMasterLeaderboard()
      .then((res: MasterLeaderboard | null) => {
        if (!mounted) return;
        if (!res) {
          setError(true);
          return;
        }
        setRows(
          (res.entries ?? []).map((e) => ({
            rank: e.rank,
            name: e.display_name || "Anonymous",
            score: Number(e.master_points ?? 0),
          }))
        );
      })
      .catch(() => {
        if (mounted) setError(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <p className="text-[var(--muted)]">Loading leaderboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-black uppercase tracking-tight text-[var(--foreground)] mb-3">
            Leaderboard Unavailable
          </h1>
          <p className="text-[var(--muted)] text-sm mb-6">
            The leaderboard could not be loaded right now.
          </p>
          <Link
            href="/dashboard"
            className="rounded-full px-6 py-3 bg-[var(--accent)] text-[var(--background)] font-bold text-sm"
          >
            RETURN TO DASHBOARD
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-5%] left-[-5%] w-[50vw] h-[50vw] rounded-full bg-[var(--accent)]/10 blur-[100px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[50vw] h-[50vw] rounded-full bg-[var(--accent)]/10 blur-[100px]" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-[var(--accent)] mb-3">
            Master Leaderboard
          </h1>
          <p className="text-[var(--muted)] text-sm md:text-base uppercase tracking-[0.15em]">
            Top participants across games
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="text-center text-[var(--muted)] py-16">
            No results yet — be the first to score.
          </div>
        ) : (
          <>
            {/* Top 3 showcase */}
            <div className="mb-8">
              <div className="rounded-2xl border border-white/[0.06] overflow-hidden shadow-sm">
                {rows.slice(0, 3).map((entry, i) => {
                  const rank = i + 1;
                  const isTop3 = rank <= 3;
                  return (
                    <div
                      key={entry.rank}
                      className={`flex items-center gap-4 px-4 py-4 transition-colors ${isTop3 ? "bg-[var(--accent)]/5" : "bg-transparent"}`}
                    >
                      <span className={`text-xl font-black w-12 ${isTop3 ? "text-[var(--accent)]" : "text-zinc-400"}`}>{rank}</span>
                      <span className={`flex-1 font-bold text-sm md:text-base ${isTop3 ? "text-[var(--accent)]" : "text-white"}`}>
                        {entry.name}
                      </span>
                      <span className={`w-20 text-center font-bold text-sm md:text-xl ${isTop3 ? "text-[var(--accent)] drop-shadow-[0_0_8px_rgba(245,208,110,0.5)]" : "text-zinc-400"}`}>
                        {entry.score}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Full ranking table */}
            <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
              <div className="px-4 md:px-8 py-4 flex items-center gap-4 md:gap-8 text-[10px] md:text-xs font-black text-[var(--accent)] uppercase tracking-[0.15em]">
                <span className="w-12">#</span>
                <span className="flex-1">Player</span>
                <span className="w-20 text-center">Score</span>
              </div>
              <div className="divide-y divide-white/[0.06] bg-[var(--surface)]/60">
                {rows.map((entry) => (
                  <div
                    key={entry.rank}
                    className="flex items-center gap-4 px-4 md:px-8 py-4 transition-colors hover:bg-[var(--accent)]/5"
                  >
                    <span className="text-base md:text-xl font-black w-12">{entry.rank}</span>
                    <span className="flex-1 font-bold truncate text-sm md:text-base">
                      {entry.name}
                    </span>
                    <span className="w-20 text-center font-bold text-sm md:text-xl">
                      {entry.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Action link */}
        <div className="mt-8 text-center">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-6 py-3 rounded-md text-sm font-medium text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
          >
            <Trophy className="h-4 w-4" />
            View Full Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}