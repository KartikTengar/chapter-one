"use client";

import { useEffect, useState } from "react";
import { getMasterLeaderboard } from "@/lib/api/leaderboard";
import { BranchSelector } from "@/components/leaderboard/BranchSelector";

export default function MasterLeaderboardPage() {
  const [data, setData] = useState({
    entries: [] as any[],
    me: null as any | null,
  });
  const [selectedBranch, setSelectedBranch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    getMasterLeaderboard(selectedBranch || undefined)
      .then((res) => {
        if (res) setData(res);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [selectedBranch]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--background)]">
        <div className="max-container py-12 flex items-center justify-center">
          <p className="text-[var(--muted)]">Loading leaderboard...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[var(--background)]">
        <div className="max-container py-24 text-center">
          <h1 className="text-2xl font-black uppercase">Leaderboard unavailable</h1>
          <p className="text-[var(--muted)] mt-2">Please try again in a moment.</p>
        </div>
      </main>
    );
  }

  const hasData = data.entries.length > 0 || data.me != null;

  if (!hasData) {
    return (
      <main className="min-h-screen bg-[var(--background)]">
        <div className="max-container py-24 text-center">
          <h1 className="text-2xl font-black uppercase">No data available</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="max-container py-12">
        <h1 className="text-4xl font-bold tracking-tighter text-[var(--accent)] mb-4">
          CHAPTER ONE MASTER LEADERBOARD
        </h1>
        <p className="text-[var(--muted)] text-sm mb-8">
          Your standing across the games of CHAPTER ONE.
        </p>

        <div className="mb-8">
          <BranchSelector value={selectedBranch} onChange={setSelectedBranch} />
        </div>

        <div className="mb-8">
          {data.me ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs uppercase tracking-wider text-[var(--muted)]">Your Position</span>
                <span className="text-3xl font-bold">
                  #{data.me.rank ?? "—"}
                </span>
              </div>
              <div className="mt-2">
                <span className="text-[var(--muted)]">Master Points</span>
                <span className="text-2xl font-bold">
                  {data.me.master_points}
                </span>
              </div>
            </>
          ) : (
            <div></div>
          )}
        </div>

        <div className="ranking-grid">
          <div className="top-ranks">
            {data.entries
              .slice(0, 3)
              .map((e) => (
                <div
                  key={e.rank}
                  className="rank-card top-rank"
                  style={{ transition: "background var(--dur-fast) var(--ease)" }}
                >
                  {e.rank <= 3 && (
                    <span className="medal-badge">
                      {e.rank === 1 ? "🥇" : e.rank === 2 ? "🥈" : "🥉"}
                    </span>
                  )}
                  <div className="rank-info">
                    <span className="rank-name">{e.display_name || "Anonymous"}</span>
                    <span className="rank-points">{e.master_points} MASTER POINTS</span>
                  </div>
                </div>
              ))}
          </div>

          <div className="full-ranking">
            <h2 className="section-header">FULL RANKING</h2>
            <ul className="rank-list">
              {data.entries.map((e) => {
                const isMe = data.me && e.rank === data.me.rank;
                return (
                  <li key={e.rank} className="rank-item">
                    <div className={`rank-index ${isMe ? "rank-index-me" : ""}`}>
                      {e.rank}
                    </div>
                    <div className="rank-details">
                      <span className="rank-name">{e.display_name || "Anonymous"}</span>
                      <span className="rank-score">{e.master_points} PTS</span>
                    </div>
                    {isMe && (
                      <span className="rank-badge">YOU</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}