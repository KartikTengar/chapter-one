"use client";

import { useEffect, useState } from "react";
import { HiddenTrailAdminShell } from "@/components/admin/hidden-trail/HiddenTrailAdminShell";
import { getClientAdminUser } from "@/lib/hidden-trail/admin-client";
import { useRouter } from "next/navigation";

export default function QRPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasGame, setHasGame] = useState<boolean | null>(null);
  const [levels, setLevels] = useState<any[]>([]);
  const [gameId, setGameId] = useState<string | null>(null);

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
      .then(d => {
        setHasGame(!!d.gameConfig);
        if (d.gameConfig) setGameId(d.gameConfig.id);
      })
      .catch(() => setHasGame(false));
  }, []);

  // Fetch levels when game is configured (always called to satisfy rules-of-hooks)
  useEffect(() => {
    if (!hasGame) return;
    fetch("/api/admin/hidden-trail/levels")
      .then(r => r.json())
      .then(d => {
        setLevels(d.levels ?? []);
        setLoading(false);
      })
      .catch(() => {
        setLevels([]);
        setLoading(false);
      });
  }, [hasGame]);

  const toggle = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/admin/hidden-trail/levels/${id}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      router.refresh();
    } catch {
      // ignore transient errors
    }
  };

  const regenerate = async (id: string) => {
    try {
      await fetch(`/api/admin/hidden-trail/levels/${id}/regenerate`, { method: "POST" });
      router.refresh();
    } catch {
      // ignore transient errors
    }
  };

  if (loading || !adminUser) return null;

  if (!hasGame) {
    return (
      <HiddenTrailAdminShell adminUser={adminUser}>
        <div className="chapter-admin-empty">
          <h2 className="chapter-admin-empty-title">CREATE A GAME FIRST</h2>
          <p className="chapter-admin-empty-text">
            Configure Hidden Trail before managing QR codes.
          </p>
          <a href="/admin/hidden-trail/settings" className="chapter-admin-btn">
            CONFIGURE GAME
          </a>
        </div>
      </HiddenTrailAdminShell>
    );
  }

  if (loading) return null;

  const printUrl = (levelId: string) => {
    const base = `/admin/hidden-trail/qr/print/${levelId}`;
    return gameId ? `${base}?gameId=${gameId}` : base;
  };

  return (
    <HiddenTrailAdminShell adminUser={adminUser}>
      <div className="chapter-admin-content">
        <h1 className="chapter-admin-section-title">QR MANAGEMENT</h1>

        <div className="chapter-admin-card">
              {levels.length === 0 ? (
                <p>No levels configured.</p>
              ) : (
                <table className="chapter-admin-table">
                  <thead>
                    <tr>
                      <th>LEVEL</th>
                      <th>TITLE</th>
                      <th>ACTIVE</th>
                      <th>TOKEN STATE</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {levels.map((level, i) => (
                      <tr key={level.id}>
                        <td>{String(level.level_number).padStart(2, "0")}</td>
                        <td>{level.title ?? "Unnamed"}</td>
                        <td>
                          {level.is_active ? "Active" : "Disabled"}
                        </td>
                        <td>
                          {level.token
                            ? "Opaque token (regenerate to view)"
                            : "No token — use Regenerate"}
                        </td>
                        <td>
                          <div className="chapter-admin-btn-group">
                            <button
                              className="chapter-admin-btn chapter-admin-btn-outline"
                              onClick={() => toggle(level.id, level.is_active)}
                            >
                              {level.is_active ? "Disable" : "Activate"}
                            </button>
                            <a
                              href={printUrl(level.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="chapter-admin-btn"
                            >
                              Download / Print
                            </a>
                            <button
                              className="chapter-admin-btn chapter-admin-btn-outline"
                              onClick={() => regenerate(level.id)}
                            >
                              Regenerate
                            </button>
                          </div>
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
      </div>
    </HiddenTrailAdminShell>
  );
}