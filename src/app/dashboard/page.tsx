"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import Link from "next/link";
import { apiFetch } from "@/lib/api/client";
import { getMasterLeaderboard } from "@/lib/api/leaderboard";

type DashboardProfile = {
  name: string;
  branch: string;
  year: string;
};

type DashboardEvent = {
  id: string;
  title: string;
  event_date: string;
  location: string;
  category: string;
};

type HiddenTrail = {
  game_id: string;
  game_name: string;
  status: string;
  current_level: number;
  completed_levels: number;
  total_levels: number;
  score: number;
  started_at: string | null;
  completed_at: string | null;
};

type DashboardData = {
  profile: DashboardProfile;
  upcomingEvent: DashboardEvent | null;
  registeredEvents: DashboardEvent[];
  hiddenTrail: HiddenTrail | null;
};

function formatEventDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function formatEventTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [rankInfo, setRankInfo] = useState<{ rank: number | null; points: number } | null>(null);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/login");
          return;
        }
        const dashboard = await apiFetch<DashboardData>("/api/v1/dashboard");
        if (!mounted) return;
        setData(dashboard);
        const master = await getMasterLeaderboard();
        if (!mounted) return;
        if (master?.me) setRankInfo({ rank: master.me.rank, points: master.me.master_points });
      } catch {
        if (mounted) setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    init();
    return () => { mounted = false; };
  }, [router]);

  if (loading) {
    return (
      <DashboardShell>
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-[var(--surface)] rounded-xl w-3/4" />
          <div className="h-6 bg-[var(--surface)] rounded-xl w-1/2" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-32 bg-[var(--surface)] rounded-2xl" />
            <div className="h-32 bg-[var(--surface)] rounded-2xl" />
          </div>
          <div className="h-64 bg-[var(--surface)] rounded-2xl" />
        </div>
      </DashboardShell>
    );
  }

  if (error || !data) {
    return (
      <DashboardShell>
        <div className="bg-[var(--surface)] border border-white/[0.06] rounded-2xl p-12 text-center">
          <h2 className="text-2xl font-black text-[var(--foreground)] uppercase tracking-tight mb-3">
            SOMETHING WENT WRONG
          </h2>
          <p className="text-zinc-500 mb-6">We couldn&apos;t load your dashboard right now.</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-full px-6 py-3 bg-[var(--accent)] text-[var(--background)] font-bold text-sm hover:bg-opacity-90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            TRY AGAIN
          </button>
        </div>
      </DashboardShell>
    );
  }

  const userName = data.profile.name || "Student";
  const hasRegistrations = data.registeredEvents.length > 0;
  const upcoming = data.upcomingEvent;
  const trail = data.hiddenTrail;

  return (
    <DashboardShell>
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--foreground)] uppercase tracking-tight leading-tight">
              GOOD EVENING, {userName.toUpperCase()}
            </h1>
            <p className="text-zinc-400 mt-2 text-sm sm:text-base">Your chapter is already underway.</p>
          </div>
          <Link href="/profile" className="self-start sm:self-auto rounded-full px-5 py-2.5 border border-white/[0.12] text-[var(--foreground)] text-sm font-medium hover:bg-white/[0.04] transition-colors">
            View Profile
          </Link>
        </div>
        <p className="text-zinc-500 mt-4 text-sm max-w-xl">
          {hasRegistrations ? `${data.registeredEvents.length} registered events` : "No registered events"} · {trail ? `1 active game` : "No active games"}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mb-8">
        <div className="lg:col-span-2 bg-[var(--surface)] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">{upcoming ? "NEXT UP" : "UPCOMING"}</h2>
          {upcoming ? (
            <div>
              <h3 className="text-xl font-black text-[var(--foreground)]">{upcoming.title}</h3>
              <p className="text-zinc-400 mt-1">{formatEventDate(upcoming.event_date)} · {formatEventTime(upcoming.event_date)}</p>
              <p className="text-zinc-500 text-sm">{upcoming.location}</p>
              <div className="mt-4 flex gap-3">
                <Link href={`/events/${upcoming.id}`} className="rounded-full px-4 py-2 bg-[var(--accent)] text-[var(--background)] font-bold text-sm">View Event</Link>
                <span className="text-xs text-zinc-400 self-center">Registered ✓</span>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-zinc-300">You haven&apos;t registered for an event yet.</p>
              <Link href="/events" className="inline-block mt-4 rounded-full px-4 py-2 bg-[var(--accent)] text-[var(--background)] font-bold text-sm">Explore Events</Link>
            </div>
          )}
        </div>

        <div className="bg-[var(--surface)] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">PROFILE</h2>
          <p className="text-lg font-bold text-[var(--foreground)]">{data.profile.name || "—"}</p>
          <p className="text-zinc-400 text-sm">{data.profile.branch || "—"}</p>
          <p className="text-zinc-500 text-sm">{data.profile.year || "—"}</p>
          <Link href="/profile" className="inline-block mt-4 text-sm text-[var(--accent)] font-medium">View Profile →</Link>
        </div>

        <div className="bg-[var(--surface)] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">YOUR CHAPTER RANK</h2>
          {rankInfo ? (
            <>
              <p className="text-2xl font-black text-[var(--foreground)]">#{rankInfo.rank ?? '—'}</p>
              <p className="text-zinc-400 text-sm">{rankInfo.points} MASTER POINTS</p>
              <Link href="/leaderboard" className="inline-block mt-4 text-sm text-[var(--accent)] font-medium">View Leaderboard →</Link>
            </>
          ) : (
            <p className="text-zinc-500 text-sm">No ranking yet</p>
          )}
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">MY EVENTS</h2>
          <Link href="/events" className="text-sm text-[var(--accent)] font-medium">View All →</Link>
        </div>
        <div className="bg-[var(--surface)] border border-white/[0.06] rounded-2xl p-4">
          {hasRegistrations ? (
            <ul className="divide-y divide-white/[0.06]">
              {data.registeredEvents.map(e => (
                <li key={e.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">{e.title}</p>
                    <p className="text-sm text-zinc-400">{formatEventDate(e.event_date)} · {formatEventTime(e.event_date)} · {e.location}</p>
                  </div>
                  <span className="text-xs text-zinc-400">REGISTERED</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-8 text-center">
              <p className="text-zinc-400">NO REGISTERED EVENTS</p>
              <p className="text-zinc-500 text-sm mt-1">There is still plenty happening.</p>
              <Link href="/events" className="inline-block mt-4 rounded-full px-4 py-2 bg-[var(--accent)] text-[var(--background)] font-bold text-sm">Explore Events</Link>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-[var(--surface)] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">HIDDEN TRAIL</h2>
          {trail ? (
            <div>
              {trail.status === "not_started" ? (
                <div>
                  <p className="text-lg font-bold text-[var(--foreground)]">NOT STARTED</p>
                  <p className="text-zinc-400 text-sm mt-1">Hidden Trail is waiting for you.</p>
                  <Link href="/hidden-trail" className="inline-block mt-4 rounded-full px-4 py-2 bg-[var(--accent)] text-[var(--background)] font-bold text-sm">Start Trail</Link>
                </div>
              ) : trail.status === "completed" ? (
                <div>
                  <p className="text-lg font-bold text-[var(--foreground)]">COMPLETED</p>
                  <p className="text-zinc-400 text-sm mt-1">{trail.score} POINTS</p>
                  <Link href="/hidden-trail/leaderboard" className="inline-block mt-4 rounded-full px-4 py-2 border border-white/[0.12] text-[var(--foreground)] font-bold text-sm">View Leaderboard</Link>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-bold text-[var(--foreground)]">ACTIVE</p>
                  <p className="text-zinc-400 text-sm mt-1">Marker {trail.completed_levels + 1} / {trail.total_levels}</p>
                  <p className="text-zinc-500 text-sm">{trail.score} POINTS</p>
                  <Link href="/hidden-trail" className="inline-block mt-4 rounded-full px-4 py-2 bg-[var(--accent)] text-[var(--background)] font-bold text-sm">Continue Trail</Link>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-zinc-400">HIDDEN TRAIL</p>
              <p className="text-zinc-500 text-sm mt-1">No active game.</p>
            </div>
          )}
        </div>

        <div className="bg-[var(--surface)] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">ACTIONS</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/events" className="rounded-full px-4 py-2 bg-[var(--accent)] text-[var(--background)] font-bold text-sm">Explore Events</Link>
            <Link href="/hidden-trail" className="rounded-full px-4 py-2 border border-white/[0.12] text-[var(--foreground)] font-bold text-sm">Hidden Trail</Link>
            <Link href="/profile" className="rounded-full px-4 py-2 border border-white/[0.12] text-[var(--foreground)] font-bold text-sm">View Profile</Link>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}