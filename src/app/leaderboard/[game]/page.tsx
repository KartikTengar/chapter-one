"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getGameLeaderboard, type GameLeaderboard } from "@/lib/api/leaderboard";

export default function GameLeaderboardPage() {
  const params = useParams<{ game: string }>();
  const [data, setData] = useState<GameLeaderboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGameLeaderboard(params.game).then(setData).finally(() => setLoading(false));
  }, [params.game]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--background)]">
        <div className="max-container py-12 flex items-center justify-center">
          <p className="text-[var(--muted)]">Loading leaderboard...</p>
        </div>
      </main>
    );
  }

  if (!data || !data.game) {
    return (
      <main className="min-h-screen bg-[var(--background)]">
        <div className="max-container py-24 text-center">
          <h1 className="text-2xl font-black uppercase">Game not found</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="max-container py-12">
        <Link href="/leaderboard" className="text-sm text-[var(--muted)] hover:text-[var(--accent)] mb-4">
          ← Master Leaderboard
        </Link>
        <h1 className="text-4xl font-bold tracking-tighter text-[var(--accent)] mb-4">
          {data.game.name} LEADERBOARD
        </h1>

        {data.me ? (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs uppercase tracking-wider text-[var(--muted)]">Your Position</span>
              <span className="text-3xl font-bold">
                #{data.me.rank ?? "—"}
              </span>
            </div>
            <div className="mt-2">
              <span className="text-[var(--muted)]">Score</span>
              <span className="text-2xl font-bold">
                {data.me.score}
              </span>
            </div>
          </div>
        ) : (
          <div></div>
        )}

        <div className="full-ranking">
          <h2 className="section-header mb-6">FULL RANKING</h2>
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
                    <span className="rank-score">{e.score} PTS</span>
                  </div>
                  {isMe && (
                    <span className="rank-badge">YOU</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-6">
          <Link href={`/games/${data.game.slug}`} className="text-sm text-[var(--accent)]">
            Back to {data.game.name} →
          </Link>
        </div>
      </div>
    </main>
  );
}