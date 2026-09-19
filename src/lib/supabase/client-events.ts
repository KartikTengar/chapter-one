import { createClient } from "@/lib/supabase/client";

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
  const supabase = createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .gte("event_date", new Date().toISOString())
    .order("event_date", { ascending: true });
  if (error) return [];
  return data ?? [];
}

export async function getRegisteredEventIds(userId: string): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("event_registrations")
    .select("event_id")
    .eq("user_id", userId);
  if (error) return [];
  return (data ?? []).map(r => r.event_id);
}

export async function getProfile(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, email, phone, year, branch, college_id, avatar_url")
    .eq("id", userId)
    .single();
  if (error) return null;
  return data;
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
  const filled = fields.filter(f => f && f.length > 0).length;
  return Math.round((filled / fields.length) * 100);
}
