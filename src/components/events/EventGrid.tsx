"use client";

import { EventCard } from "./EventCard";
import type { Event } from "@/lib/supabase/dashboard";

interface EventGridProps {
  events: Event[];
  registeredIds: Set<string>;
}

export function EventGrid({ events, registeredIds }: EventGridProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--surface)] border border-white/[0.06] flex items-center justify-center mb-4">
          <svg className="h-8 w-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">No events found</h3>
        <p className="text-sm text-zinc-500">Try a different search or filter.</p>
      </div>
    );
  }

return (
     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
       {events.map((event) => (
         <EventCard
           key={event.id}
           event={event}
           registered={registeredIds.has(event.id)}
         />
       ))}
     </div>
   );
}