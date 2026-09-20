"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HiddenTrailAdminShell } from "@/components/admin/hidden-trail/HiddenTrailAdminShell";
import { getClientAdminUser } from "@/lib/hidden-trail/admin-client";
import { gamesClient } from "@/lib/hidden-trail/games-client";

export default function NewGamePage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isHiddenTrail, setIsHiddenTrail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getClientAdminUser().then(u => {
      if (!u) router.replace("/admin/login");
      else setAdminUser(u);
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const finalSlug = isHiddenTrail ? "hidden-trail" : slug;
      const response = await gamesClient.create({ name: name.trim(), slug: finalSlug, description: description.trim() });
      const game = response.data;
      if (!game.id) throw new Error("Created game is missing ID");
      if (isHiddenTrail) await gamesClient.setCurrent(game.id);
      router.push("/admin/games");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create game");
    } finally {
      setSubmitting(false);
    }
  }

  if (!adminUser) return null;

  return (
    <HiddenTrailAdminShell adminUser={adminUser}>
      <section className="chapter-admin-overview" aria-labelledby="new-game-title">
        <header className="chapter-admin-edit-header">
          <div>
            <p className="chapter-admin-nav-group-label" style={{ padding: 0 }}>Game management</p>
            <h1 id="new-game-title">Create new game</h1>
          </div>
          <Link href="/admin/games" className="chapter-admin-btn chapter-admin-btn--secondary">Back to games</Link>
        </header>

        <form onSubmit={handleSubmit} className="chapter-admin-card chapter-admin-form">
          <div className="chapter-admin-form-field">
            <label htmlFor="game-name">Game name</label>
            <input id="game-name" value={name} onChange={e => setName(e.target.value)} required maxLength={120} autoComplete="off" />
          </div>

          <div className="chapter-admin-form-field">
            <label htmlFor="game-slug">Slug</label>
            <input id="game-slug" value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, ""))} required={!isHiddenTrail} disabled={isHiddenTrail} placeholder="my-game" maxLength={80} />
            {isHiddenTrail && <p className="chapter-admin-help-text">Slug is fixed to <strong>hidden-trail</strong> for Hidden Trail integration.</p>}
          </div>

          <div className="chapter-admin-form-field">
            <label htmlFor="game-description">Description</label>
            <textarea id="game-description" value={description} onChange={e => setDescription(e.target.value)} rows={5} maxLength={1000} />
          </div>

          <label className="chapter-admin-form-field chapter-admin-form-field--checkbox">
            <input type="checkbox" checked={isHiddenTrail} onChange={e => setIsHiddenTrail(e.target.checked)} />
            <span><strong>Make this the Hidden Trail game</strong><br /><small className="chapter-admin-help-text">Sets the slug to hidden-trail and marks this instance as current.</small></span>
          </label>

          {error && <div className="chapter-admin-alert chapter-admin-alert--error" role="alert">{error}</div>}

          <div className="chapter-admin-btn-group">
            <button type="submit" disabled={submitting} className="chapter-admin-btn">
              {submitting ? "Creating…" : "Create game"}
            </button>
            <Link href="/admin/games" className="chapter-admin-btn chapter-admin-btn--secondary">Cancel</Link>
          </div>
        </form>
      </section>
    </HiddenTrailAdminShell>
  );
}
