"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getTrailReplay, type ReplayTimelineEvent } from "@/lib/api/trail";
import { HiddenTrailShell } from "@/components/hidden-trail/HiddenTrailShell";

function formatTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function TrailReplayPage() {
  const [timeline, setTimeline] = useState<ReplayTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrailReplay()
      .then((d) => setTimeline(d.timeline ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <HiddenTrailShell>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-[var(--accent)] font-bold">Replaying your journey…</p>
        </div>
      </HiddenTrailShell>
    );
  }

  return (
    <HiddenTrailShell>
      <div className="max-container mx-auto py-10 px-4">
        <h1 className="text-3xl font-black uppercase tracking-tight text-[var(--foreground)] mb-8">Your Journey</h1>

        {timeline.length === 0 ? (
          <p className="text-[var(--muted)]">No journey yet. Enter the trail to begin.</p>
        ) : (
          <ol className="relative border-l border-white/[0.08] ml-3 space-y-8">
            {timeline.map((event, index) => (
              <li key={index} className="ml-6">
                <span className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full bg-[var(--accent)]" aria-hidden="true" />
                <div className="flex items-baseline gap-3">
                  <span className="text-xs uppercase tracking-wider text-[var(--muted)]">{formatTime(event.occurred_at)}</span>
                  {event.type === "marker" ? (
                    <>
                      <span className="font-bold text-[var(--foreground)]">
                        Marker {String(event.level ?? "?").padStart(2, "0")}
                      </span>
                      {typeof event.points === "number" && (
                        <span className="text-[var(--accent)] font-bold">+{event.points}</span>
                      )}
                    </>
                  ) : (
                    <span className="font-bold text-[var(--foreground)]">{event.label ?? "Event"}</span>
                  )}
                </div>
                {event.photo_id && (
                  <Link href="/hidden-trail/album" className="text-xs text-[var(--accent)] mt-1 inline-block">View photo →</Link>
                )}
              </li>
            ))}
          </ol>
        )}

        <div className="mt-10 text-center">
          <Link href="/hidden-trail/stats" className="text-sm text-[var(--accent)]">← Your Stats</Link>
        </div>
      </div>
    </HiddenTrailShell>
  );
}