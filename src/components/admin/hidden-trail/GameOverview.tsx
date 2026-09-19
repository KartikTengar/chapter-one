"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { GameConfig, GameLevel, ScanLogWithRelations, LeaderboardEntry, LevelStat } from "@/lib/hidden-trail/game";

interface OverviewData {
  gameConfig: GameConfig | null;
  levels: GameLevel[];
  recentScans: ScanLogWithRelations[];
  leaderboard: LeaderboardEntry[];
  stats: {
    totalParticipants: number;
    activePlayers: number;
    completedPlayers: number;
    successfulCompletions: number;
    wrongAnswers: number;
    invalidScans: number;
    levelStats: LevelStat[];
  };
}

interface ReadinessResult {
  passed: boolean;
  checks: Array<{ name: string; passed: boolean; detail: string }>;
  level_count: number;
}

export function GameOverview() {
  const [recentScans, setRecentScans] = useState<ScanLogWithRelations[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState({
    totalParticipants: 0,
    activePlayers: 0,
    completedPlayers: 0,
    successfulCompletions: 0,
    wrongAnswers: 0,
    invalidScans: 0,
    levelStats: [] as LevelStat[]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasGame, setHasGame] = useState<boolean | null>(null);
  const [readiness, setReadiness] = useState<ReadinessResult | null>(null);
  const [checkingReadiness, setCheckingReadiness] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch("/api/admin/hidden-trail/overview");
        
        if (!response.ok) {
          if (response.status === 401) {
            if (mounted) {
              router.replace("/login");
            }
            return;
          }
          throw new Error("Failed to load game overview");
        }
        
        const data: OverviewData = await response.json();
        
        if (!mounted) return;
        
        setRecentScans(data.recentScans);
        setLeaderboard(data.leaderboard);
        setStats(data.stats);
        setHasGame(data.gameConfig !== null);
        setLoading(false);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load game overview");
          setLoading(false);
        }
      }
    };

    init();
    return () => {
      mounted = false;
    };
  }, [router]);

  const runReadinessCheck = async () => {
    if (checkingReadiness) return;
    setCheckingReadiness(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/hidden-trail/readiness", {
        method: "POST",
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to run readiness check");
      }
      const data = await response.json();
      setReadiness(data);
      // Refresh overview to get updated readiness timestamp
      const overviewRes = await fetch("/api/admin/hidden-trail/overview");
      const overviewData = await overviewRes.json();
      setRecentScans(overviewData.recentScans);
      setLeaderboard(overviewData.leaderboard);
      setStats(overviewData.stats);
      setHasGame(overviewData.gameConfig !== null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run readiness check");
    } finally {
      setCheckingReadiness(false);
    }
  };

  if (loading) {
    return (
      <div className="chapter-admin-content">
        <div className="chapter-admin-stat-grid">
          {Array.from({length:4}).map((_,i)=>(
            <div key={i} className="chapter-admin-card" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chapter-admin-empty">
        <h2 className="chapter-admin-empty-title">Failed to Load Overview</h2>
        <p className="chapter-admin-empty-text">{error || "We couldn't load the game overview right now."}</p>
        <button onClick={() => window.location.reload()} className="chapter-admin-btn">RETRY</button>
      </div>
    );
  }

  if (hasGame === false) {
    return (
      <div className="chapter-admin-empty">
        <h2 className="chapter-admin-empty-title">NO HIDDEN TRAIL GAME CONFIGURED</h2>
        <p className="chapter-admin-empty-text">Create or configure a Hidden Trail game to begin.</p>
        <a href="/admin/hidden-trail/settings" className="chapter-admin-btn">CONFIGURE GAME</a>
      </div>
    );
  }

  return (
    <div>
      <div className="chapter-admin-stat-grid">
        <StatCard label="TOTAL PLAYERS" value={stats.totalParticipants} icon="👥" />
        <StatCard label="ACTIVE" value={stats.activePlayers} icon="🟢" accent />
        <StatCard label="COMPLETED" value={stats.completedPlayers} icon="🏁" accent />
        <StatCard label="AVG SCORE" value={stats.totalParticipants > 0 
          ? Math.round(leaderboard.reduce((sum, l) => sum + l.total_points, 0) / stats.totalParticipants)
          : 0} icon="📊" />
      </div>

      <div className="chapter-admin-card" style={{ marginTop: "1rem", marginBottom: "1rem" }}>
        <h2 className="chapter-admin-section-title">GAME READINESS</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <button 
            onClick={runReadinessCheck} 
            disabled={checkingReadiness}
            className="chapter-admin-btn"
          >
            {checkingReadiness ? "Checking..." : "Run Readiness Check"}
          </button>
          {readiness && (
            <span className={readiness.passed ? "chapter-admin-badge chapter-admin-badge-accent" : "chapter-admin-badge"}>
              {readiness.passed ? "✓ READY" : "✗ NOT READY"}
            </span>
          )}
          {readiness && (
            <span style={{ fontSize: "0.875rem", color: "#666" }}>
              {readiness.level_count}/10 levels configured
            </span>
          )}
        </div>
        {readiness && (
          <details style={{ marginTop: "1rem" }}>
            <summary>View Checks</summary>
            <pre style={{ marginTop: "0.5rem", fontSize: "0.75rem", maxHeight: "300px", overflow: "auto" }}>
              {JSON.stringify(readiness.checks, null, 2)}
            </pre>
          </details>
        )}
      </div>

      <div className="chapter-admin-table-wrap">
        <h2 className="chapter-admin-section-title">LEVEL PERFORMANCE</h2>
        <table className="chapter-admin-table">
          <thead>
            <tr>
              <th>LEVEL</th>
              <th>TITLE</th>
              <th>COMPLETIONS</th>
              <th>CURRENT VALUE</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {stats.levelStats.map((level, index) => (
              <tr key={index}>
                <td>{String(level.level_number).padStart(2, '0')}</td>
                <td>{level.title}</td>
                <td>{level.successfulCompletions}</td>
                <td>{level.currentValue}</td>
                <td>
                  <span className={level.is_active ? "chapter-admin-badge chapter-admin-badge-accent" : "chapter-admin-badge"}>
                    {level.is_active ? "ACTIVE" : "INACTIVE"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="chapter-admin-card">
        <h2 className="chapter-admin-section-title">RECENT ACTIVITY</h2>
        <div>
          {recentScans.map((scan, index) => (
            <div key={index}>
              <p>{scan.profiles?.full_name?.split(" ")[0] || "Anonymous"}</p>
              <p>Level {String(scan.qr_levels?.level_number || 0).padStart(2, '0')}</p>
              <p>{scan.result}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="chapter-admin-table-wrap">
        <h2 className="chapter-admin-section-title">TOP 10 PLAYERS</h2>
        <table className="chapter-admin-table">
          <thead>
            <tr>
              <th>RANK</th>
              <th>PLAYER</th>
              <th>LEVEL</th>
              <th>POINTS</th>
              <th>STATUS</th>
              <th>COMPLETED</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, index) => (
              <tr key={entry.user_id}>
                <td>#{index + 1}</td>
                <td>{entry.profiles?.full_name || "Anonymous"}</td>
                <td>{entry.current_level}</td>
                <td>{entry.total_points}</td>
                <td>{entry.status.toUpperCase()}</td>
                <td>{entry.completed_at ? new Date(entry.completed_at).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, accent }: { 
  label: string; 
  value: number; 
  icon: string; 
  accent?: boolean;
}) {
  return (
    <div className="chapter-admin-stat-card">
      <p className="chapter-admin-stat-label">{label}</p>
      <div className={`chapter-admin-stat-value ${accent ? "accent" : ""}`}>
        <span>{icon}</span>
        <span>{value}</span>
      </div>
    </div>
  );
}
