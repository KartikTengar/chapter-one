"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getTrailStats, type TrailStats } from "@/lib/api/trail";
import { HiddenTrailShell } from "@/components/hidden-trail/HiddenTrailShell";

function formatDuration(totalSeconds: number | null): string {
  if (totalSeconds == null) return "—";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default function TrailStatsPage() {
  const [data, setData] = useState<TrailStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrailStats()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <HiddenTrailShell>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-[var(--accent)] font-bold">Loading your stats…</p>
        </div>
      </HiddenTrailShell>
    );
  }

  const s = data?.stats;

  const rows = s
    ? [
        { label: "Markers cleared", value: `${s.markers_cleared} / ${s.markers_cleared}` },
        { label: "Total points", value: String(s.total_points) },
        { label: "Wrong answers", value: String(s.wrong_answers) },
        { label: "Invalid scans", value: String(s.invalid_scans) },
        { label: "Moments captured", value: String(s.photos) },
        { label: "Current streak", value: `🔥 ${s.streak}` },
        { label: "Best streak", value: `🔥 ${s.best_streak}` },
        { label: "Total time", value: formatDuration(s.total_time_seconds) },
        { label: "Final rank", value: s.rank ? `#${s.rank} / ${s.total_participants}` : "—" },
      ]
    : [];

  return (
    <HiddenTrailShell>
      <div className="max-container mx-auto py-10 px-4">
        <h1 className="text-3xl font-black uppercase tracking-tight text-[var(--foreground)] mb-8">Your Stats</h1>

        {!s ? (
          <p className="text-[var(--muted)]">No stats yet. Enter the trail to begin.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {rows.map((r) => (
              <div key={r.label} className="rounded-xl border border-white/[0.06] bg-[var(--surface)] p-5">
                <p className="text-xs uppercase tracking-wider text-[var(--muted)] mb-2">{r.label}</p>
                <p className="text-2xl font-black text-[var(--foreground)]">{r.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <Link href="/hidden-trail/achievements" className="rounded-full px-6 py-3 bg-[var(--accent)] text-[var(--background)] font-bold text-sm">ACHIEVEMENTS</Link>
          <Link href="/hidden-trail/replay" className="rounded-full px-6 py-3 bg-white/[0.06] text-[var(--foreground)] font-bold text-sm">MY JOURNEY</Link>
          <Link href="/hidden-trail/album" className="rounded-full px-6 py-3 bg-white/[0.06] text-[var(--foreground)] font-bold text-sm">MY MOMENTS</Link>
        </div>
      </div>
    </HiddenTrailShell>
  );
}