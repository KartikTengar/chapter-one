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
  const [error, setError] = useState<string | null>(null);

  async function loadGames() {
    try {
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
      if (!u) { router.replace("/login"); return; }
      setAdminUser(u);
      loadGames();
    });
  }, [router]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete game "${name}"? This cannot be undone.`)) return;
    try {
      await gamesClient.delete(id);
      loadGames();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  }

  if (loading || !adminUser) return null;

  return (
    <HiddenTrailAdminShell adminUser={adminUser}>
      <div className="chapter-admin-content">
        <h1>Game Management</h1>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.5rem" }}>
          <Link href="/admin/games/new" className="button">Create New Game</Link>
          <span style={{ color: "var(--text-secondary)" }}>Manage Hidden Trail instances</span>
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <table className="chapter-admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Current</th>
              <th>Levels</th>
              <th>Participants</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {games.map(g => (
              <tr key={g.id}>
                <td><Link href={`/admin/games/${g.id}`}>{g.name}</Link></td>
                <td><span className={`badge badge--${g.status}`}>{g.status}</span></td>
                <td>{g.is_current ? "✓" : "—"}</td>
                <td>{g.level_count ?? "—"}</td>
                <td>{g.participant_count ?? "—"}</td>
                <td>
                  <Link href={`/admin/games/${g.id}`}>Edit</Link>
                  {" | "}
                  <button onClick={() => gamesClient.action(g.id, "duplicate", { name: g.name + " (copy)", slug: g.slug + "-copy" })}>Clone</button>
                  {" | "}
                  <button onClick={() => handleDelete(g.id, g.name)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </HiddenTrailAdminShell>
  );
}
