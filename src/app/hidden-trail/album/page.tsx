"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAlbum, updateTrailPhoto, deleteTrailPhoto, type AlbumPhoto } from "@/lib/api/trail";
import { HiddenTrailShell } from "@/components/hidden-trail/HiddenTrailShell";

export default function TrailAlbumPage() {
  const [photos, setPhotos] = useState<AlbumPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    getAlbum()
      .then((d) => setPhotos(d.photos ?? []))
      .catch(() => setError("Could not load your album."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleFavorite = async (p: AlbumPhoto) => {
    try {
      await updateTrailPhoto(p.id, { is_favorite: !p.is_favorite });
      load();
    } catch {
      // ignore
    }
  };

  const setVisibility = async (p: AlbumPhoto, visibility: "private" | "gallery") => {
    try {
      await updateTrailPhoto(p.id, { visibility, consent: true });
      load();
    } catch {
      // ignore
    }
  };

  const remove = async (p: AlbumPhoto) => {
    if (!window.confirm("Delete this photo? It will be removed from your album.")) return;
    try {
      await deleteTrailPhoto(p.id);
      load();
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <HiddenTrailShell>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-[var(--accent)] font-bold">Loading your album…</p>
        </div>
      </HiddenTrailShell>
    );
  }

  return (
    <HiddenTrailShell>
      <div className="max-container mx-auto py-10 px-4">
        <h1 className="text-3xl font-black uppercase tracking-tight text-[var(--foreground)] mb-1">My Hidden Trail</h1>
        <p className="text-sm text-[var(--muted)] mb-8">
          {photos.length} {photos.length === 1 ? "moment" : "moments"} captured
        </p>

        {error && <p className="text-[var(--error)] mb-6">{error}</p>}

        {photos.length === 0 ? (
          <div className="text-center py-16 border border-white/[0.06] rounded-2xl">
            <p className="text-[var(--muted)] mb-4">No moments yet. Take a photo at your next marker.</p>
            <Link href="/hidden-trail" className="rounded-full px-6 py-3 bg-[var(--accent)] text-[var(--background)] font-bold text-sm">
              BACK TO TRAIL
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((p) => (
              <div key={p.id} className="rounded-xl overflow-hidden border border-white/[0.06] bg-[var(--surface)]">
                {p.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.url} alt={`Hidden Trail moment at Marker ${String(p.level_number ?? "?").padStart(2, "0")}`} className="w-full aspect-square object-cover" loading="lazy" />
                ) : (
                  <div className="w-full aspect-square bg-[var(--surface-2)] flex items-center justify-center text-[var(--muted)] text-xs">Unavailable</div>
                )}
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-[var(--muted)]">
                      Marker {String(p.level_number ?? "?").padStart(2, "0")}
                    </span>
                    <span className="text-xs uppercase tracking-wider text-[var(--muted)]">{p.moderation_status}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="text-xs rounded-full px-3 py-1 bg-white/[0.05] hover:bg-white/[0.1]" onClick={() => toggleFavorite(p)}>
                      {p.is_favorite ? "★ Favorite" : "☆ Favorite"}
                    </button>
                    {p.visibility === "private" ? (
                      <button className="text-xs rounded-full px-3 py-1 bg-white/[0.05] hover:bg-white/[0.1]" onClick={() => setVisibility(p, "gallery")}>
                        Show in gallery
                      </button>
                    ) : (
                      <button className="text-xs rounded-full px-3 py-1 bg-white/[0.05] hover:bg-white/[0.1]" onClick={() => setVisibility(p, "private")}>
                        Make private
                      </button>
                    )}
                    <button className="text-xs rounded-full px-3 py-1 bg-[var(--error)]/20 hover:bg-[var(--error)]/30" onClick={() => remove(p)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link href="/hidden-trail" className="text-sm text-[var(--accent)]">← Back to Trail</Link>
        </div>
      </div>
    </HiddenTrailShell>
  );
}