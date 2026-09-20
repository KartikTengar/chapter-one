"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HiddenTrailAdminShell } from "@/components/admin/hidden-trail/HiddenTrailAdminShell";
import { getClientAdminUser } from "@/lib/hidden-trail/admin-client";
import { gamesClient } from "@/lib/hidden-trail/games-client";

interface GameRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  is_current: boolean;
  level_count?: number;
  participant_count?: number;
  created_at: string;
}

export default function GamesPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<{ id: string; email: string; role: string } | null>(null);
  const [games, setGames] = useState<GameRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadGames() {
    try {
      setError(null);
      const data = await gamesClient.list();
      setGames((data.data as GameRow[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load games");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getClientAdminUser().then(u => {
      if (!u) { router.replace("/admin/login"); return; }
      setAdminUser(u);
      loadGames();
    });
  }, [router]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete game "${name}"? This cannot be undone.`)) return;
    setBusyId(id);
    try {
      await gamesClient.delete(id);
      await loadGames();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  async function handleClone(game: GameRow) {
    setBusyId(game.id);
    try {
      await gamesClient.action(game.id, "duplicate", { name: game.name + " (copy)", slug: game.slug + "-copy" });
      await loadGames();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Clone failed");
    } finally {
      setBusyId(null);
    }
  }

  if (!adminUser) return null;

  return (
    <HiddenTrailAdminShell adminUser={adminUser}>
      <section className="chapter-admin-overview" aria-labelledby="games-title">
        <header className="chapter-admin-edit-header">
          <div>
            <p className="chapter-admin-nav-group-label" style={{ padding: 0 }}>Game management</p>
            <h1 id="games-title">Games</h1>
            <p className="chapter-admin-help-text">Create and operate Hidden Trail game instances.</p>
          </div>
          <Link href="/admin/games/new" className="chapter-admin-btn">Create new game</Link>
        </header>

        {error && <div className="chapter-admin-alert chapter-admin-alert--error" role="alert">{error}</div>}

        <div className="chapter-admin-card">
          {loading ? (
            <p className="chapter-admin-help-text" role="status">Loading games…</p>
          ) : games.length === 0 ? (
            <div className="chapter-admin-empty">
              <h2 className="chapter-admin-empty-title">No games yet</h2>
              <p className="chapter-admin-empty-text">Create your first game instance to begin configuration.</p>
              <Link href="/admin/games/new" className="chapter-admin-btn">Create game</Link>
            </div>
          ) : (
            <div className="chapter-admin-table-wrap">
              <table className="chapter-admin-table">
                <thead>
                  <tr><th>Name</th><th>Status</th><th>Current</th><th>Levels</th><th>Participants</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {games.map(g => (
                    <tr key={g.id}>
                      <td><Link href={`/admin/games/${g.id}`}>{g.name}</Link><div className="chapter-admin-help-text">{g.slug}</div></td>
                      <td><span className={`chapter-admin-badge ${g.status === "running" ? "chapter-admin-badge--active" : ""}`}>{g.status}</span></td>
                      <td>{g.is_current ? "Yes" : "No"}</td>
                      <td>{g.level_count ?? "—"}</td>
                      <td>{g.participant_count ?? "—"}</td>
                      <td>
                        <div className="chapter-admin-actions">
                          <Link href={`/admin/games/${g.id}`} className="chapter-admin-btn chapter-admin-btn--secondary">Edit</Link>
                          <button type="button" className="chapter-admin-btn chapter-admin-btn--secondary" disabled={busyId === g.id} onClick={() => handleClone(g)}>Clone</button>
                          <button type="button" className="chapter-admin-btn chapter-admin-btn--danger" disabled={busyId === g.id} onClick={() => handleDelete(g.id, g.name)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </HiddenTrailAdminShell>
  );
}
