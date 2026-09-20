"use client";

import { useEffect, useState } from "react";
import { HiddenTrailAdminShell } from "@/components/admin/hidden-trail/HiddenTrailAdminShell";
import { getClientAdminUser } from "@/lib/hidden-trail/admin-client";
import { BranchSelector } from "@/components/leaderboard/BranchSelector";
import { BRANCH_LABELS } from "@/lib/profile/branches";
import { useRouter } from "next/navigation";

export default function LivePage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasGame, setHasGame] = useState<boolean | null>(null);
  const [activeCount, setActiveCount] = useState(0);
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [topScores, setTopScores] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("");

  useEffect(() => {
    let mounted = true;
    getClientAdminUser().then(u => {
      if (!mounted) return;
      if (!u) {
        router.replace("/admin/login");
        return;
      }
      setAdminUser(u);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [router]);

  useEffect(() => {
    let mounted = true;
    fetch("/api/admin/hidden-trail/overview", { cache: "no-store", credentials: "include" })
      .then(r => r.json())
      .then(d => {
        if (mounted) setHasGame(!!d.gameConfig);
      })
      .catch(() => {
        if (mounted) setHasGame(false);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!hasGame) return;
    let mounted = true;

    const loadData = async () => {
      try {
        const query = selectedBranch ? `?branch=${encodeURIComponent(selectedBranch)}` : "";
        const res = await fetch(`/api/admin/hidden-trail/live${query}`, {
          cache: "no-store",
          credentials: "include",
        });
        const data = await res.json();
        if (!mounted) return;
        if (!res.ok) throw new Error(data?.error || "Failed to load live monitor");

        setRecentScans(data.recentScans ?? []);
        const participants = data.participants ?? [];
        setActiveCount(participants.filter((p: any) => p.status === "active").length);
        setTopScores(
          [...participants]
            .sort((a: any, b: any) => (b.total_points ?? 0) - (a.total_points ?? 0))
            .slice(0, 5)
        );
        setLoading(false);
      } catch (e) {
        console.error("Live monitor load error:", e);
        if (mounted) setLoading(false);
      }
    };

    void loadData();
    return () => { mounted = false; };
  }, [hasGame, selectedBranch]);

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

  return (
    <HiddenTrailAdminShell adminUser={adminUser}>
      <div className="chapter-admin-content">
        <div className="chapter-admin-section-heading">
          <div>
            <h1 className="chapter-admin-section-title">LIVE MONITOR</h1>
            <p className="chapter-admin-muted">
              {selectedBranch
                ? `${BRANCH_LABELS[selectedBranch as keyof typeof BRANCH_LABELS] ?? selectedBranch} · live activity`
                : "All branches · live activity"}
            </p>
          </div>
          <BranchSelector value={selectedBranch} onChange={setSelectedBranch} disabled={loading} />
        </div>

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
                    <span>{p.profiles?.full_name?.trim() || p.profiles?.email || "Anonymous"}</span>{" "}
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
                <li className="chapter-admin-muted">
                  {selectedBranch ? "No scan activity for this branch yet." : "Waiting for the trail to begin…"}
                </li>
              ) : (
                recentScans.map((s) => (
                  <li key={s.id}>
                    <span>{s.profiles?.full_name?.split(" ")[0] ?? s.profiles?.email ?? "Anonymous"}</span>{" "}
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
          <button
            type="button"
            className="chapter-admin-btn"
            onClick={() => window.location.reload()}
          >
            REFRESH
          </button>
        </div>
      </div>
    </HiddenTrailAdminShell>
  );
}
