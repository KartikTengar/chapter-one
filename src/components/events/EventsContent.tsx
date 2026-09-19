"use client";

import { useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { EventGrid } from "@/components/events/EventGrid";
import { EventSearch } from "@/components/events/EventSearch";
import { EventFilters } from "@/components/events/EventFilters";
import { EventSkeleton } from "@/components/events/EventSkeleton";
import type { Event } from "@/lib/supabase/dashboard";

interface EventsContentProps {
  events: Event[];
  categories: string[];
  registeredIds: Set<string>;
}

export function EventsContent({ events, categories, registeredIds }: EventsContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "ALL";

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesCategory = category === "ALL" || event.category === category;
      const matchesQuery = query === "" ||
        event.title.toLowerCase().includes(query.toLowerCase()) ||
        (event.description ?? "").toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [events, category, query]);

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

export function EventsLoading() {
  return (
    <div className="space-y-8">
      <EventSkeleton />
      <EventSkeleton />
      <EventSkeleton />
    </div>
  );
}