"use client";

import { useEffect, useState } from "react";
import { HiddenTrailAdminShell } from "@/components/admin/hidden-trail/HiddenTrailAdminShell";
import { getClientAdminUser } from "@/lib/hidden-trail/admin-client";
import { useRouter, useParams } from "next/navigation";
import { BRANCH_LABELS } from "@/lib/profile/branches";

export default function ParticipantDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  const [adminUser, setAdminUser] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getClientAdminUser().then(u => {
      if (!u) router.replace("/admin/login");
      else setAdminUser(u);
      setLoading(false);
    });
  }, [router]);

  useEffect(() => {
    if (!adminUser) return;
    fetch(`/api/admin/hidden-trail/participants/${userId}`)
      .then(r => {
        if (!r.ok) throw new Error("Failed to load participant");
        return r.json();
      })
      .then(d => { setDetail(d); setLoading(false); })
      .catch(() => { setError("Could not load participant details."); setLoading(false); });
  }, [adminUser, userId]);

  if (loading || !adminUser) return null;

  const p = detail?.participant;
  const profile = p?.profiles;

  return (
    <HiddenTrailAdminShell adminUser={adminUser as any}>
      <div className="chapter-admin-content">
        <h1 className="chapter-admin-section-title">PARTICIPANT DETAIL</h1>

        {error ? (
          <div className="chapter-admin-empty">
            <h2 className="chapter-admin-empty-title">NOT FOUND</h2>
            <p className="chapter-admin-empty-text">{error}</p>
          </div>
        ) : (
          <>
            <div className="chapter-admin-card">
              <h2 className="chapter-admin-section-title">
                {profile?.full_name || "Anonymous"}
              </h2>
              <div className="chapter-admin-row">
                <div>
                  <strong>Email</strong> {profile?.email ?? "—"}
                </div>
                <div>
                  <strong>Branch</strong> {p?.profiles?.branch ? BRANCH_LABELS[p.profiles.branch as keyof typeof BRANCH_LABELS] ?? p.profiles.branch : "—"}
                </div>
                <div>
                  <strong>Status</strong> {p?.status ?? "not_started"}
                </div>
                <div>
                  <strong>Branch</strong> {p?.profiles?.branch ?? "—"}
                </div>
                <div>
                  <strong>Current Level</strong> {p?.current_level ?? 0}
                </div>
                <div>
                  <strong>Points</strong> {p?.total_points ?? 0}
                </div>
              </div>
              <div className="chapter-admin-row">
                <div>
                  <strong>Started</strong> {p?.started_at ? new Date(p.started_at).toLocaleString() : "—"}
                </div>
                <div>
                  <strong>Completed</strong> {p?.completed_at ? new Date(p.completed_at).toLocaleString() : "—"}
                </div>
                <div>
                  <strong>Duration</strong> {detail?.duration || "—"}
                </div>
              </div>
            </div>

            <div className="chapter-admin-card">
              <h2 className="chapter-admin-section-title">COMPLETED MARKERS</h2>
              {!detail?.completions || detail.completions.length === 0 ? (
                <p className="chapter-admin-muted">No markers cleared yet.</p>
              ) : (
                <table className="chapter-admin-table">
                  <thead>
                    <tr>
                      <th>LEVEL</th>
                      <th>TITLE</th>
                      <th>POSITION</th>
                      <th>POINTS</th>
                      <th>ANSWERED</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detail.completions as any[]).map((c) => (
                      <tr key={c.id}>
                        <td>{String(c.level_number ?? "?").padStart(2, "0")}</td>
                        <td>{c.level_title ?? "—"}</td>
                        <td>{c.scanner_position}</td>
                        <td>+{c.points_awarded}</td>
                        <td>{c.answered_at ? new Date(c.answered_at).toLocaleString() : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="chapter-admin-card">
              <h2 className="chapter-admin-section-title">SCAN LOG</h2>
              {!detail?.scanLogs || detail.scanLogs.length === 0 ? (
                <p className="chapter-admin-muted">No scan activity.</p>
              ) : (
                <table className="chapter-admin-table">
                  <thead>
                    <tr>
                      <th>LEVEL</th>
                      <th>RESULT</th>
                      <th>TIME</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detail.scanLogs as any[]).map((s) => (
                      <tr key={s.id}>
                        <td>{String(s.level_number ?? "?").padStart(2, "0")}</td>
                        <td>{s.result}</td>
                        <td>{new Date(s.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </HiddenTrailAdminShell>
  );
}
