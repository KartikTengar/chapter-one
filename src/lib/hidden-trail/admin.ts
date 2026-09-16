import { createServerClient } from "@/lib/supabase/server";
import type { 
  GameConfig, 
  GameLevel, 
  ScanLogWithRelations, 
  LeaderboardEntry,
  ParticipantStatus,
  CompletionWithLevel
} from "@/lib/hidden-trail/game";

/**
 * Server-side admin functions - these run on the server with SECURITY DEFINER privileges
 * and should never be exposed to the browser client.
 */

/**
 * Verify admin role server-side
 */
export async function verifyAdmin(): Promise<boolean> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "admin";
}

/**
 * Re-export types for admin API routes
 */
export type { 
  GameConfig, 
  GameLevel, 
  ScanLogWithRelations, 
  LeaderboardEntry,
  ParticipantStatus,
  CompletionWithLevel
};

/**
 * Get admin user with profile
 */
export async function getAdminUser() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return null;
  }

  return {
    id: profile.id,
    email: profile.email,
    role: profile.role,
  };
}

/**
 * Get game config with admin details
 */
export async function getGameConfigAdmin(gameId: string = "00000000-0000-0000-0000-000000000001") {
  const supabase = await createServerClient();

  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }

  const { data, error } = await supabase
    .from("qr_games")
    .select("*")
    .eq("id", gameId)
    .single();

  if (error) {
    throw new Error(`Failed to get game config: ${error.message}`);
  }

  return data;
}

/**
 * Get all levels with full details (including admin location)
 */
export async function getGameLevelsAdmin(gameId: string = "00000000-0000-0000-0000-000000000001") {
  const supabase = await createServerClient();

  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }

  const { data, error } = await supabase
    .from("qr_levels")
    .select("*")
    .eq("game_id", gameId)
    .order("level_number");

  if (error) {
    throw new Error(`Failed to get game levels: ${error.message}`);
  }

  return data;
}

/**
 * Update game configuration
 */
export async function updateGameConfigAdmin(
  updates: Partial<{
    name: string;
    description: string;
    status: string;
    start_at: string | null;
    end_at: string | null;
    score_start_level: number;
    starting_score: number;
    score_floor: number;
    final_secret_enabled: boolean;
    final_message: string | null;
    leaderboard_public: boolean;
    leaderboard_name_mode: 'FULL_NAME' | 'FIRST_NAME' | 'INITIALS' | 'PARTICIPANT_NUMBER' | 'ANONYMOUS';
  }>
) {
  const supabase = await createServerClient();

  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }

  const gameId = "00000000-0000-0000-0000-000000000001";

  const { data, error } = await supabase
    .from("qr_games")
    .update(updates)
    .eq("id", gameId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update game config: ${error.message}`);
  }

  return data;
}

/**
 * Get leaderboard with admin details
 */
export async function getLeaderboardAdmin(gameId: string = "00000000-0000-0000-0000-000000000001", limit: number = 50) {
  const supabase = await createServerClient();

  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }

  const { data, error } = await supabase
    .from("qr_participants")
    .select(`
      user_id,
      total_points,
      current_level,
      status,
      completed_at,
      profiles(full_name, email)
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
    ...item,
    profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
  }));
}

/**
 * Get scan logs for admin
 */
export async function getScanLogsAdmin(gameId: string, limit: number = 100) {
  const supabase = await createServerClient();

  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }

  const { data, error } = await supabase
    .from("qr_scan_logs")
    .select(`
      *,
      qr_levels(level_number, title),
      profiles(full_name, email)
    `)
    .eq("game_id", gameId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get scan logs: ${error.message}`);
  }

  return data;
}

/**
 * Get participant status for admin
 */
export async function getParticipantStatusAdmin(gameId: string, userId: string) {
  const supabase = await createServerClient();

  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }

  const { data, error } = await supabase
    .from("qr_participants")
    .select("*")
    .eq("game_id", gameId)
    .eq("user_id", userId)
    .single();

  if (error) {
    // Return default not started status if no record found
    return {
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

  return data;
}

/**
 * Get participant completions for admin
 */
export async function getParticipantCompletionsAdmin(gameId: string, userId: string) {
  const supabase = await createServerClient();

  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }

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

/**
 * Regenerate QR token for a level
 */
export async function regenerateQrToken(gameId: string, levelId: string) {
  const supabase = await createServerClient();

  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }

  // Generate new cryptographically random token
  const newToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');

  const { data, error } = await supabase
    .from("qr_levels")
    .update({ token: newToken, updated_at: new Date().toISOString() })
    .eq("id", levelId)
    .eq("game_id", gameId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to regenerate token: ${error.message}`);
  }

  // Log admin action
  await logAdminAction("qr_token_regenerated", "qr_level", levelId, { game_id: gameId });

  return data;
}

