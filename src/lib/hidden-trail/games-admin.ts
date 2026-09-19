import { createServerClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface GameInstance {
  id: string;
  name: string;
  description: string | null;
  status: string;
  slug: string;
  game_type: string;
  is_current: boolean;
  start_at: string | null;
  end_at: string | null;
  archived_at: string | null;
  readiness: Record<string, unknown> | null;
  readiness_checked_at: string | null;
  clone_of_game_id: string | null;
  score_start_level: number;
  starting_score: number;
  score_floor: number;
  final_secret_enabled: boolean;
  final_secret_hash: string | null;
  final_message: string | null;
  leaderboard_public: boolean;
  leaderboard_name_mode: string;
  photo_feature_enabled: boolean;
  gallery_enabled: boolean;
  live_display_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface GameListEntry extends GameInstance {
  level_count?: number;
  participant_count?: number;
  completion_count?: number;
}

export async function requireAdmin() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? user : null;
}

export async function listGames(): Promise<GameListEntry[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.from("qr_games").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to list games: ${error.message}`);
  return (data ?? []) as GameListEntry[];
}

export async function getGame(id: string): Promise<GameInstance | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.from("qr_games").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Failed to get game: ${error.message}`);
  return data as GameInstance | null;
}

export async function createGame(body: {
  name: string;
  slug: string;
  description?: string;
  level_count?: number;
  starting_score?: number;
  score_floor?: number;
  score_start_level?: number;
  leaderboard_name_mode?: string;
  leaderboard_public?: boolean;
}): Promise<GameInstance> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("create_hidden_trail_game", {
    p_name: body.name,
    p_slug: body.slug,
    p_description: body.description ?? null,
    p_level_count: body.level_count ?? 10,
    p_starting_score: body.starting_score ?? 100,
    p_score_floor: body.score_floor ?? 30,
    p_score_start_level: body.score_start_level ?? 2,
    p_leaderboard_name_mode: body.leaderboard_name_mode ?? "FIRST_NAME",
    p_leaderboard_public: body.leaderboard_public ?? true,
  });
  if (error) throw new Error(`Failed to create game: ${error.message}`);
  const gameId = data as string;
  const { data: game, error: gErr } = await supabase.from("qr_games").select("*").eq("id", gameId).maybeSingle();
  if (gErr) throw new Error(`Failed to fetch created game: ${gErr.message}`);
  return game as GameInstance;
}

export async function updateGame(id: string, updates: Record<string, unknown>): Promise<GameInstance> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("Forbidden");
  const { data, error } = await supabase.from("qr_games").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id).select().maybeSingle();
  if (error) throw new Error(`Failed to update game: ${error.message}`);
  return data as GameInstance;
}

export async function duplicateGame(sourceId: string, name: string, slug: string): Promise<GameInstance> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("duplicate_hidden_trail_game", { p_source_game_id: sourceId, p_name: name, p_slug: slug });
  if (error) throw new Error(`Failed to duplicate game: ${error.message}`);
  const newId = data as string;
  const { data: game, error: gErr } = await supabase.from("qr_games").select("*").eq("id", newId).maybeSingle();
  if (gErr) throw new Error(`Failed to fetch duplicated game: ${gErr.message}`);
  return game as GameInstance;
}

export async function runReadiness(id: string): Promise<{ passed: boolean; checks: unknown[]; level_count: number }> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("readiness_hidden_trail_game", { p_game_id: id });
  if (error) throw new Error(`Readiness check failed: ${error.message}`);
  return data as { passed: boolean; checks: unknown[]; level_count: number };
}

async function assertAdmin(supabase: SupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("Forbidden");
}

export async function setReady(id: string): Promise<GameInstance> {
  const supabase = await createServerClient();
  await assertAdmin(supabase);
  const { data, error } = await supabase.from("qr_games").update({ status: "ready", readiness_passed: true, ready_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id).select().maybeSingle();
  if (error) throw new Error(`Failed to mark game ready: ${error.message}`);
  return data as GameInstance;
}

export async function startGame(id: string): Promise<GameInstance> {
  const supabase = await createServerClient();
  await assertAdmin(supabase);
  const { data, error } = await supabase.from("qr_games").update({ status: "running", started_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id).select().maybeSingle();
  if (error) throw new Error(`Failed to start game: ${error.message}`);
  return data as GameInstance;
}

export async function pauseGame(id: string): Promise<GameInstance> {
  const supabase = await createServerClient();
  await assertAdmin(supabase);
  const { data, error } = await supabase.from("qr_games").update({ status: "paused", paused_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id).select().maybeSingle();
  if (error) throw new Error(`Failed to pause game: ${error.message}`);
  return data as GameInstance;
}

export async function resumeGame(id: string): Promise<GameInstance> {
  const supabase = await createServerClient();
  await assertAdmin(supabase);
  const { data, error } = await supabase.from("qr_games").update({ status: "running", paused_at: null, updated_at: new Date().toISOString() }).eq("id", id).select().maybeSingle();
  if (error) throw new Error(`Failed to resume game: ${error.message}`);
  return data as GameInstance;
}

export async function endGame(id: string): Promise<GameInstance> {
  const supabase = await createServerClient();
  await assertAdmin(supabase);
  const { data, error } = await supabase.from("qr_games").update({ status: "ended", ended_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id).select().maybeSingle();
  if (error) throw new Error(`Failed to end game: ${error.message}`);
  return data as GameInstance;
}

export async function archiveGame(id: string): Promise<GameInstance> {
  const supabase = await createServerClient();
  await assertAdmin(supabase);
  const { data, error } = await supabase.from("qr_games").update({ status: "archived", archived_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id).select().maybeSingle();
  if (error) throw new Error(`Failed to archive game: ${error.message}`);
  return data as GameInstance;
}

export async function setCurrent(id: string): Promise<GameInstance> {
  const supabase = await createServerClient();
  await assertAdmin(supabase);
  const { data: game } = await supabase.from("qr_games").select("game_type").eq("id", id).maybeSingle();
  if (!game) throw new Error("Game not found");
  const gameType = (game as { game_type: string }).game_type ?? "hidden-trail";
  await supabase.from("qr_games").update({ is_current: false }).eq("game_type", gameType).neq("id", id);
  const { data, error } = await supabase.from("qr_games").update({ is_current: true, updated_at: new Date().toISOString() }).eq("id", id).select().maybeSingle();
  if (error) throw new Error(`Failed to set current game: ${error.message}`);
  return data as GameInstance;
}

export async function deleteGame(id: string): Promise<{ game_id: string; name: string; storage_cleaned: boolean }> {
  const supabase = await createServerClient();
  await assertAdmin(supabase);
  const { data, error } = await supabase.rpc("delete_hidden_trail_game", { p_game_id: id });
  if (error) throw new Error(`Failed to delete game: ${error.message}`);
  const result = data as { game_id: string; name: string; storage_paths: string[] };
  const storagePaths = (result.storage_paths as string[]) ?? [];
  let storageOk = true;
  for (const path of storagePaths) {
    try {
      const { error: sErr } = await supabase.storage.from("hidden-trail-photos").remove([path]);
      if (sErr) storageOk = false;
    } catch { storageOk = false; }
  }
  return { game_id: result.game_id, name: result.name, storage_cleaned: storageOk };
}
