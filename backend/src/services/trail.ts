import type { SupabaseClient } from "@supabase/supabase-js";
import { HIDDEN_TRAIL_SLUG } from "./config.js";

export const HIDDEN_TRAIL_SLUG_NAME = HIDDEN_TRAIL_SLUG;

export type Supabase = SupabaseClient;

/** Safe public completion event payload — no user id, email, token, answer. */
export interface CompletionEvent {
  type: "completion";
  display_name: string;
  level: number;
  points: number;
  occurred_at: string;
  event_id: string;
}

/** Resolve the canonical Hidden Trail game by slug. Returns null if not configured. */
export async function resolveHiddenTrailGame(supabase: Supabase) {
  const { data, error } = await supabase
    .from("qr_games")
    .select("*")
    .eq("slug", HIDDEN_TRAIL_SLUG)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function getParticipant(supabase: Supabase, gameId: string, userId: string) {
  const { data, error } = await supabase
    .from("qr_participants")
    .select("*")
    .eq("game_id", gameId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function getProfile(supabase: Supabase, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, email, college_id")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function logScan(
  supabase: Supabase,
  gameId: string,
  userId: string,
  result: string,
  levelId?: string | null
) {
  const insert: Record<string, unknown> = { game_id: gameId, user_id: userId, result };
  if (levelId) insert.level_id = levelId;
  await supabase.from("qr_scan_logs").insert(insert);
}

/**
 * Publish a sanitized completion event to the public Realtime channel.
 * Best-effort: never throws — the database is the authority.
 */
export async function publishCompletion(supabase: Supabase, payload: CompletionEvent) {
  try {
    const channel = supabase.channel("hidden_trail");
    await channel.send({
      type: "broadcast",
      event: "hidden_trail.completion",
      payload,
    });
    await channel.unsubscribe();
  } catch {
    // Realtime publication failure must never roll back a committed completion.
  }
}