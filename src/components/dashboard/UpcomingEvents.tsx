"use client";

import { Calendar } from "lucide-react";
import Link from "next/link";
import { EventCard } from "./EventCard";
import type { Event } from "@/lib/supabase/dashboard";

interface UpcomingEventsProps {
  events: Event[];
  registeredIds: Set<string>;
}

export function UpcomingEvents({ events, registeredIds }: UpcomingEventsProps) {
  if (events.length === 0) {
    return (
      <section className="mb-8">
        <h2 className="text-xl font-black text-[var(--foreground)] uppercase tracking-tight mb-4">
          UPCOMING EVENTS
        </h2>
        <div className="bg-[var(--surface)] border border-white/[0.06] rounded-2xl p-12 text-center">
          <Calendar className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">
            NO EVENTS YET
          </h3>
          <p className="text-zinc-500 text-sm">
            Your first chapter is still being written.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <h2 className="text-xl font-black text-[var(--foreground)] uppercase tracking-tight mb-4">
        UPCOMING EVENTS
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            registered={registeredIds.has(event.id)}
          />
        ))}
      </div>
    </section>
  );
}

interface MyEventsProps {
  events: Event[];
}

export function MyEvents({ events }: MyEventsProps) {
  if (events.length === 0) {
    return (
      <section className="mb-8">
        <h2 className="text-xl font-black text-[var(--foreground)] uppercase tracking-tight mb-4">
          MY UPCOMING
        </h2>
        <div className="bg-[var(--surface)] border border-white/[0.06] rounded-2xl p-12 text-center">
          <Calendar className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">
            YOU HAVEN&apos;T JOINED ANYTHING YET
          </h3>
<Link
             href="/events"
             className="inline-block mt-2 rounded-full px-6 py-3 bg-[var(--accent)] text-[var(--background)] font-bold text-sm hover:bg-opacity-90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
           >
             EXPLORE EVENTS
           </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <h2 className="text-xl font-black text-[var(--foreground)] uppercase tracking-tight mb-4">
        MY UPCOMING
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {events.map((event) => (
          <EventCard key={event.id} event={event} registered />
        ))}
      </div>
    </section>
  );
}