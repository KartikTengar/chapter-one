"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getLiveLeaderboardTyped, type LiveLeaderboard, type LiveRecentEvent } from "@/lib/api/trail";
import { BranchSelector } from "@/components/leaderboard/BranchSelector";

export default function LiveLeaderboardPage() {
  const [data, setData] = useState<LiveLeaderboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState<"connected" | "reconnecting" | "off">("connected");
  const [ticker, setTicker] = useState<LiveRecentEvent | null>(null);
  const [selectedBranch, setSelectedBranch] = useState("");
  const loadedOnce = useRef(false);

  useEffect(() => {
    let mounted = true;

    const refresh = async () => {
      try {
        const d = await getLiveLeaderboardTyped(selectedBranch || undefined);
        if (!mounted) return;
        setData(d);
        if (d.recent && d.recent.length > 0) {
          setTicker(d.recent[0]);
        }
        loadedOnce.current = true;
        setLoading(false);
      } catch {
        if (mounted) setLoading(false);
      }
    };
    const initialTimer = setTimeout(() => {
      if (mounted) refresh();
    }, 0);

    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;
    try {
      const supabase = createClient();
      channel = supabase
        .channel("hidden_trail")
        .on("broadcast", { event: "hidden_trail.completion" }, () => {
          if (!mounted) return;
          setConnected("connected");
          refresh();
        })
        .subscribe((status) => {
          setTimeout(() => {
            if (mounted) {
              setConnected(status === "SUBSCRIBED" ? "connected" : "reconnecting");
            }
          }, 0);
        });
    } catch {
      setTimeout(() => {
        if (mounted) setConnected("off");
      }, 0);
    }

    return () => {
      mounted = false;
      clearTimeout(initialTimer);
      try {
        channel?.unsubscribe();
      } catch {
        // ignore
      }
    };
  }, [selectedBranch]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <p className="text-[var(--accent)] text-2xl font-bold">CONNECTING TO LIVE EVENT…</p>
      </main>
    );
  }

  if (!data?.configured || data.live_display_enabled === false) {
    return (
      <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <p className="text-[var(--muted)] text-2xl font-bold uppercase tracking-widest">Live Display Off</p>
      </main>
    );
  }

  const entries = data.entries ?? [];

  return (
    <main className="min-h-screen bg-[var(--bg)] flex flex-col p-6 md:p-10 lg:p-16">
      <header className="flex items-center justify-between mb-10">
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-[var(--foreground)]">CHAPTER ONE</h1>
        <p className="text-sm md:text-lg uppercase tracking-widest text-[var(--muted)]">
          Live Leaderboard
          <span className={`ml-3 inline-block h-2.5 w-2.5 rounded-full ${connected === "connected" ? "bg-[var(--success)]" : "bg-[var(--warning)] animate-pulse"}`} aria-hidden="true" />
          <span className="sr-only">{connected === "connected" ? "Live" : "Reconnecting"}</span>
        </p>
      </header>

      <div className="mb-8 flex justify-center">
        <BranchSelector value={selectedBranch} onChange={setSelectedBranch} />
      </div>

      <div className="grid grid-cols-3 gap-4 md:gap-8 mb-10">
        <Counter label="Players" value={data.total} />
        <Counter label="Active" value={data.active} />
        <Counter label="Completed" value={data.completed} />
      </div>

      <section className="flex-1" aria-live="polite">
        <ul className="space-y-3 md:space-y-4">
          {entries.slice(0, 12).map((e) => (
            <li key={e.rank} className="flex items-baseline gap-4 md:gap-8 border-b border-white/[0.05] pb-3">
              <span className="text-2xl md:text-5xl font-black text-[var(--accent)] w-12 md:w-16 tabular-nums">{String(e.rank).padStart(2, "0")}</span>
              <span className="text-xl md:text-4xl font-bold text-[var(--foreground)] flex-1 truncate">{e.display_name}</span>
              <span className="text-xl md:text-4xl font-black text-[var(--foreground)] tabular-nums">{e.score}</span>
            </li>
          ))}
          {entries.length === 0 && (
            <li className="text-center text-[var(--muted)] text-xl md:text-2xl py-20">Waiting for the first clear…</li>
          )}
        </ul>
      </section>

      <footer className="mt-10" aria-live="assertive">
        {ticker ? (
          <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-6 py-5">
            <p className="text-xs uppercase tracking-widest text-[var(--muted)]">Just Cleared</p>
            <p className="text-2xl md:text-4xl font-black text-[var(--accent)]">
              {ticker.display_name} — Marker {String(ticker.level ?? "?").padStart(2, "0")}
              <span className="ml-4 text-[var(--foreground)]">+{ticker.points}</span>
            </p>
          </div>
        ) : (
          <p className="text-center text-[var(--muted)] uppercase tracking-widest">
            {connected === "reconnecting" ? "Reconnecting…" : "Trail is live"}
          </p>
        )}
      </footer>
    </main>
  );
}

function Counter({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-3xl md:text-6xl font-black text-[var(--foreground)] tabular-nums">{value}</p>
      <p className="text-xs md:text-sm uppercase tracking-widest text-[var(--muted)]">{label}</p>
    </div>
  );
}