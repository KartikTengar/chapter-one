"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HiddenTrailAdminShell } from "@/components/admin/hidden-trail/HiddenTrailAdminShell";
import { getClientAdminUser } from "@/lib/hidden-trail/admin-client";
import { gamesClient } from "@/lib/hidden-trail/games-client";

export default function NewGamePage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<{ id: string; email: string; role: string } | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isHiddenTrail, setIsHiddenTrail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getClientAdminUser().then(u => {
      if (!u) router.replace("/login");
      else setAdminUser(u);
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const finalSlug = isHiddenTrail ? "hidden-trail" : slug;
      const data = await gamesClient.create({ name, slug: finalSlug, description });
      const gameId = data.data as string;
      
      // If marked as Hidden Trail game, set it as current
      if (isHiddenTrail) {
        await gamesClient.setCurrent(gameId);
      }
      
      router.push("/admin/games");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create game");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <HiddenTrailAdminShell adminUser={adminUser}>
      <div className="chapter-admin-content">
        <h1>Create New Game</h1>
        <div style={{ marginBottom: "1rem" }}>
          <Link href="/admin/games">&larr; Back to Games</Link>
        </div>
        <form onSubmit={handleSubmit} className="chapter-admin-form">
          <div className="form-field">
            <label>Game Name</label>
            <input value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="form-field">
            <label>Slug</label>
            <input 
              value={slug} 
              onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))} 
              required 
              placeholder="my-game"
              disabled={isHiddenTrail}
            />
            {isHiddenTrail && <small style={{color: "#666"}}>Slug is fixed to "hidden-trail" for Hidden Trail integration</small>}
          </div>
          <div className="form-field">
            <label>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="form-field" style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #eee" }}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isHiddenTrail}
                onChange={e => setIsHiddenTrail(e.target.checked)}
                className="chapter-admin-checkbox"
              />
              <span>
                <strong>Make this the Hidden Trail game</strong>
                <br />
                <small style={{color: "#666"}}>
                  Sets slug to "hidden-trail" and marks as current Hidden Trail instance.
                  This game will appear in the Hidden Trail dashboard at /admin/hidden-trail.
                </small>
              </span>
            </label>
          </div>
          {error && <p style={{ color: "red" }}>{error}</p>}
          <button type="submit" disabled={submitting} className="button">
            {submitting ? "Creating..." : "Create Game"}
          </button>
        </form>
      </div>
    </HiddenTrailAdminShell>
  );
}
