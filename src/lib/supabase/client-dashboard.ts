import { createClient } from "@/lib/supabase/client";

export async function registerForEvent(userId: string, eventId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("event_registrations")
    .insert({ user_id: userId, event_id: eventId })
    .select()
    .single();
  return { data, error };
}

export async function cancelRegistration(userId: string, eventId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("event_registrations")
    .delete()
    .eq("user_id", userId)
    .eq("event_id", eventId)
    .select()
    .single();
  return { data, error };
}

export async function getUserRegistrations(userId: string) {
  const supabase = createClient();
  const { data: registrations, error } = await supabase
    .from("event_registrations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(6);
  if (error) return [];
  return registrations ?? [];
}

export async function getStats(userId: string) {
  const supabase = createClient();
  const [{ count: eventsCount }, { count: regsCount }] = await Promise.all([
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .gte("event_date", new Date().toISOString()),
    supabase
      .from("event_registrations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);
  return {
    upcomingEvents: (eventsCount ?? 0) as number,
    registered: (regsCount ?? 0) as number,
    gamesPlayed: 0,
    points: 0,
  };
}

export async function getUserActivity(
  userId: string
): Promise<Array<{ id: string; event_id: string; created_at: string; event_title?: string }>> {
  const supabase = createClient();
  const { data: registrations, error } = await supabase
    .from("event_registrations")
    .select(`
      id,
      event_id,
      created_at,
      event:events(title)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) return [];
  return (registrations ?? []).map((r) => ({
    id: r.id,
    event_id: r.event_id,
    created_at: r.created_at,
    event_title: ((r.event as unknown as { title: string })?.title) ?? undefined,
  }));
}

export async function getEventsByIds(eventIds: string[]) {
  if (eventIds.length === 0) return [];
  const supabase = createClient();
  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .in("id", eventIds)
    .order("event_date", { ascending: true });
  if (error) return [];
  return events ?? [];
}