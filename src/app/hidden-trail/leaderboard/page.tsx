"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trophy, Crown, Medal, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { requireUser, getLeaderboard, getGameConfig } from "@/lib/hidden-trail/game";
import { HiddenTrailShell } from "@/components/hidden-trail/HiddenTrailShell";

interface LeaderboardEntry {
  user_id: string;
  total_points: number;
  current_level: number;
  status: string;
  completed_at: string | null;
  profiles: {
    full_name: string | null;
    email: string | null;
  } | null;
}

export default function HiddenTrailLeaderboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPrivateMessage, setShowPrivateMessage] = useState(false);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        setLoading(true);
        setError(null);
        setShowPrivateMessage(false);

        // Get game config first to get gameId
        const gameConfig = await getGameConfig();
        if (!gameConfig) {
          if (mounted) {
            setShowPrivateMessage(true);
            setLoading(false);
          }
          return;
        }

        // Try to get current user (optional for public leaderboard)
        let currentUser = null;
        try {
          currentUser = await requireUser();
        } catch {
          // Not logged in — leaderboard is public
        }
        if (mounted && currentUser) {
          setUser({ id: currentUser.id, email: currentUser.email ?? "" });
        }

        if (!mounted) return;

        const leaderboardData = await getLeaderboard(gameConfig.id);
        if (mounted) setLeaderboard(leaderboardData);
        if (mounted) setLoading(false);
      } catch (err) {
        if (mounted) {
          if (err instanceof Error && (err.message.includes("private") || err.message.includes("disabled"))) {
            setShowPrivateMessage(true);
          } else {
            setError(err instanceof Error ? err.message : "Failed to load leaderboard");
          }
          setLoading(false);
        }
      }
    };
    init();
    return () => { mounted = false; };
  }, [router]);

  const top3 = leaderboard.slice(0, 3);

  if (loading) {
    return (
      <HiddenTrailShell>
        <div className="min-h-screen flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="h-14 w-14 text-[var(--accent)] mx-auto" />
          </motion.div>
        </div>
      </HiddenTrailShell>
    );
  }

  if (showPrivateMessage) {
    return (
      <HiddenTrailShell>
        <div className="min-h-screen bg-[var(--background)]">
          <div className="max-container mx-auto py-20 text-center">
            <div className="bg-[var(--surface)]/20 border border-white/[0.06] rounded-3xl p-12 inline-block">
              <h2 className="text-3xl font-black text-[var(--foreground)] uppercase tracking-tight mb-4">Leaderboard Private</h2>
              <p className="text-zinc-400 mb-6">Ask an administrator to enable public leaderboard access.</p>
              <Link href="/hidden-trail" className="inline-block rounded-full px-8 py-3 bg-[var(--accent)] text-[var(--background)] font-bold hover:bg-opacity-90 transition">RETURN TO TRAIL</Link>
            </div>
          </div>
        </div>
      </HiddenTrailShell>
    );
  }

  if (error || !user) {
    return (
      <HiddenTrailShell>
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
          <div className="bg-[var(--surface)] border border-white/[0.06] rounded-2xl p-12 text-center max-w-md">
            <h2 className="text-2xl font-black text-[var(--foreground)] uppercase tracking-tight mb-3">
              Leaderboard Not Available
            </h2>
            <p className="text-zinc-500 mb-6">{error || "We couldn't load the leaderboard right now."}</p>
            <Link href="/hidden-trail" className="inline-block rounded-full px-6 py-3 bg-[var(--accent)] text-[var(--background)] font-bold text-sm hover:bg-opacity-90">RETURN TO TRAIL</Link>
          </div>
        </div>
      </HiddenTrailShell>
    );
  }

  const podiumColors = ["text-[#F5D06E]", "text-[#C0C0C0]", "text-[#CD7F32]"];
  const podiumHeights = ["h-40", "h-28", "h-24"];
  const podiumLabels = ["1ST", "2ND", "3RD"];

  return (
    <HiddenTrailShell>
      <div className="min-h-screen bg-[var(--background)] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-[var(--accent)]/5 blur-[140px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[var(--accent)]/5 blur-[140px] animate-pulse" style={{ animationDelay: "1.5s" }} />
        </div>

        <div className="relative z-10 max-container mx-auto px-4 py-16 md:py-24">
          <div className="flex justify-center mb-6">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Trophy className="h-24 w-24 md:h-28 md:w-28 text-[#F5D06E] drop-shadow-[0_0_40px_rgba(245,208,110,0.35)]" strokeWidth={1} />
            </motion.div>
          </div>

          <h1 className="text-center text-5xl md:text-7xl font-black uppercase tracking-tight text-[var(--foreground)] mb-2 drop-shadow-[0_4px_30px_rgba(245,208,110,0.25)]">
            LEADERBOARD
          </h1>
          <p className="text-center text-zinc-400 text-sm md:text-base tracking-[0.3em] uppercase mb-16">Live Trail Scores</p>

          {/* 3D Podium */}
          <div className="flex items-end justify-center gap-2 md:gap-6 mb-16 px-2">
            {top3.length >= 2 && (
              <div className="flex flex-col items-center gap-3 w-28 md:w-36">
                <div className={`w-full ${podiumHeights[1]} rounded-t-xl bg-gradient-to-b from-[#C0C0C0]/30 to-[#C0C0C0]/10 border border-[#C0C0C0]/20 flex items-center justify-center shadow-[inset_0_8px_20px_rgba(192,192,192,0.1)] relative overflow-hidden`}>
                  <Crown className="h-6 w-6 md:h-8 md:w-8 text-[#C0C0C0] drop-shadow-[0_0_10px_rgba(192,192,192,0.5)]" />
                </div>
                <p className="text-xs font-black text-[#C0C0C0] tracking-widest uppercase">{podiumLabels[1]}</p>
                <p className="text-base md:text-xl font-black text-[var(--foreground)]">{top3[1]?.profiles?.full_name?.split(" ")[0] || "Anonymous"}</p>
                <p className="text-sm md:text-xl font-bold text-[#C0C0C0]">{top3[1]?.total_points}</p>
              </div>
            )}
            {top3.length >= 1 && (
              <div className="flex flex-col items-center gap-3 w-32 md:w-44 order-first md:order-none">
                <div className={`w-full ${podiumHeights[0]} rounded-t-xl bg-gradient-to-b from-[#F5D06E]/20 to-[#F5D06E]/5 border border-[#F5D06E]/30 flex items-center justify-center shadow-[inset_0_8px_20px_rgba(245,208,110,0.15),0_0_40px_rgba(245,208,110,0.15)] relative overflow-hidden`}>
                  <Crown className="h-8 w-8 md:h-12 md:w-12 text-[#F5D06E] drop-shadow-[0_0_20px_rgba(245,208,110,0.6)]" />
                </div>
                <p className="text-xs font-black text-[#F5D06E] tracking-widest uppercase">{podiumLabels[0]}</p>
                <p className="text-xl md:text-2xl font-black text-[var(--foreground)]">{top3[0]?.profiles?.full_name?.split(" ")[0] || "Anonymous"}</p>
                <p className="text-2xl md:text-3xl font-black text-[#F5D06E] drop-shadow-[0_0_10px_rgba(245,208,110,0.4)]">{top3[0]?.total_points}</p>
              </div>
            )}
            {top3.length >= 3 && (
              <div className="flex flex-col items-center gap-3 w-28 md:w-36">
                <div className={`w-full ${podiumHeights[2]} rounded-t-xl bg-gradient-to-b from-[#CD7F32]/30 to-[#CD7F32]/10 border border-[#CD7F32]/20 flex items-center justify-center shadow-[inset_0_8px_20px_rgba(205,127,50,0.1)]`}>
                  <Medal className="h-6 w-6 md:h-8 md:w-8 text-[#CD7F32] drop-shadow-[0_0_10px_rgba(205,127,50,0.5)]" />
                </div>
                <p className="text-xs font-black text-[#CD7F32] tracking-widest uppercase">{podiumLabels[2]}</p>
                <p className="text-base md:text-xl font-black text-[var(--foreground)]">{top3[2]?.profiles?.full_name?.split(" ")[0] || "Anonymous"}</p>
                <p className="text-sm md:text-xl font-bold text-[#CD7F32]">{top3[2]?.total_points}</p>
              </div>
            )}
          </div>

          {/* Full table */}
          <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
            <div className="bg-[var(--accent)]/20 px-6 py-4 flex justify-between text-[10px] md:text-xs font-black text-[var(--accent)] uppercase tracking-widest">
              <span>Rank</span>
              <span>Player</span>
              <span>Score</span>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {leaderboard.map((entry, index) => {
                const isTop3 = index < 3;
                const currentUserRank = leaderboard.findIndex((e) => e.user_id === user?.id) + 1;
                const isCurrent = entry.user_id === user?.id;
                return (
                  <div
                    key={entry.user_id}
                    className={`flex items-center justify-between px-4 md:px-6 py-4 transition-colors ${
                      index < 3 ? "bg-gradient-to-r from-[var(--accent)]/10 to-transparent" : "hover:bg-[var(--surface)]/20"
                    } ${entry.user_id === user?.id ? "border-l-2 border-[var(--accent)]" : ""}`}
                  >
                    <span className={`text-sm md:text-base font-black w-12 ${index < 3 ? "text-[#F5D06E]" : "text-zinc-400"}`}>
                      #{index + 1}
                    </span>
                    <span className={`text-sm md:text-base font-medium truncate max-w-[60%] md:max-w-[70%] ${entry.user_id === user?.id ? "text-[var(--accent)]" : "text-[var(--foreground)]"}`}>
                      {entry.profiles?.full_name?.split(" ")[0] || "Anonymous"}
                    </span>
                    <span className={`text-sm md:text-base font-black ${index < 3 ? "text-[var(--accent)]" : "text-[var(--foreground)]"}`}>
                      {entry.total_points}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live points indicator */}
          <div className="mt-10 flex items-center justify-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--accent)]"></span>
            </span>
            <span className="text-xs font-black text-[var(--accent)] tracking-[0.2em] uppercase">Live Points</span>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/hidden-trail"
              className="inline-block rounded-full px-8 py-3 bg-[var(--accent)] text-[var(--background)] font-bold text-sm hover:bg-opacity-90 shadow-[0_0_20px_rgba(245,208,110,0.3)] transition-all"
            >
              RETURN TO TRAIL
            </Link>
          </div>
        </div>
      </div>
    </HiddenTrailShell>
  );
}