/**
 * Toggle level active status
 */
export async function toggleLevelActive(gameId: string, levelId: string, isActive: boolean) {
  const supabase = await createServerClient();

  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }

  const { data, error } = await supabase
    .from("qr_levels")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", levelId)
    .eq("game_id", gameId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to toggle level: ${error.message}`);
  }

  await logAdminAction(isActive ? "qr_level_activated" : "qr_level_deactivated", "qr_level", levelId, { game_id: gameId });

  return data;
}

/**
 * Update game status
 */
export async function updateGameStatus(status: "draft" | "active" | "paused" | "ended") {
  const supabase = await createServerClient();

  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }

  const gameId = "00000000-0000-0000-0000-000000000001";

  const { data, error } = await supabase
    .from("qr_games")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", gameId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update game status: ${error.message}`);
  }

  await logAdminAction(`game_status_${status}`, "qr_game", gameId, { status });

  return data;
}

/**
 * Log admin action
 */
async function logAdminAction(action: string, entityType: string, entityId: string, details: Record<string, unknown>) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase
      .from("qr_admin_audit")
      .insert({
        admin_user_id: user.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details,
      });
  }
}

/**
 * Get admin audit logs
 */
export async function getAdminAuditLogs(limit: number = 50) {
  const supabase = await createServerClient();

  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }

  const { data, error } = await supabase
    .from("qr_admin_audit")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get audit logs: ${error.message}`);
  }

  return data;
}

/**
 * Get all participants for admin with pagination, search, filter, and sort
 */
export async function getParticipantsAdmin(
  gameId: string = "00000000-0000-0000-0000-000000000001",
  options: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: "not_started" | "active" | "completed" | "paused" | "all";
    level?: number | "all";
    sortBy?: "total_points" | "current_level" | "started_at" | "completed_at";
    sortOrder?: "asc" | "desc";
  } = {}
) {
  const supabase = await createServerClient();

  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }

  const {
    page = 1,
    pageSize = 25,
    search = "",
    status = "all",
    level = "all",
    sortBy = "total_points",
    sortOrder = "desc",
  } = options;

  // Validate page and pageSize
  const validPage = Math.max(1, page);
  const validPageSize = Math.min(Math.max(1, pageSize), 100);
  const from = (validPage - 1) * validPageSize;
  const to = from + validPageSize - 1;

  // Build the query
  let query = supabase
    .from("qr_participants")
    .select(`
      game_id,
      user_id,
      current_level,
      total_points,
      status,
      started_at,
      last_scan_at,
      completed_at,
      profiles!inner(full_name, email)
    `, { count: "exact" })
    .eq("game_id", gameId)
    .range(from, to);

  // Apply search filter (search in full_name or email)
  if (search.trim()) {
    query = query.or(`profiles.full_name.ilike.%${search}%,profiles.email.ilike.%${search}%`);
  }

  // Apply status filter
  if (status !== "all") {
    query = query.eq("status", status);
  }

  // Apply level filter
  if (level !== "all") {
    query = query.eq("current_level", level);
  }

  // Apply sorting
  const validSortColumns = ["total_points", "current_level", "started_at", "completed_at"];
  const sortColumn = validSortColumns.includes(sortBy) ? sortBy : "total_points";
  query = query.order(sortColumn, { ascending: sortOrder === "asc" });

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to get participants: ${error.message}`);
  }

  // Transform data to include profile info at top level
  const participants = (data as Array<{
    game_id: string;
    user_id: string;
    current_level: number;
    total_points: number;
    status: string;
    started_at: string | null;
    last_scan_at: string | null;
    completed_at: string | null;
    profiles: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[];
  }>).map(item => ({
    game_id: item.game_id,
    user_id: item.user_id,
    current_level: item.current_level,
    total_points: item.total_points,
    status: item.status,
    started_at: item.started_at,
    last_scan_at: item.last_scan_at,
    completed_at: item.completed_at,
    profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
  }));

  return {
    participants,
    pagination: {
      page: validPage,
      pageSize: validPageSize,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / validPageSize),
      hasMore: from + validPageSize < (count ?? 0),
    },
  };
}

