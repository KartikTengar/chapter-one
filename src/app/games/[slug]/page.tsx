"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getGame, type Game } from "@/lib/api/games";

function formatDate(date: string | null) {
  if (!date) return "TBA";
  return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

export default function GameDetailPage() {
  const params = useParams<{ slug: string }>();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGame(params.slug).then(setGame).finally(() => setLoading(false));
  }, [params.slug]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--background)]">
        <div className="max-container py-12 animate-pulse space-y-8">
          <div className="h-10 bg-[var(--surface)] rounded-xl w-1/3" />
          <div className="h-64 bg-[var(--surface)] rounded-2xl" />
        </div>
      </main>
    );
  }

  if (!game) {
    return (
      <main className="min-h-screen bg-[var(--background)]">
        <div className="max-container py-24 text-center">
          <h1 className="text-2xl font-black uppercase">Game Not Found</h1>
          <Link href="/games" className="inline-block mt-6 rounded-full px-5 py-3 bg-[var(--accent)] text-[var(--background)] font-bold">Back to Games</Link>
        </div>
      </main>
    );
  }

  const isHiddenTrail = game.slug === "hidden-trail";
  const ctaHref = isHiddenTrail ? "/hidden-trail" : `/games/${game.slug}`;
  const ctaLabel = game.status === "LIVE" ? "PLAY HIDDEN TRAIL" : game.status === "UPCOMING" ? "View Details" : "View Results";

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="max-container py-12">
        <Link href="/games" className="text-sm text-zinc-400 hover:text-[var(--foreground)]">← Games</Link>
        <div className="mt-6 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="h-72 bg-[var(--surface)] rounded-2xl mb-6 flex items-center justify-center">
              {game.cover_url ? <img src={game.cover_url} alt={game.name} className="h-full w-full object-cover rounded-2xl" /> : <span className="text-zinc-600 uppercase">Cover</span>}
            </div>
            <h1 className="text-3xl font-black uppercase text-[var(--foreground)]">{game.name}</h1>
            <p className="text-zinc-400 mt-3">{game.description}</p>
            <div className="mt-4 text-sm text-zinc-500">
              Status: <span className="text-[var(--foreground)]">{game.status}</span> · {formatDate(game.starts_at)} – {formatDate(game.ends_at)}
            </div>
            <div className="mt-6">
              <Link href={ctaHref} className="rounded-full px-6 py-3 bg-[var(--accent)] text-[var(--background)] font-bold">
                {isHiddenTrail ? "PLAY HIDDEN TRAIL" : ctaLabel}
              </Link>
            </div>
          </div>
          <div className="bg-[var(--surface)] border border-white/[0.06] rounded-2xl p-6 h-fit">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">Game Info</h2>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-zinc-500">Status</dt><dd className="text-[var(--foreground)] font-medium">{game.status}</dd></div>
              <div><dt className="text-zinc-500">Starts</dt><dd className="text-[var(--foreground)]">{formatDate(game.starts_at)}</dd></div>
              <div><dt className="text-zinc-500">Ends</dt><dd className="text-[var(--foreground)]">{formatDate(game.ends_at)}</dd></div>
              <div><dt className="text-zinc-500">Master Points</dt><dd className="text-[var(--foreground)]">{game.master_enabled ? "Enabled" : "Not enabled"}</dd></div>
            </dl>
          </div>
        </div>
      </div>
    </main>
  );
}
