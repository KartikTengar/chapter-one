"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HiddenTrailAdminShell } from "@/components/admin/hidden-trail/HiddenTrailAdminShell";
import { getClientAdminUser } from "@/lib/hidden-trail/admin-client";
import { gamesClient } from "@/lib/hidden-trail/games-client";

interface GameDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  is_current: boolean;
  start_at: string | null;
  end_at: string | null;
  archived_at: string | null;
  score_start_level: number;
  starting_score: number;
  score_floor: number;
  leaderboard_public: boolean;
  leaderboard_name_mode: string;
  photo_feature_enabled: boolean;
  gallery_enabled: boolean;
  live_display_enabled: boolean;
  readiness: Record<string, unknown> | null;
  readiness_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

type Tab = "overview" | "levels" | "readiness" | "lifecycle";

export default function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<{ id: string; email: string; role: string } | null>(null);
  const [game, setGame] = useState<GameDetail | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadGame() {
    try {
      const data = await gamesClient.get(id);
      setGame(data.data as GameDetail);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load game");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      const u = await getClientAdminUser();
      if (!u) { router.replace("/admin/login"); return; }
      setAdminUser(u);
      try {
        const data = await gamesClient.get(id);
        setGame(data.data as GameDetail);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load game");
      } finally {
        setLoading(false);
      }
    })();
  }, [router, id]);

  async function handleAction(action: string) {
    try {
      const body: Record<string, unknown> = { action };
      if (action === "duplicate") {
        body.name = game?.name + " (copy)";
        body.slug = game?.slug + "-copy";
      }
      await gamesClient.action(id, action, action === "duplicate" ? { name: game?.name + " (copy)", slug: game?.slug + "-copy" } : undefined);
      await loadGame();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Action failed");
    }
  }

  if (loading || !adminUser) return null;
  if (error) return <HiddenTrailAdminShell adminUser={adminUser}><div className="chapter-admin-alert chapter-admin-alert--error" role="alert">{error}</div></HiddenTrailAdminShell>;
  if (!game) return <HiddenTrailAdminShell adminUser={adminUser}><div className="chapter-admin-empty"><h1 className="chapter-admin-empty-title">Game not found</h1></div></HiddenTrailAdminShell>;

  return (
    <HiddenTrailAdminShell adminUser={adminUser}>
      <section className="chapter-admin-overview">
        <h1>{game.name}</h1>
        <div style={{ marginBottom: "1rem" }}>
          <Link href="/admin/games">&larr; Back to Games</Link>
        </div>
        <div className="chapter-admin-btn-group" role="tablist" aria-label="Game sections">
          {(["overview", "levels", "readiness", "lifecycle"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`chapter-admin-btn ${tab === t ? "" : "chapter-admin-btn--secondary"}`} role="tab" aria-selected={tab === t}>{t}</button>
          ))}
        </div>

        {tab === "overview" && (
          <div>
            <h2>Metadata</h2>
            <div className="chapter-admin-card">
              <div className="row"><span>Name</span><span>{game.name}</span></div>
              <div className="row"><span>Slug</span><span>{game.slug}</span></div>
              <div className="row"><span>Status</span><span className={`chapter-admin-badge ${game.status === "running" ? "chapter-admin-badge--active" : ""}`}>{game.status}</span></div>
              <div className="row"><span>Current</span><span>{game.is_current ? "Yes" : "No"}</span></div>
              <div className="row"><span>Score Start Level</span><span>{game.score_start_level}</span></div>
              <div className="row"><span>Starting Score</span><span>{game.starting_score}</span></div>
              <div className="row"><span>Score Floor</span><span>{game.score_floor}</span></div>
              <div className="row"><span>Leaderboard Public</span><span>{game.leaderboard_public ? "Yes" : "No"}</span></div>
              <div className="row"><span>Photo Feature</span><span>{game.photo_feature_enabled ? "Yes" : "No"}</span></div>
              <div className="row"><span>Gallery</span><span>{game.gallery_enabled ? "Yes" : "No"}</span></div>
              <div className="row"><span>Live Display</span><span>{game.live_display_enabled ? "Yes" : "No"}</span></div>
            </div>
          </div>
        )}

        {tab === "levels" && (
          <div>
            <h2>Levels</h2>
            <p>Configure 10 levels with riddles, answers, and QR tokens.</p>
            <Link href={`/admin/hidden-trail/levels`} className="chapter-admin-btn">Manage Levels</Link>
          </div>
        )}

        {tab === "readiness" && (
          <div>
            <h2>Readiness</h2>
            <button onClick={() => handleAction("readiness")} className="chapter-admin-btn">Run Readiness Check</button>
            {game.readiness && (
              <div style={{ marginTop: "1rem" }}>
                <p>Checked: {game.readiness_checked_at}</p>
                <p>Overall: <strong>{(game.readiness as { passed: boolean }).passed ? "PASS" : "FAIL"}</strong></p>
                <pre>{JSON.stringify(game.readiness, null, 2)}</pre>
              </div>
            )}
          </div>
        )}

        {tab === "lifecycle" && (
          <div>
            <h2>Lifecycle</h2>
            <div className="chapter-admin-actions">
              {game.status === "ready" && <button type="button" className="chapter-admin-btn chapter-admin-btn--secondary" onClick={() => handleAction("start")}>Start</button>}
              {game.status === "running" && <button type="button" className="chapter-admin-btn chapter-admin-btn--secondary" onClick={() => handleAction("pause")}>Pause</button>}
              {game.status === "paused" && <button type="button" className="chapter-admin-btn chapter-admin-btn--secondary" onClick={() => handleAction("resume")}>Resume</button>}
              {(game.status === "running" || game.status === "paused") && <button type="button" className="chapter-admin-btn chapter-admin-btn--secondary" onClick={() => handleAction("end")}>End</button>}
              {(game.status === "draft" || game.status === "ended") && <button type="button" className="chapter-admin-btn chapter-admin-btn--secondary" onClick={() => handleAction("archive")}>Archive</button>}
              {(game.status === "draft" || game.status === "ready") && <button type="button" className="chapter-admin-btn chapter-admin-btn--secondary" onClick={() => handleAction("ready")}>Mark Ready</button>}
              {game.status !== "running" && game.status !== "paused" && (
                <button type="button" className="chapter-admin-btn chapter-admin-btn--danger" onClick={async () => { if (confirm("Delete this game?")) { try { await gamesClient.delete(id); router.push("/admin/games"); } catch (e) { alert(e instanceof Error ? e.message : "Delete failed"); } } }}>Delete</button>
              )}
              {!game.is_current && <button type="button" className="chapter-admin-btn chapter-admin-btn--secondary" onClick={() => handleAction("setCurrent")}>Set as Current</button>}
            </div>
          </div>
        )}
      </section>
    </HiddenTrailAdminShell>
  );
}