/**
 * Get participant detail for admin
 */
export async function getParticipantDetailAdmin(gameId: string, userId: string) {
  const supabase = await createServerClient();

  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }

  // Get participant info with profile
  const { data: participant, error: participantError } = await supabase
    .from("qr_participants")
    .select(`
      game_id,
      user_id,
      current_level,
      total_points,
      status,
      started_at,
      last_scan_at,
      completed_at,
      profiles!inner(full_name, email, avatar_url, college_id, year, branch, phone)
    `)
    .eq("game_id", gameId)
    .eq("user_id", userId)
    .single();

  if (participantError) {
    throw new Error(`Failed to get participant: ${participantError.message}`);
  }

  // Get completions with level details
  const { data: completions, error: completionsError } = await supabase
    .from("qr_completions")
    .select(`
      id,
      game_id,
      level_id,
      user_id,
      scanner_position,
      points_awarded,
      scanned_at,
      answered_at,
      created_at,
      qr_levels!inner(level_number, title)
    `)
    .eq("game_id", gameId)
    .eq("user_id", userId)
    .order("scanned_at");

  if (completionsError) {
    throw new Error(`Failed to get completions: ${completionsError.message}`);
  }

  // Get scan logs for this participant
  const { data: scanLogs, error: scanLogsError } = await supabase
    .from("qr_scan_logs")
    .select(`
      id,
      game_id,
      level_id,
      user_id,
      result,
      created_at,
      qr_levels(level_number, title)
    `)
    .eq("game_id", gameId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (scanLogsError) {
    throw new Error(`Failed to get scan logs: ${scanLogsError.message}`);
  }

  // Transform participant data
  const participantData = {
    game_id: participant.game_id,
    user_id: participant.user_id,
    current_level: participant.current_level,
    total_points: participant.total_points,
    status: participant.status,
    started_at: participant.started_at,
    last_scan_at: participant.last_scan_at,
    completed_at: participant.completed_at,
    profiles: Array.isArray(participant.profiles) ? participant.profiles[0] : participant.profiles,
  };

  // Calculate duration if completed
  let durationText = "";
  if (participant.started_at && participant.completed_at) {
    const start = new Date(participant.started_at);
    const end = new Date(participant.completed_at);
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    durationText = diffHours > 0 ? `${diffHours}h ${minutes}m` : `${diffMinutes}m`;
  }

  // Transform completions
  const completionsData = (completions as Array<{
    id: string;
    game_id: string;
    level_id: string;
    user_id: string;
    scanner_position: number;
    points_awarded: number;
    scanned_at: string | null;
    answered_at: string | null;
    created_at: string;
    qr_levels: Array<{ level_number: number; title: string }> | null;
  }>).map(c => ({
    id: c.id,
    level_id: c.level_id,
    level_number: c.qr_levels?.[0]?.level_number,
    level_title: c.qr_levels?.[0]?.title,
    scanner_position: c.scanner_position,
    points_awarded: c.points_awarded,
    scanned_at: c.scanned_at,
    answered_at: c.answered_at,
    created_at: c.created_at,
  }));

  // Transform scan logs
  const scanLogsData = (scanLogs as Array<{
    id: string;
    game_id: string;
    level_id: string;
    user_id: string;
    result: string;
    created_at: string;
    qr_levels: Array<{ level_number: number; title: string }> | null;
  }>).map(s => ({
    id: s.id,
    level_id: s.level_id,
    level_number: s.qr_levels?.[0]?.level_number,
    level_title: s.qr_levels?.[0]?.title,
    result: s.result,
    created_at: s.created_at,
  }));

  return {
    participant: participantData,
    duration: durationText,
    completions: completionsData,
    scanLogs: scanLogsData,
  };
}