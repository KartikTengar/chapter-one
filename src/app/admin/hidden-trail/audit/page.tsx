"use client";

import { useEffect, useState } from "react";
import { HiddenTrailAdminShell } from "@/components/admin/hidden-trail/HiddenTrailAdminShell";
import { getClientAdminUser } from "@/lib/hidden-trail/admin-client";
import { useRouter } from "next/navigation";

export default function AuditPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasGame, setHasGame] = useState<boolean | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

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

  // Fetch audit logs when game is configured (always called to satisfy rules-of-hooks)
  useEffect(() => {
    if (!hasGame) return;
    fetch("/api/admin/hidden-trail/audit")
      .then(r => r.json())
      .then(d => {
        setAuditLogs(d.logs ?? []);
        setLoading(false);
      })
      .catch(() => {
        setAuditLogs([]);
        setLoading(false);
      });
  }, [hasGame]);

  if (loading || !adminUser) return null;

  if (!hasGame) {
    return (
      <HiddenTrailAdminShell adminUser={adminUser}>
        <div className="chapter-admin-empty">
          <h2 className="chapter-admin-empty-title">NO AUDIT RECORDS YET</h2>
          <p className="chapter-admin-empty-text">
            No audit records exist yet. Actions will appear here.
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
        <h1 className="chapter-admin-section-title">AUDIT LOG</h1>

          {auditLogs.length === 0 ? (
            <div className="chapter-admin-empty">
              <h2 className="chapter-admin-empty-title">NO AUDIT RECORDS YET</h2>
              <p className="chapter-admin-empty-text">
                No audit records exist yet.
              </p>
            </div>
          ) : (
            <table className="chapter-admin-table">
              <thead>
                <tr>
                  <th>ACTION</th>
                  <th>PARTICIPANT</th>
                  <th>LEVEL/QR</th>
                  <th>TIMESTAMP</th>
                  <th>POSITION</th>
                  <th>POINTS</th>
                  <th>RESULT</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log, i) => (
                  <tr key={log.id}>
                    <td>{log.action ?? "—"}</td>
                    <td>
                      {log.participant_id
                        ? "Participant"
                        : "—"}
                    </td>
                    <td>{log.entity_type ?? "—"}</td>
                    <td>
                      {log.created_at
                        ? new Date(log.created_at).toLocaleString()
                        : "—"}
                    </td>
                    <td>{log.scanner_position ?? "—"}</td>
                    <td>{log.points_awarded ?? "—"}</td>
                    <td>{log.result ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </HiddenTrailAdminShell>
  );
}