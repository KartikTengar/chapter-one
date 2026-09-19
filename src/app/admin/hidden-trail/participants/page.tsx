"use client";

import { useEffect, useState } from "react";
import { HiddenTrailAdminShell } from "@/components/admin/hidden-trail/HiddenTrailAdminShell";
import { getClientAdminUser } from "@/lib/hidden-trail/admin-client";
import { useRouter } from "next/navigation";

export default function ParticipantsPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<
    | { id: string; email: string; role: string }
    | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [hasGame, setHasGame] = useState<boolean | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);

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

  // Fetch participants when game is configured (always called to satisfy rules-of-hooks)
  useEffect(() => {
    if (!hasGame) return;
    fetch("/api/admin/hidden-trail/participants")
      .then(r => r.json())
      .then(d => {
        setParticipants(d.participants ?? []);
        setLoading(false);
      })
      .catch(() => {
        setParticipants([]);
        setLoading(false);
      });
  }, [hasGame]);

  if (loading || !adminUser) return null;

  if (!hasGame) {
    return (
      <HiddenTrailAdminShell adminUser={adminUser}>
        <div className="chapter-admin-empty">
          <h2 className="chapter-admin-empty-title">CREATE A GAME FIRST</h2>
          <p className="chapter-admin-empty-text">
            Configure Hidden Trail before viewing participants.
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
        <h1 className="chapter-admin-section-title">PARTICIPANTS</h1>

        {!hasGame ? (
            <div className="chapter-admin-empty">
              <h2 className="chapter-admin-empty-title">CREATE A GAME FIRST</h2>
              <p className="chapter-admin-empty-text">
                Configure Hidden Trail before viewing participants.
              </p>
              <a href="/admin/hidden-trail/settings" className="chapter-admin-btn">
                CONFIGURE GAME
              </a>
            </div>
          ) : (
            <div className="chapter-admin-card">
              {participants.length === 0 ? (
                <p>No participants yet.</p>
              ) : (
                <table className="chapter-admin-table">
                  <thead>
                    <tr>
                      <th>NAME</th>
                      <th>STATUS</th>
                      <th>CURRENT LEVEL</th>
                      <th>POINTS</th>
                      <th>STARTED</th>
                      <th>COMPLETED</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((p, i) => (
                      <tr key={p.user_id}>
                        <td>
                          {p.profiles?.full_name ?? "Anonymous"}
                        </td>
                        <td>{p.status ?? "not_started"}</td>
                        <td>{p.current_level ?? 0}</td>
                        <td>{p.total_points ?? 0}</td>
                        <td>
                          {p.started_at
                            ? new Date(p.started_at).toLocaleDateString()
                            : "—"}
                        </td>
                        <td>
                          {p.completed_at
                            ? new Date(p.completed_at).toLocaleDateString()
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div>
                <button
                  className="chapter-admin-btn"
                  onClick={() => router.refresh()}
                >
                  Refresh
                </button>
              </div>
            </div>
          )}
      </div>
    </HiddenTrailAdminShell>
  );
}