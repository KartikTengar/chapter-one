"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Crown, Sparkles, Trophy, Users } from "lucide-react";
import { getMasterLeaderboard } from "@/lib/api/leaderboard";
import { BranchSelector } from "@/components/leaderboard/BranchSelector";

type LeaderboardEntry = {
  rank: number;
  display_name?: string | null;
  master_points: number;
};

type LeaderboardData = {
  entries: LeaderboardEntry[];
  me: {
    rank?: number | null;
    master_points: number;
  } | null;
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="c1-leaderboard-page">
      <div className="c1-leaderboard-shell">{children}</div>
    </main>
  );
}

function Header() {
  return (
    <nav className="c1-leaderboard-nav" aria-label="Leaderboard navigation">
      <Link className="c1-leaderboard-brand" href="/">
        <span className="c1-leaderboard-brand-mark" aria-hidden="true">
          <Trophy size={16} strokeWidth={1.8} />
        </span>
        <span>CHAPTER ONE</span>
      </Link>
      <Link className="c1-leaderboard-back" href="/">
        <ArrowLeft size={15} aria-hidden="true" />
        Back to Chapter
      </Link>
    </nav>
  );
}

function Hero({ total }: { total: number }) {
  return (
    <header className="c1-leaderboard-hero">
      <div>
        <p className="c1-leaderboard-kicker">
          <Sparkles size={13} aria-hidden="true" />
          Master standings
        </p>
        <h1 className="c1-leaderboard-title">
          Chapter One <em>Master</em> Leaderboard
        </h1>
        <p className="c1-leaderboard-subtitle">
          Your standing across the games of CHAPTER ONE. Earn points, climb the
          trail, and leave your mark on the first chapter.
        </p>
      </div>

      <div className="c1-leaderboard-live">
        <div className="c1-leaderboard-live-label">
          <span className="c1-live-dot" aria-hidden="true" />
          Live standings
        </div>
        <p className="c1-leaderboard-live-value">
          {total} {total === 1 ? "contender" : "contenders"} on the board
        </p>
      </div>
    </header>
  );
}

function LoadingState() {
  return (
    <Shell>
      <Header />
      <div className="c1-leaderboard-loading" role="status" aria-live="polite">
        <div className="c1-state-card">
          <div className="c1-state-icon c1-skeleton" aria-hidden="true" />
          <div className="c1-skeleton" style={{ width: "65%", height: 28, margin: "0 auto" }} />
          <div className="c1-skeleton" style={{ width: "90%", height: 14, margin: "14px auto 0" }} />
          <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>
            Loading leaderboard…
          </span>
        </div>
      </div>
    </Shell>
  );
}

function StateCard({
  title,
  message,
  error = false,
}: {
  title: string;
  message: string;
  error?: boolean;
}) {
  return (
    <Shell>
      <Header />
      <div className={error ? "c1-leaderboard-error" : "c1-leaderboard-empty"}>
        <div className="c1-state-card">
          <div className="c1-state-icon" aria-hidden="true">
            {error ? <Users size={25} /> : <Trophy size={25} />}
          </div>
          <h1>{title}</h1>
          <p>{message}</p>
        </div>
      </div>
    </Shell>
  );
}

export default function MasterLeaderboardPage() {
  const [data, setData] = useState<LeaderboardData>({ entries: [], me: null });
  const [selectedBranch, setSelectedBranch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);

    getMasterLeaderboard(selectedBranch || undefined)
      .then((res) => {
        if (res) {
          setData(res);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [selectedBranch]);

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <Shell>
        <Header />
        <div className="c1-leaderboard-filter">
          <div className="c1-leaderboard-filter-copy">
            <p className="c1-leaderboard-filter-label">Standings view</p>
            <p>Choose a branch to view its live leaderboard.</p>
          </div>
          <BranchSelector value={selectedBranch} onChange={setSelectedBranch} />
        </div>
        <div className="c1-leaderboard-error">
          <div className="c1-state-card">
            <div className="c1-state-icon" aria-hidden="true"><Users size={25} /></div>
            <h1>Leaderboard unavailable</h1>
            <p>Please try again in a moment. Your selected branch has been preserved.</p>
          </div>
        </div>
      </Shell>
    );
  }

  const entries = data.entries ?? [];
  const topThree = entries.slice(0, 3);
  const hasData = entries.length > 0 || data.me != null;

  return (
    <Shell>
      <Header />
      <Hero total={entries.length} />

      <section className="c1-leaderboard-filter" aria-label="Leaderboard filters">
        <div className="c1-leaderboard-filter-copy">
          <p className="c1-leaderboard-filter-label">Standings view</p>
          <p>Switch between the full board and individual branches.</p>
        </div>
        <BranchSelector value={selectedBranch} onChange={setSelectedBranch} />
      </section>

      {data.me && (
        <section className="c1-your-card" aria-label="Your current standing">
          <div className="c1-your-rank" aria-label={`Rank ${data.me.rank ?? "not ranked"}`}>
            #{data.me.rank ?? "—"}
          </div>
          <div className="c1-your-copy">
            <span>Your position</span>
            <strong>You are on the master board</strong>
          </div>
          <div className="c1-your-points">
            <span>Master points</span>
            <strong>{data.me.master_points}</strong>
          </div>
        </section>
      )}

      {!hasData ? (
        <div className="c1-leaderboard-empty">
          <div className="c1-state-card">
            <div className="c1-state-icon" aria-hidden="true"><Trophy size={25} /></div>
            <h1>No standings yet</h1>
            <p>
              There are no recorded scores for this view yet. Check another
              branch or return after the games begin.
            </p>
          </div>
        </div>
      ) : (
        <>
          {topThree.length > 0 && (
            <section aria-label="Top three standings">
              <div className="c1-section-heading">
                <h2>The podium</h2>
                <p>Leading the chapter</p>
              </div>

              <div className="c1-podium">
                {topThree.map((entry) => (
                  <article
                    key={entry.rank}
                    className={`c1-podium-card ${entry.rank === 1 ? "is-first" : entry.rank === 2 ? "is-second" : "is-third"}`}
                  >
                    <span className="c1-podium-place">0{entry.rank}</span>
                    <div className="c1-podium-medal" aria-hidden="true">
                      {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}
                    </div>
                    <h3 className="c1-podium-name">{entry.display_name || "Anonymous"}</h3>
                    <p className="c1-podium-points">{entry.master_points} pts</p>
                    <p className="c1-podium-label">
                      {entry.rank === 1 ? "Chapter leader" : "Master standing"}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="c1-ranking-section" aria-labelledby="full-ranking">
            <div className="c1-section-heading">
              <h2 id="full-ranking">Full ranking</h2>
              <p><Crown size={13} aria-hidden="true" /> {entries.length} listed</p>
            </div>

            <ol className="c1-rank-list">
              {entries.map((entry) => {
                const isMe = data.me != null && entry.rank === data.me.rank;
                return (
                  <li key={entry.rank} className={`c1-rank-item ${isMe ? "is-me" : ""}`}>
                    <span className="c1-rank-number">{entry.rank}</span>
                    <div className="c1-rank-person">
                      <span className="c1-rank-name">
                        {entry.display_name || "Anonymous"}
                        {isMe && <span className="c1-you-badge">You</span>}
                      </span>
                      <span className="c1-rank-meta">Master standing</span>
                    </div>
                    <span className="c1-rank-score">{entry.master_points} pts</span>
                  </li>
                );
              })}
            </ol>
          </section>
        </>
      )}
    </Shell>
  );
}
