"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { EventGrid } from "@/components/events/EventGrid";
import { EventSearch } from "@/components/events/EventSearch";
import { EventFilters } from "@/components/events/EventFilters";
import { EventSkeleton } from "@/components/events/EventSkeleton";
import { getAllEvents, getEventCategories, getRegisteredEventIds } from "@/lib/supabase/dashboard";
import { getServerSession } from "@/lib/supabase/auth";
import type { Event } from "@/lib/supabase/dashboard";

function EventsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "ALL";

  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [allEvents, allCategories, session] = await Promise.all([
          getAllEvents(),
          getEventCategories(),
          getServerSession(),
        ]);
        const ids = session ? new Set(await getRegisteredEventIds(session.user.id)) : new Set<string>();
        setEvents(allEvents);
        setCategories(allCategories);
        setRegisteredIds(ids);
      } catch {
        // Error handled
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesCategory = category === "ALL" || event.category === category;
      const matchesQuery = query === "" || 
        event.title.toLowerCase().includes(query.toLowerCase()) ||
        (event.description ?? "").toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [events, category, query]);

  if (loading) {
    return (
      <div className="space-y-8">
        <EventSkeleton />
        <EventSkeleton />
        <EventSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <EventSearch query={query} onQueryChange={(v) => {
        const params = new URLSearchParams(searchParams);
        if (v) params.set("q", v);
        else params.delete("q");
        router.push(`?${params.toString()}`);
      }} />
      <EventFilters categories={categories} selectedCategory={category} onCategoryChange={(v) => {
        const params = new URLSearchParams(searchParams);
        if (v !== "ALL") params.set("category", v);
        else params.delete("category");
        router.push(`?${params.toString()}`);
      }} />
      <EventGrid events={filteredEvents} registeredIds={registeredIds} />
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<div className="space-y-8"><EventSkeleton /><EventSkeleton /><EventSkeleton /></div>}>
      <EventsContent />
    </Suspense>
  );
}
