"use client";

import { useEffect, useState, useCallback } from "react";
import { getGallery, type GalleryPhoto } from "@/lib/api/trail";

export default function GalleryPage() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [configured, setConfigured] = useState(false);
  const [galleryEnabled, setGalleryEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const load = () => {
    getGallery()
      .then((d) => {
        setPhotos(d.photos ?? []);
        setConfigured(d.configured);
        setGalleryEnabled(d.gallery_enabled);
      })
      .catch(() => setPhotos([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const prev = useCallback(() => setLightboxIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length)), [photos.length]);
  const next = useCallback(() => setLightboxIndex((i) => (i === null ? null : (i + 1) % photos.length)), [photos.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, closeLightbox, prev, next]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <p className="text-[var(--accent)] font-bold">Loading the gallery…</p>
      </main>
    );
  }

  if (!galleryEnabled) {
    return (
      <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <p className="text-[var(--muted)]">The gallery is currently closed.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <div className="max-container mx-auto py-12 px-4">
        <h1 className="text-4xl font-black uppercase tracking-tight text-[var(--foreground)] mb-2">Gallery</h1>
        <p className="text-[var(--muted)] mb-10">A collection of first-chapter moments.</p>

        {!configured || photos.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[var(--muted)]">Memories are being made. Check back after the event.</p>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 [&>*]:mb-4">
            {photos.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setLightboxIndex(i)}
                className="block w-full rounded-xl overflow-hidden border border-white/[0.06] bg-[var(--surface)] text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                aria-label={`Open photo at Marker ${String(p.level ?? "?").padStart(2, "0")}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url ?? ""} alt={`Hidden Trail moment at Marker ${String(p.level ?? "?").padStart(2, "0")}`} className="w-full object-cover" loading="lazy" />
                <div className="p-3">
                  <p className="text-xs font-semibold text-[var(--foreground)]">{p.display_name}</p>
                  <p className="text-xs text-[var(--muted)]">Marker {String(p.level ?? "?").padStart(2, "0")}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          onClick={closeLightbox}
        >
          <button className="absolute top-4 right-4 text-white text-2xl px-3" onClick={closeLightbox} aria-label="Close">✕</button>
          <button className="absolute left-4 text-white text-3xl px-3" onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Previous">‹</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[lightboxIndex].url ?? ""} alt={`Hidden Trail moment at Marker ${String(photos[lightboxIndex].level ?? "?").padStart(2, "0")}`} className="max-h-[85vh] max-w-[90vw] object-contain" onClick={(e) => e.stopPropagation()} />
          <button className="absolute right-4 text-white text-3xl px-3" onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Next">›</button>
          <div className="absolute bottom-6 left-0 right-0 text-center text-white text-sm">
            {photos[lightboxIndex].display_name} — Marker {String(photos[lightboxIndex].level ?? "?").padStart(2, "0")}
          </div>
        </div>
      )}
    </main>
  );
}