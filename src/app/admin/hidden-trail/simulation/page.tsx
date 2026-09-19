"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HiddenTrailAdminShell } from "@/components/admin/hidden-trail/HiddenTrailAdminShell";
import { getClientAdminUser } from "@/lib/hidden-trail/admin-client";
import { getSimulation, type SimulationResult } from "@/lib/api/trail";

export default function SimulationPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  useEffect(() => {
    getClientAdminUser().then((u) => {
      if (!u) router.replace("/login");
      else setAdminUser(u);
      setLoading(false);
    });
  }, [router]);

  const run = async () => {
    setRunning(true);
    try {
      const res = await getSimulation(20);
      setResult(res);
    } catch {
      setResult(null);
    } finally {
      setRunning(false);
    }
  };

  if (loading || !adminUser) return null;

  return (
    <HiddenTrailAdminShell adminUser={adminUser}>
      <div className="chapter-admin-content">
        <h1 className="chapter-admin-section-title">SIMULATION MODE</h1>

        <div className="chapter-admin-card chapter-admin-alert chapter-admin-alert-warning">
          <h3>SIMULATION — NOT REAL DATA</h3>
          <p>
            Runs entirely in memory. No production participant records, scores,
            leaderboards, photos, achievements, or audit rows are created or changed.
          </p>
        </div>

        <div className="chapter-admin-card">
          <button className="chapter-admin-btn" onClick={run} disabled={running}>
            {running ? "RUNNING…" : "RUN SIMULATION (20 positions)"}
          </button>
        </div>

        {result && (
          <>
            <div className="chapter-admin-card">
              <h2 className="chapter-admin-section-title">SCORING TABLE</h2>
              <div className="chapter-admin-table-wrap">
                <table className="chapter-admin-table">
                  <thead>
                    <tr><th>POSITION</th><th>POINTS</th></tr>
                  </thead>
                  <tbody>
                    {result.scores.map((s) => (
                      <tr key={s.position}>
                        <td>{s.position}</td>
                        <td>{s.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="chapter-admin-muted">{result.scoring_note}</p>
            </div>

            <div className="chapter-admin-card">
              <h2 className="chapter-admin-section-title">CONCURRENCY — 10 SIMULTANEOUS SUBMISSIONS</h2>
              <div className="chapter-admin-table-wrap">
                <table className="chapter-admin-table">
                  <thead>
                    <tr><th>REQUEST</th><th>ALLOCATED POSITION</th><th>POINTS</th></tr>
                  </thead>
                  <tbody>
                    {result.concurrency.allocated.map((c) => (
                      <tr key={c.request}>
                        <td>{c.request}</td>
                        <td>{c.allocated_position}</td>
                        <td>{c.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="chapter-admin-muted">
                Unique positions: {result.concurrency.unique ? "YES" : "NO"}
              </p>
            </div>

            <div className="chapter-admin-row">
              <div className="chapter-admin-card">
                <h3>Wrong Answer</h3>
                <p>Result: {result.wrong_answer.result} · Points: {result.wrong_answer.points} · Progression: {result.wrong_answer.progression}</p>
              </div>
              <div className="chapter-admin-card">
                <h3>Wrong Trail</h3>
                <p>Result: {result.wrong_trail.result} · Disclosure: {result.wrong_trail.disclosure}</p>
              </div>
              <div className="chapter-admin-card">
                <h3>Duplicate</h3>
                <p>{result.duplicate.submissions} submissions → {result.duplicate.completions} completion, {result.duplicate.score_grants} score grant, {result.duplicate.positions} position</p>
              </div>
            </div>

            <div className="chapter-admin-card">
              <h2 className="chapter-admin-section-title">ENGAGEMENT</h2>
              <p>Current streak: {result.engagement.streak_current} · Best streak: {result.engagement.streak_best}</p>
              <ul className="chapter-admin-list">
                {result.engagement.achievements.map((a) => (
                  <li key={a.code}>
                    {a.code}: {a.eligible ? "ELIGIBLE" : "NOT ELIGIBLE"}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </HiddenTrailAdminShell>
  );
}