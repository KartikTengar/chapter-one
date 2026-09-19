"use client";

import { useEffect, useState } from "react";
import { HiddenTrailAdminShell } from "@/components/admin/hidden-trail/HiddenTrailAdminShell";
import { getClientAdminUser } from "@/lib/hidden-trail/admin-client";
import { useRouter } from "next/navigation";

export default function LivePage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasGame, setHasGame] = useState<boolean | null>(null);
  const [activeCount, setActiveCount] = useState(0);
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [topScores, setTopScores] = useState<any[]>([]);

  useEffect(() => {
    getClientAdminUser().then(u => {
      if (!u) router.replace("/login");
      else setAdminUser(u);
      setLoading(false);
    });
  }, [router]);

  useEffect(() => {
    fetch("/api/admin/hidden-trail/overview")
      .then(r => r.json())
      .then(d => setHasGame(!!d.gameConfig))
      .catch(() => setHasGame(false));
  }, []);

  // Fetch scan logs and participants when game is configured (always called to satisfy rules-of-hooks)
  useEffect(() => {
    if (!hasGame) return;
    const loadData = async () => {
      try {
        const res = await fetch("/api/admin/hidden-trail/live");
        const data = await res.json();
        setRecentScans(data.recentScans ?? []);
        const participants = data.participants ?? [];
        const active = participants.filter(
          (p: any) => p.status === "active"
        ).length;
        setActiveCount(active);
        const sorted = [...participants]
          .sort((a: any, b: any) => (b.total_points ?? 0) - (a.total_points ?? 0))
          .slice(0, 5);
        setTopScores(sorted);
        setLoading(false);
      } catch (e) {
        console.error("Live monitor load error:", e);
        setLoading(false);
      }
    };
    loadData();
  }, [hasGame]);

  if (loading || !adminUser) return null;

  if (!hasGame) {
    return (
      <HiddenTrailAdminShell adminUser={adminUser}>
        <div className="chapter-admin-empty">
          <h2 className="chapter-admin-empty-title">NO ACTIVE PARTICIPANTS</h2>
          <p className="chapter-admin-empty-text">
            Configure a game to start monitoring.
          </p>
          <a href="/admin/hidden-trail/settings" className="chapter-admin-btn">
            CONFIGURE GAME
          </a>
        </div>
      </HiddenTrailAdminShell>
    );
  }

  if (loading) return null;

  return (
    <HiddenTrailAdminShell adminUser={adminUser}>
      <div className="chapter-admin-content">
        <h1 className="chapter-admin-section-title">LIVE MONITOR</h1>

          <div className="chapter-admin-row">
            <div className="chapter-admin-card">
              <h2 className="chapter-admin-section-title">ACTIVE PARTICIPANTS</h2>
              <p className="chapter-admin-stat-value accent">{activeCount}</p>
            </div>
            <div className="chapter-admin-card">
              <h2 className="chapter-admin-section-title">TOP SCORES</h2>
              <ul className="chapter-admin-list">
                {topScores.length === 0 ? (
                  <li className="chapter-admin-muted">Waiting for activity…</li>
                ) : (
                  topScores.map((p, i) => (
                    <li key={p.user_id}>
                      <span>#{i + 1}</span>{" "}
                      <span>{p.profiles?.full_name ?? "Anonymous"}</span>{" "}
                      <strong>{p.total_points ?? 0} pts</strong>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          <div className="chapter-admin-row">
            <div className="chapter-admin-card">
              <h2 className="chapter-admin-section-title">RECENT SCANS</h2>
              <ul className="chapter-admin-list">
                {recentScans.length === 0 ? (
                  <li className="chapter-admin-muted">Waiting for the trail to begin…</li>
                ) : (
                  recentScans.map((s) => (
                    <li key={s.id}>
                      <span>{s.profiles?.full_name?.split(" ")[0] ?? "Anonymous"}</span>{" "}
                      <span className="chapter-admin-muted">Level {s.qr_levels?.level_number ?? "?"}</span>{" "}
                      <span>{s.result}</span>{" "}
                      <span className="chapter-admin-muted">
                        {new Date(s.created_at).toLocaleTimeString()}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          <div className="chapter-admin-card">
            <p>
              <button
                className="chapter-admin-btn"
                onClick={() => router.refresh()}
              >
                REFRESH
              </button>
            </p>
          </div>
      </div>
    </HiddenTrailAdminShell>
  );
}