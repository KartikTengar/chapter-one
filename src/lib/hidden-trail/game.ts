import { createClient as createSupabaseClient } from "@/lib/supabase/client";

function getSupabase() {
  return createSupabaseClient();
}

export const createClient = getSupabase;

export interface GameConfig {
  id: string;
  name: string;
  description: string | null;
  status: "draft" | "ready" | "running" | "paused" | "ended" | "archived";
  start_at: string | null;
  end_at: string | null;
  score_start_level: number;
  starting_score: number;
  score_floor: number;
  final_secret_enabled: boolean;
  final_secret_hash: string | null;
  final_message: string | null;
  leaderboard_public: boolean;
  leaderboard_name_mode: "FIRST_NAME" | "FULL_NAME" | "ANONYMOUS";
  created_at: string;
  updated_at: string;
  is_current?: boolean;
}

export interface GameLevel {
  id: string;
  game_id: string;
  level_number: number;
  title: string;
  location_riddle: string;
  answer_riddle: string;
  answer_hash: string;
  case_sensitive: boolean;
  admin_location: string | null;
  is_active: boolean;
  token: string;
  created_at: string;
  updated_at: string;
}

export interface LevelWithRelations extends GameLevel {
  qr_levels?: GameLevel;
}

export interface LevelStat extends GameLevel {
  successfulCompletions: number;
  currentValue: number;
}

export interface LeaderboardEntry {
  user_id: string;
  total_points: number;
  current_level: number;
  status: string;
  completed_at: string | null;
  profiles: {
    full_name: string | null;
    email: string | null;
  } | null;
}

export interface CompletionWithLevel {
  id: string;
  game_id: string;
  user_id: string;
  participant_id: string;
  level_id: string;
  points_awarded: number;
  completed_at: string;
  scanned_at: string;
  scanner_position: number;
  level: GameLevel;
}

export interface ParticipantStatus {
  id: string;
  game_id: string;
  user_id: string;
  current_level: number;
  total_points: number;
  status: "not_started" | "active" | "completed" | "paused";
  started_at: string | null;
  last_scan_at: string | null;
  completed_at: string | null;
}

export interface ScanLogWithRelations {
  id: string;
  game_id: string;
  user_id: string;
  participant_id: string;
  level_id: string;
  scanner_position: number;
  result: string;
  points_awarded: number;
  scanned_at: string;
  created_at: string;
  qr_levels: GameLevel;
  profiles: {
    full_name: string | null;
    email: string | null;
  };
}

export interface ScanResult {
  game_id: string;
  level_id: string;
  level_number: number;
  is_valid: boolean;
  is_expected_level: boolean;
  is_duplicate: boolean;
  is_completed: boolean;
  game_status: string;
  current_level: number;
  total_points: number;
  location_riddle: string;
  answer_riddle: string;
  case_sensitive: boolean;
  error_message: string | null;
}

export interface ValidationResult {
  game_id: string;
  level_id: string;
  level_number: number;
  is_valid: boolean;
  is_expected_level: boolean;
  is_duplicate: boolean;
  is_completed: boolean;
  game_status: string;
  current_level: number;
  total_points: number;
  location_riddle: string;
  answer_riddle: string;
  case_sensitive: boolean;
  error_message: string | null;
}

export async function requireUser() {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getGameConfig(): Promise<GameConfig | null> {
  const supabase = getSupabase();
  const { data: game, error } = await supabase
    .from("qr_games")
    .select("*")
    .eq("is_current", true)
    .maybeSingle();
  if (error || !game) return null;
  return game as GameConfig;
}

export async function getGameLevels(gameId: string): Promise<GameLevel[]> {
  const supabase = getSupabase();
  const { data: levels, error } = await supabase
    .from("qr_levels")
    .select("*")
    .eq("game_id", gameId)
    .eq("is_active", true)
    .order("level_number", { ascending: true });
  if (error) return [];
  return levels as GameLevel[];
}

export async function getLeaderboard(gameId: string, limit: number = 10) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("qr_participants")
    .select(`
      user_id,
      total_points,
      current_level,
      status,
      completed_at,
      profiles:profiles!inner(full_name, email)
    `)
    .eq("game_id", gameId)
    .order("total_points", { ascending: false })
    .order("completed_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get leaderboard: ${error.message}`);
  }

  return (data as Array<{
    user_id: string;
    total_points: number;
    current_level: number;
    status: string;
    completed_at: string | null;
    profiles: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[];
  }>).map(item => ({
    user_id: item.user_id,
    total_points: item.total_points,
    current_level: item.current_level,
    status: item.status,
    completed_at: item.completed_at,
    profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
  }));
}

export async function getParticipantStatus(gameId: string, userId: string): Promise<ParticipantStatus> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("qr_participants")
    .select("*")
    .eq("game_id", gameId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return {
      id: "",
      game_id: gameId,
      user_id: userId,
      current_level: 0,
      total_points: 0,
      status: "not_started",
      started_at: null,
      last_scan_at: null,
      completed_at: null
    };
  }

  if (!data) {
    return {
      id: "",
      game_id: gameId,
      user_id: userId,
      current_level: 0,
      total_points: 0,
      status: "not_started",
      started_at: null,
      last_scan_at: null,
      completed_at: null
    };
  }

  return data as ParticipantStatus;
}

export async function getParticipantCompletions(gameId: string, userId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("qr_completions")
    .select("*, qr_levels(*)")
    .eq("game_id", gameId)
    .eq("user_id", userId)
    .order("scanned_at");

  if (error) {
    throw new Error(`Failed to get participant completions: ${error.message}`);
  }

  return data;
}

export async function validateQrToken(token: string, userId: string): Promise<ScanResult | null> {
  const { trailScan } = await import("@/lib/api/trail");
  try {
    const result = await trailScan(token);
    if (!result) return null;
    return {
      game_id: result.game_id ?? "",
      level_id: result.level_id ?? "",
      level_number: result.level_number ?? 0,
      is_valid: result.is_valid,
      is_expected_level: result.is_expected_level,
      is_duplicate: result.is_duplicate,
      is_completed: false,
      game_status: result.game_status,
      current_level: result.current_level,
      total_points: result.total_points,
      location_riddle: result.location_riddle ?? "",
      answer_riddle: result.answer_riddle ?? "",
      case_sensitive: result.case_sensitive,
      error_message: result.error_message,
    } as ScanResult;
  } catch (err) {
    const e = err as { code?: string; message?: string };
    if (e?.code) {
      throw new Error(e.message ?? "Failed to verify marker");
    }
    throw new Error("Failed to verify marker");
  }
}

export async function processQrAnswer(token: string, userId: string, answer: string): Promise<ScanResult | null> {
  const { trailAnswer } = await import("@/lib/api/trail");
  try {
    const result = await trailAnswer(token, answer);
    if (!result) return null;
    return {
      game_id: result.game_id,
      level_id: result.level_id,
      level_number: result.level_number,
      is_valid: true,
      is_expected_level: true,
      is_duplicate: false,
      is_completed: result.is_completed,
      game_status: result.status,
      current_level: result.current_level,
      total_points: result.total_points,
      location_riddle: result.location_riddle ?? "",
      answer_riddle: result.answer_riddle ?? "",
      case_sensitive: false,
      error_message: null,
    } as ScanResult;
  } catch (err) {
    const e = err as { code?: string; message?: string };
    throw new Error(e?.message ?? "Failed to process answer");
  }
}
