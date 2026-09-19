"use client";

import { useEffect, useState } from "react";
import { HiddenTrailAdminShell } from "@/components/admin/hidden-trail/HiddenTrailAdminShell";
import { getClientAdminUser } from "@/lib/hidden-trail/admin-client";
import { useRouter } from "next/navigation";

export default function AnalyticsPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasGame, setHasGame] = useState<boolean | null>(null);

  const [participantsStarted, setParticipantsStarted] = useState(0);
  const [participantsCompleted, setParticipantsCompleted] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);
  const [avgScore, setAvgScore] = useState(0);
  const [avgCompletion, setAvgCompletion] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [invalidScans, setInvalidScans] = useState(0);
  const [wrongSeqScans, setWrongSeqScans] = useState(0);

  const [levelStats, setLevelStats] = useState<
    Array<{ level_number: number; successfulCompletions: number; currentValue: number; avgTime?: number }>
  >([]);

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

  useEffect(() => {
    if (!hasGame) return;
    const loadData = async () => {
      try {
        const [overview, participantsRes] = await Promise.all([
          fetch("/api/admin/hidden-trail/overview").then(r => r.json()),
          fetch("/api/admin/hidden-trail/participants").then(r => r.json()),
        ]);

        const participants = participantsRes?.participants ?? [];
        const stats = overview?.stats ?? {};
        const levelStatsRaw = Array.isArray(stats.levelStats) ? stats.levelStats : [];

        const total = participants.length;
        const completedCount = (participants ?? []).filter(
          (p: any) => (p.status ?? "").toLowerCase() === "completed"
        ).length;
        const rate = total > 0 ? Math.round((completedCount / total) * 100) : 0;

        // Avg score from participant points
        const scores = participants.map((p: any) => p.total_points ?? 0);
        const avg = scores.length > 0
          ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
          : 0;

        setParticipantsStarted(total);
        setParticipantsCompleted(completedCount);
        setCompletionRate(rate);
        setAvgScore(avg);
        setWrongAnswers(Number(stats.wrongAnswers ?? 0));
        setInvalidScans(Number(stats.invalidScans ?? 0));
        setWrongSeqScans(Number(stats.invalidScans ?? 0));
        setLevelStats(levelStatsRaw);
        setLoading(false);
      } catch (e) {
        console.error("Analytics load error:", e);
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
          <h2 className="chapter-admin-empty-title">NO ANALYTICS DATA YET</h2>
          <p className="chapter-admin-empty-text">
            Configure a game to view analytics.
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
        <h1 className="chapter-admin-section-title">ANALYTICS</h1>

          <div className="chapter-admin-card">
            <h2>PARTICIPANTS</h2>
            <div className="chapter-admin-row">
              <div>
                <strong>Started</strong>{" "}
                {participantsStarted > 0 ? participantsStarted : "0"}
              </div>
              <div>
                <strong>Completed</strong>{" "}
                {participantsCompleted > 0 ? participantsCompleted : "0"}
              </div>
            </div>
            <div>
              <strong>Completion Rate</strong>{" "}
              {completionRate}%
            </div>
          </div>

          <div className="chapter-admin-card">
            <h2>SCORING</h2>
            <div className="chapter-admin-row">
              <div>
                <strong>Average Score</strong>{" "}
                {avgScore > 0 ? avgScore : "0"}
              </div>
              <div>
                <strong>Wrong Answers</strong>{" "}
                {wrongAnswers > 0 ? wrongAnswers : "0"}
              </div>
            </div>
            <div>
              <strong>Invalid Scans</strong>{" "}
              {invalidScans > 0 ? invalidScans : "0"}
              <strong>Wrong Sequence</strong>{" "}
              {wrongSeqScans > 0 ? wrongSeqScans : "0"}
            </div>
          </div>

        <h2>PER LEVEL</h2>
          {levelStats.length === 0 ? (
            <p>No level data yet.</p>
          ) : (
            <table className="chapter-admin-table">
              <thead>
                <tr>
                  <th>LEVEL</th>
                  <th>COMPLETIONS</th>
                  <th>CURRENT VALUE</th>
                  <th>DROP-OFF</th>
                </tr>
              </thead>
              <tbody>
                {levelStats.map((ls, i) => (
                  <tr key={ls.level_number}>
                    <td>{String(ls.level_number).padStart(2, "0")}</td>
                    <td>{ls.successfulCompletions}</td>
                    <td>{ls.currentValue}</td>
                    <td>—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </HiddenTrailAdminShell>
  );
}