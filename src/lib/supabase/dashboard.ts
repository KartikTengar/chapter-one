import "server-only";
import { createServerClient } from "@/lib/supabase/server";

export interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string;
  category: string;
  image_url: string | null;
  max_participants: number | null;
  created_at: string;
}

export async function getUpcomingEvents(): Promise<Event[]> {
  const supabase = await createServerClient();
  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .gte("event_date", new Date().toISOString())
    .order("event_date", { ascending: true });
  if (error) return [];
  return events ?? [];
}

export async function getAllEvents(): Promise<Event[]> {
  const supabase = await createServerClient();
  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: true });
  if (error) return [];
  return events ?? [];
}

export async function getPastEvents(): Promise<Event[]> {
  const supabase = await createServerClient();
  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .lt("event_date", new Date().toISOString())
    .order("event_date", { ascending: false });
  if (error) return [];
  return events ?? [];
}

export async function getEventCategories(): Promise<string[]> {
  const supabase = await createServerClient();
  const { data: events, error } = await supabase
    .from("events")
    .select("category")
    .neq("category", null)
    .order("category", { ascending: true });
  if (error) return [];
  const categories = new Set((events ?? []).map((e) => e.category).filter(Boolean));
  return Array.from(categories);
}

export async function searchEvents(query: string): Promise<Event[]> {
  if (!query.trim()) return [];
  const supabase = await createServerClient();
  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .gte("event_date", new Date().toISOString())
    .or(`title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%,location.ilike.%${query}%`)
    .order("event_date", { ascending: true });
  if (error) return [];
  return events ?? [];
}

export async function getEventCapacity(eventId: string) {
  const supabase = await createServerClient();
  const [{ count: regCount }, { data: event }] = await Promise.all([
    supabase
      .from("event_registrations")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId),
    supabase.from("events").select("max_participants").eq("id", eventId).single(),
  ]);
  return {
    registered: (regCount ?? 0) as number,
    max: (event as { max_participants: number | null })?.max_participants ?? null,
  };
}

export async function getRegisteredEventIds(userId: string) {
  const supabase = await createServerClient();
  const { data: registrations, error } = await supabase
    .from("event_registrations")
    .select("event_id")
    .eq("user_id", userId);
  if (error) return [];
  return (registrations ?? []).map((r) => r.event_id);
}

export async function getEventById(eventId: string) {
  const supabase = await createServerClient();
  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();
  if (error) return null;
  return event;
}

export async function checkRegistration(userId: string, eventId: string) {
  const supabase = await createServerClient();
  const { data: reg, error } = await supabase
    .from("event_registrations")
    .select("id")
    .eq("user_id", userId)
    .eq("event_id", eventId)
    .single();
  if (error) return false;
  return !!reg;
}

export async function getProfile(userId: string) {
  const supabase = await createServerClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, email, phone, year, branch, college_id, avatar_url")
    .eq("id", userId)
    .single();
  if (error) return null;
  return profile;
}

export function getProfileCompletion(profile: {
  full_name?: string;
  phone?: string;
  college_id?: string;
  year?: string;
  branch?: string;
  avatar_url?: string | null;
}) {
  const fields = [
    profile.full_name,
    profile.phone,
    profile.college_id,
    profile.year,
    profile.branch,
    profile.avatar_url,
  ];
  const filled = fields.filter((f) => f && f.length > 0).length;
  return Math.round((filled / fields.length) * 100);
}