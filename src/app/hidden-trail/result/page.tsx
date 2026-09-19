"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getTrailStats, getTrailAchievements, type TrailStats, type TrailAchievement } from "@/lib/api/trail";
import { HiddenTrailShell } from "@/components/hidden-trail/HiddenTrailShell";

function formatDuration(totalSeconds: number | null): string {
  if (totalSeconds == null) return "—";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default function TrailResultPage() {
  const [stats, setStats] = useState<TrailStats | null>(null);
  const [achievements, setAchievements] = useState<TrailAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTrailStats(), getTrailAchievements()])
      .then(([s, a]) => {
        setStats(s);
        setAchievements(a.achievements ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <HiddenTrailShell>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-[var(--accent)] font-bold">Loading your chapter…</p>
        </div>
      </HiddenTrailShell>
    );
  }

  const s = stats?.stats;
  const unlocked = achievements.filter((a) => a.unlocked);

  return (
    <HiddenTrailShell>
      <div className="max-container mx-auto py-14 px-4 text-center">
        <p className="label mb-3">CHAPTER ONE</p>
        <h1 className="display text-5xl md:text-6xl text-[var(--foreground)] mb-2">TRAIL COMPLETE</h1>
        <p className="text-[var(--muted)] mb-10">You found the Hidden Trail.</p>

        {s && s.status === "completed" ? (
          <div className="mx-auto max-w-2xl space-y-8">
            <div className="rounded-3xl border border-[var(--accent)]/25 bg-[var(--surface)] p-10">
              <p className="label mb-2">FINAL SCORE</p>
              <p className="display text-6xl md:text-7xl text-[var(--accent)]">{s.total_points}</p>
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div>
                  <p className="label">RANK</p>
                  <p className="text-2xl font-black text-[var(--foreground)]">{s.rank ? `#${s.rank}` : "—"}</p>
                </div>
                <div>
                  <p className="label">TIME</p>
                  <p className="text-2xl font-black text-[var(--foreground)] tabular-nums">{formatDuration(s.total_time_seconds)}</p>
                </div>
                <div>
                  <p className="label">MOMENTS</p>
                  <p className="text-2xl font-black text-[var(--foreground)]">{s.photos}</p>
                </div>
              </div>
            </div>

            {unlocked.length > 0 && (
              <div>
                <p className="label mb-4">ACHIEVEMENTS</p>
                <div className="flex flex-wrap justify-center gap-3">
                  {unlocked.map((a) => (
                    <span key={a.code} className="rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-2 text-sm font-semibold text-[var(--foreground)]">
                      {a.icon ?? "🏅"} {a.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-4 pt-6">
              <Link href="/hidden-trail/replay" className="rounded-full px-7 py-3 bg-[var(--accent)] text-[var(--background)] font-bold text-sm">VIEW MY JOURNEY</Link>
              <Link href="/hidden-trail/album" className="rounded-full px-7 py-3 bg-white/[0.06] text-[var(--foreground)] font-bold text-sm">VIEW MY MOMENTS</Link>
              <Link href="/hidden-trail/leaderboard" className="rounded-full px-7 py-3 bg-white/[0.06] text-[var(--foreground)] font-bold text-sm">VIEW LEADERBOARD</Link>
            </div>
          </div>
        ) : (
          <p className="text-[var(--muted)]">
            You haven&rsquo;t completed the trail yet. Continue from the trail to see your final chapter.
          </p>
        )}
      </div>
    </HiddenTrailShell>
  );
}