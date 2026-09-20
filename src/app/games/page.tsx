"use client";

import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getGames, type Game } from "@/lib/api/games";

function formatDate(date: string | null) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function statusBadgeClass(status: string) {
  const map: Record<string, string> = {
    LIVE: "badge-live",
    UPCOMING: "badge-upcoming",
    ENDED: "badge-ended",
    ARCHIVED: "badge-ended",
    PAUSED: "badge-ended",
  };
  return map[status] || "badge-live";
}

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGames().then(setGames).finally(() => setLoading(false));
  }, []);

  const running = games.filter((g) => g.status === "LIVE");
  const upcoming = games.filter((g) => g.status === "UPCOMING");
  const past = games.filter(
    (g) => ["ENDED", "ARCHIVED", "PAUSED"].includes(g.status)
  );

  if (loading) {
    return (
      <><Navbar /><main className="student-page">
        <div className="max-container py-12">
          <div className="text-center">
            <div className="inline-block animate-spin h-12 w-12 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full" aria-label="Loading" />
            <p className="mt-4 text-[var(--muted)]">Loading games...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="max-container py-12">
        <h1 className="text-4xl font-bold tracking-tighter text-[var(--accent)] mb-6">GAMES</h1>

        <section className="mb-12">
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              style={{
                padding: "var(--space-2) var(--space-3)",
                borderRadius: "var(--radius-btn)",
                fontVariant: "small-caps",
                fontSize: "var(--text-label)",
                fontWeight: "600",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                border: "1px solid var(--border)",
                background: "var(--transparent)",
                color: "var(--muted)",
                transition: "color var(--dur-fast) var(--ease), border-color var(--dur-fast) var(--ease), background var(--dur-fast) var(--ease)",
              }}
              onClick={() => {/* filter to running */}}
              role="button"
              aria-pressed="false"
            >
              RUNNING NOW
            </button>
            <button
              style={{ padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-btn)", fontVariant: "small-caps", fontSize: "var(--text-label)", fontWeight: "600", letterSpacing: "0.04em", textTransform: "uppercase", border: "1px solid var(--border)", background: "var(--transparent)", color: "var(--muted)", transition: "color var(--dur-fast) var(--ease), border-color var(--dur-fast) var(--ease), background var(--dur-fast) var(--ease)" }}
              onClick={() => {/* filter to upcoming */}}
              role="button"
              aria-pressed="false"
            >
              UPCOMING
            </button>
            <button
              style={{ padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-btn)", fontVariant: "small-caps", fontSize: "var(--text-label)", fontWeight: "600", letterSpacing: "0.04em", textTransform: "uppercase", border: "1px solid var(--border)", background: "var(--transparent)", color: "var(--muted)", transition: "color var(--dur-fast) var(--ease), border-color var(--dur-fast) var(--ease), background var(--dur-fast) var(--ease)" }}
              onClick={() => {/* filter to completed */}}
              role="button"
              aria-pressed="false"
            >
              COMPLETED
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {running.map((g) => (
              <GameCard key={g.id} game={g} cta="Play" isHiddenTrail={g.slug === "hidden-trail"} />
            ))}
            {running.length === 0 && (
              <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-8 text-[var(--muted)]">
                No games running now.
              </div>
            )}
          </div>
        </section>

        <section className="mb-12">
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              style={{
                padding: "var(--space-2) var(--space-3)",
                borderRadius: "var(--radius-btn)",
                fontVariant: "small-caps",
                fontSize: "var(--text-label)",
                fontWeight: "600",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                border: "1px solid var(--border)",
                background: "var(--transparent)",
                color: "var(--muted)",
                transition: "color var(--dur-fast) var(--ease), border-color var(--dur-fast) var(--ease), background var(--dur-fast) var(--ease)",
              }}
              onClick={() => {/* filter to upcoming */}}
              role="button"
              aria-pressed="false"
            >
              UPCOMING
            </button>
            <button
              style={{ padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-btn)", fontVariant: "small-caps", fontSize: "var(--text-label)", fontWeight: "600", letterSpacing: "0.04em", textTransform: "uppercase", border: "1px solid var(--border)", background: "var(--transparent)", color: "var(--muted)", transition: "color var(--dur-fast) var(--ease), border-color var(--dur-fast) var(--ease), background var(--dur-fast) var(--ease)" }}
              onClick={() => {/* filter to completed */}}
              role="button"
              aria-pressed="false"
            >
              COMPLETED
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcoming.map((g) => (
              <GameCard key={g.id} game={g} cta="View Details" isHiddenTrail={g.slug === "hidden-trail"} />
            ))}
            {upcoming.length === 0 && (
              <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-8 text-[var(--muted)]">
                Nothing upcoming.
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              style={{
                padding: "var(--space-2) var(--space-3)",
                borderRadius: "var(--radius-btn)",
                fontVariant: "small-caps",
                fontSize: "var(--text-label)",
                fontWeight: "600",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                border: "1px solid var(--border)",
                background: "var(--transparent)",
                color: "var(--muted)",
                transition: "color var(--dur-fast) var(--ease), border-color var(--dur-fast) var(--ease), background var(--dur-fast) var(--ease)",
              }}
              onClick={() => {/* filter to completed */}}
              role="button"
              aria-pressed="false"
            >
              COMPLETED
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {past.map((g) => (
              <GameCard key={g.id} game={g} cta="View Results" isHiddenTrail={g.slug === "hidden-trail"} />
            ))}
            {past.length === 0 && (
              <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-8 text-[var(--muted)]">
                No completed games yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </main><Footer /></>
  );
}

function GameCard({
  game,
  cta,
  isHiddenTrail,
}: {
  game: Game;
  cta: string;
  isHiddenTrail: boolean;
}) {
  const isHt = isHiddenTrail;

  return (
    <div
      style={{
        borderRadius: "var(--radius-card)",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        transition: "border-color var(--dur-normal) var(--ease), box-shadow var(--dur-normal) var(--ease)",
        ...(isHt && {
          border: "1px solid color-mix(in srgb, var(--accent) 20%, var(--transparent))",
        }),
      }}
    >
      <div style={{ position: "relative", overflow: "hidden" }}>
        {game.cover_url ? (
          <Image
            src={game.cover_url}
            alt={game.name}
            fill
            loading="lazy"
            style={{
              transition: "transform var(--dur-normal) var(--ease)",
              width: "100%",
              height: "180px",
              objectFit: "cover",
              objectPosition: "center",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "180px",
              borderRadius: "var(--radius-card)",
              background: isHt ? "var(--accent)" : "var(--surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--muted)",
              fontSize: "var(--text-meta)",
            }}
          >
            <span className="text-uppercase text-[var(--muted)] opacity-60">
              {isHt ? "TRAIL" : game.name.substring(0, 3)}
            </span>
          </div>
        )}
        <div
          style={{
            position: "absolute",
            top: "var(--space-3)",
            left: "var(--space-3)",
            padding: "var(--space-1) var(--space-2)",
            background: "var(--accent)",
            color: "var(--bg)",
            fontFamily: "var(--font-ui)",
            fontSize: "var(--text-meta)",
            fontWeight: "600",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            zIndex: 2,
          }}
        >
          {isHt ? "HIDDEN TRAIL" : game.status}
        </div>
      </div>
      <div
        style={{
          padding: "var(--space-5)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          minHeight: 0,
        }}
      >
        <h3
          style={{
            margin: "0 0 var(--space-3)",
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-h3)",
            fontWeight: "500",
            lineHeight: "1.3",
            letterSpacing: "-0.02em",
            color: "var(--text)",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          <Link
            href={`/games/${game.slug}`}
            style={{ color: "inherit", textDecoration: "none" }}
          >
            {game.name}
          </Link>
        </h3>
        <p
          style={{
            margin: 0,
            color: "var(--muted)",
            fontSize: "var(--text-label)",
            lineHeight: "1.6",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {game.description}
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "var(--space-3)",
            fontSize: "var(--text-meta)",
            color: "var(--muted)",
          }}
        >
          <span style={{ color: "var(--muted)" }}>
            {game.status}
          </span>
          <span style={{ color: "var(--muted)" }}>
            {formatDate(game.starts_at)} – {formatDate(game.ends_at)}
          </span>
        </div>
        <Link
          href={`/games/${game.slug}`}
          style={{
            marginTop: "var(--space-3)",
            padding: "var(--space-3) var(--space-5)",
            borderRadius: "var(--radius-btn)",
            fontFamily: "var(--font-ui)",
            fontSize: "var(--text-label)",
            fontWeight: "600",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            transition: "background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease)",
            ...(isHt && {
              background: "var(--accent)",
              color: "var(--bg)",
            }),
          }}
        >
          {cta}
        </Link>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ color: "var(--muted)", fontSize: "var(--text-meta)" }}>
      {message}
    </div>
  );
}