"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HiddenTrailAdminShell } from "@/components/admin/hidden-trail/HiddenTrailAdminShell";
import { getClientAdminUser } from "@/lib/hidden-trail/admin-client";
import { adminGetPhotos, adminModeratePhoto, adminDeletePhoto, type AdminPhoto } from "@/lib/api/trail";

export default function AdminPhotosPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<{ id: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<AdminPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getClientAdminUser().then((u) => {
      if (!u) router.replace("/login");
      else setAdminUser(u);
      setLoading(false);
    });
  }, [router]);

  useEffect(() => {
    if (!adminUser) return;
    adminGetPhotos()
      .then((d) => setPhotos(d.photos ?? []))
      .catch(() => setError("Could not load photos."))
      .finally(() => setLoading(false));
  }, [adminUser]);

  const act = async (id: string, action: "approve" | "hide" | "feature") => {
    try {
      await adminModeratePhoto(id, action);
      const d = await adminGetPhotos();
      setPhotos(d.photos ?? []);
    } catch {
      setError("Moderation action failed.");
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this photo?")) return;
    try {
      await adminDeletePhoto(id);
      const d = await adminGetPhotos();
      setPhotos(d.photos ?? []);
    } catch {
      setError("Delete failed.");
    }
  };

  if (loading || !adminUser) return null;

  return (
    <HiddenTrailAdminShell adminUser={adminUser}>
      <div className="chapter-admin-content">
        <h1 className="chapter-admin-section-title">PHOTO MODERATION</h1>

        {error && <div className="chapter-admin-alert chapter-admin-alert-error"><p>{error}</p></div>}

        {photos.length === 0 ? (
          <div className="chapter-admin-empty">
            <h2 className="chapter-admin-empty-title">NO PHOTOS YET</h2>
            <p className="chapter-admin-empty-text">Participant moments will appear here for moderation.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {photos.map((p) => (
              <div key={p.id} className="chapter-admin-card">
                {p.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.url} alt={`Photo at Marker ${String(p.level_number ?? "?").padStart(2, "0")}`} className="w-full aspect-square object-cover rounded-lg" loading="lazy" />
                ) : (
                  <div className="w-full aspect-square bg-[var(--surface-2)] flex items-center justify-center text-xs text-[var(--muted)]">Unavailable</div>
                )}
                <div className="mt-3 space-y-1">
                  <p className="font-bold text-sm">{p.display_name}</p>
                  <p className="text-xs text-[var(--muted)]">Marker {String(p.level_number ?? "?").padStart(2, "0")} · {p.capture_stage}</p>
                  <p className="text-xs text-[var(--muted)]">Visibility: {p.visibility} · Moderation: {p.moderation_status}</p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button className="chapter-admin-btn" onClick={() => act(p.id, "approve")}>Approve</button>
                    <button className="chapter-admin-btn chapter-admin-btn-outline" onClick={() => act(p.id, "feature")}>Feature</button>
                    <button className="chapter-admin-btn chapter-admin-btn-outline" onClick={() => act(p.id, "hide")}>Hide</button>
                    <button className="chapter-admin-btn" onClick={() => remove(p.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </HiddenTrailAdminShell>
  );
}