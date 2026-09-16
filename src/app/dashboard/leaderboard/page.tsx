"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, ArrowRight, Gamepad2, Sparkles, Crown } from "lucide-react";
import { motion } from "framer-motion";

interface LeaderboardEntry {
  user_id: string;
  full_name: string | null;
  total_points: number;
  current_level: number;
  status: string;
  completed_at: string | null;
}

export default function DashboardLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
        // Master leaderboard pulls hidden-trail participant data for cross-game reference.
        // In multi-game production: aggregate across all active games.
        const fetchMaster = async () => {
      try {
        setLoading(true);
        // Aggregate hidden-trail participants as master leaderboard reference
        const res = await fetch("/api/admin/hidden-trail/participants?pageSize=10");
        if (res.ok) {
          const data = await res.json();
          const entries = (data.participants || []).map((p: { user_id: string; profiles?: { full_name?: string | null } | null; total_points: number; current_level: number; status: string; completed_at: string | null }) => ({
            user_id: p.user_id,
            full_name: p.profiles?.full_name || "Anonymous",
            total_points: p.total_points,
            current_level: p.current_level,
            status: p.status,
            completed_at: p.completed_at,
          }));
          setLeaderboard(entries);
        }
      } catch {
        // Silent fail for public view
      } finally {
        setLoading(false);
      }
    };
    fetchMaster();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0D15] flex items-center justify-center">
        <div className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
            <Sparkles className="h-14 w-14 text-[#F5D06E] mx-auto" />
          </motion.div>
          <p className="text-zinc-400 text-sm mt-4 tracking-widest">Loading Master Leaderboard...</p>
        </div>
      </div>
    );
  }

  const top3 = leaderboard.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#0B0D15] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#F5D06E]/5 blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#F5D06E]/5 blur-[140px] animate-pulse" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 py-16 md:py-24">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight text-[#F5D06E] mb-4 drop-shadow-[0_6px_40px_rgba(245,208,110,0.25)]">
            MASTER LEADERBOARD
          </h1>
          <p className="text-zinc-400 text-sm md:text-base tracking-[0.3em] uppercase">Cross-Game Trail Scores / Hidden Trail Dominance</p>
        </div>

        {/* Master trophy */}
        <div className="flex justify-center mb-8">
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
            <Trophy className="h-24 w-24 md:h-32 md:w-32 text-[#F5D06E] drop-shadow-[0_0_40px_rgba(245,208,110,0.35)]" strokeWidth={1} />
          </motion.div>
        </div>

        {/* Master table */}
        <div className="rounded-2xl border border-white/[0.06] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          <div className="bg-[#F5D06E]/10 px-4 md:px-8 py-4 flex items-center gap-4 md:gap-8 text-[10px] md:text-xs font-black text-[#F5D06E] uppercase tracking-[0.15em]">
            <span className="w-12">#</span>
            <span className="flex-1">Player</span>
            <span className="w-20 text-center">Score</span>
            <span className="w-20 text-center hidden md:block">Progress</span>
          </div>
          <div className="divide-y divide-white/[0.06] bg-[#121620]/60 backdrop-blur-md">
            {leaderboard.map((entry, i) => {
              const rank = i + 1;
              const isTop3 = rank <= 3;
              return (
                <Link
                  key={entry.user_id}
                  href={`/profile/${entry.user_id}`}
                  className={`flex items-center gap-4 md:gap-8 px-4 md:px-8 py-4 transition-all hover:bg-[#F5D06E]/5 ${isTop3 ? "bg-gradient-to-r from-[#F5D06E]/10 to-transparent" : ""}`}
                >
                  <span className={`text-base md:text-xl font-black w-12 ${isTop3 ? "text-[#F5D06E]" : "text-zinc-500"}`}>{rank}</span>
                  <span className={`flex-1 font-bold truncate text-sm md:text-base ${isTop3 ? "text-[#F5D06E]" : "text-white"}`}>{entry.full_name || "Anonymous"}</span>
                  <span className={`w-20 text-center font-black text-sm md:text-xl ${isTop3 ? "text-[#F5D06E] drop-shadow-[0_0_8px_rgba(245,208,110,0.5)]" : "text-white"}`}>{entry.total_points}</span>
                  <span className="w-20 text-center hidden md:block text-xs font-medium text-zinc-400">{entry.current_level} / 10</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Game links */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/hidden-trail/leaderboard" className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#121620] to-[#0B0D15] border border-white/[0.06] p-6 hover:border-[#F5D06E]/30 transition-all hover:-translate-y-1 shadow-lg hover:shadow-[0_0_30px_rgba(245,208,110,0.1)]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/5 rounded-full -translate-y-1/3 translate-x-1/4 blur-2xl" />
            <Gamepad2 className="h-8 w-8 text-[#F5D06E] mb-4 drop-shadow-[0_0_10px_rgba(245,208,110,0.4)]" />
            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-1">Hidden Trail</h3>
            <p className="text-xs text-zinc-400 tracking-wider">QR Mystery Game</p>
          </Link>
          <div className="rounded-2xl bg-gradient-to-br from-[#121620] to-[#0B0D15] border border-white/[0.06] p-6 opacity-60">
            <Sparkles className="h-8 w-8 text-zinc-500 mb-4" />
            <h3 className="text-lg font-black text-zinc-300 uppercase tracking-tight mb-1">Future Game</h3>
            <p className="text-xs text-zinc-500 tracking-wider">Coming Soon</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-[#121620] to-[#0B0D15] border border-white/[0.06] p-6 opacity-60">
            <Crown className="h-8 w-8 text-zinc-500 mb-4" />
            <h3 className="text-lg font-black text-zinc-300 uppercase tracking-tight mb-1">More Games</h3>
            <p className="text-xs text-zinc-500 tracking-wider">In Development</p>
          </div>
        </div>
      </div>
    </div>
  );
}
