"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getTrailAchievements, type TrailAchievement } from "@/lib/api/trail";
import { HiddenTrailShell } from "@/components/hidden-trail/HiddenTrailShell";

export default function TrailAchievementsPage() {
  const [achievements, setAchievements] = useState<TrailAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrailAchievements()
      .then((d) => setAchievements(d.achievements ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <HiddenTrailShell>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-[var(--accent)] font-bold">Loading achievements…</p>
        </div>
      </HiddenTrailShell>
    );
  }

  const unlocked = achievements.filter((a) => a.unlocked).length;

  return (
    <HiddenTrailShell>
      <div className="max-container mx-auto py-10 px-4">
        <h1 className="text-3xl font-black uppercase tracking-tight text-[var(--foreground)] mb-1">Achievements</h1>
        <p className="text-sm text-[var(--muted)] mb-8">{unlocked} of {achievements.length} unlocked</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((a) => (
            <div
              key={a.code}
              className={`rounded-xl border p-5 ${a.unlocked ? "border-[var(--accent)]/30 bg-[var(--surface)]" : "border-white/[0.06] bg-[var(--surface)]/50 opacity-70"}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl" aria-hidden="true">{a.icon ?? "🏅"}</span>
                <div>
                  <p className="font-bold text-[var(--foreground)] uppercase tracking-tight">{a.name}</p>
                  <p className="text-xs text-[var(--muted)]">{a.code}</p>
                </div>
              </div>
              <p className="text-sm text-[var(--muted)]">{a.description}</p>
              {a.unlocked && a.earned_at && (
                <p className="text-xs text-[var(--accent)] mt-3">Unlocked {new Date(a.earned_at).toLocaleDateString()}</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/hidden-trail/stats" className="text-sm text-[var(--accent)]">← Your Stats</Link>
        </div>
      </div>
    </HiddenTrailShell>
  );
}