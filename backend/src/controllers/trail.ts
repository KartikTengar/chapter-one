import { Router } from "@koa/router";
import { z } from "zod";
import { randomUUID } from "crypto";
import { getSupabaseAdmin, requireUser } from '../services/supabase.js';
import {
  resolveHiddenTrailGame,
  getParticipant,
  getProfile,
  logScan,
  publishCompletion,
  type CompletionEvent,
} from '../services/trail.js';
import { calculateStreak, deriveDisplayName, type DisplayNameMode } from '../utils/trail.js';
import { decodeQrFromImage, isVisionAvailable } from '../services/vision.js';

function getAdmin() {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase admin client not configured");
  return admin;
}

const answerSchema = z.object({
  token: z.string().min(8).max(256),
  answer: z.string().min(1).max(200),
});

const TOKEN_PATTERN = /^[A-Za-z0-9._~-]{8,256}$/;

function extractTrailToken(data: string): string | null {
  const trimmed = data.trim();
  if (!trimmed) return null;
  try {
    if (/^https?:\/\//i.test(trimmed)) {
      const url = new URL(trimmed);
      // Only accept URLs with the exact Hidden Trail scan path
      const m = url.pathname.match(/^\/hidden-trail\/scan\/([^/]+)\/?$/);
      if (m && TOKEN_PATTERN.test(decodeURIComponent(m[1]))) return decodeURIComponent(m[1]);
      return null;
    }
    const m = trimmed.match(/^\/?hidden-trail\/scan\/([^/?#]+)\/?$/);
    if (m && TOKEN_PATTERN.test(decodeURIComponent(m[1]))) return decodeURIComponent(m[1]);
    if (TOKEN_PATTERN.test(trimmed)) return trimmed;
    return null;
  } catch {
    return null;
  }
}

const NOT_CONFIGURED = {
  code: "GAME_NOT_CONFIGURED",
  message: "Hidden Trail isn't configured yet.",
};

export const trailRouter = new Router({ prefix: "/api/v1/trail" });
trailRouter.use(requireUser());

/** GET /api/v1/trail/state */
trailRouter.get("/state", async (ctx) => {
  const admin = getAdmin();
  const userId = ctx.state.user.id as string;
  const game = await resolveHiddenTrailGame(admin);
  if (!game) {
    ctx.body = { configured: false, game: null, participant: null };
    return;
  }
  const participant = await getParticipant(admin, game.id, userId);
  ctx.body = {
    configured: true,
    game: {
      id: game.id,
      name: game.name,
      status: game.status,
      start_at: game.start_at,
      end_at: game.end_at,
      photo_feature_enabled: game.photo_feature_enabled ?? false,
      gallery_enabled: game.gallery_enabled ?? true,
      live_display_enabled: game.live_display_enabled ?? true,
      leaderboard_name_mode: game.leaderboard_name_mode,
    },
    participant: participant
      ? {
          status: participant.status,
          current_level: participant.current_level,
          total_points: participant.total_points,
          started_at: participant.started_at,
          last_scan_at: participant.last_scan_at,
          completed_at: participant.completed_at,
        }
      : null,
  };
});

/** GET /api/v1/trail/scan/:token */
trailRouter.get("/scan/:token", async (ctx) => {
  const admin = getAdmin();
  const userId = ctx.state.user.id as string;
  const token = ctx.params.token as string;

  const game = await resolveHiddenTrailGame(admin);
  if (!game) {
    ctx.status = 404;
    ctx.body = { error: { code: "GAME_NOT_CONFIGURED", message: NOT_CONFIGURED.message } };
    return;
  }

  const { data, error } = await admin.rpc("validate_qr_token", {
    p_token: token,
    p_user_id: userId,
  });
  if (error) {
    ctx.status = 500;
    ctx.body = { error: { code: "SCAN_FAILED", message: "Could not verify this marker." } };
    return;
  }

  const result = Array.isArray(data) ? data[0] : data;

  // Record analytics (never authoritative for scoring).
  const levelId = result?.level_id ?? null;
  if (!result?.is_valid) {
    const resultKind = !result?.level_id
      ? "invalid_token"
      : result.error_message?.toLowerCase().includes("wrong trail")
        ? "wrong_level"
        : result.error_message?.toLowerCase().includes("already cleared")
          ? "duplicate"
          : "invalid_token";
    await logScan(admin, game.id, userId, resultKind, levelId);
  } else {
    await logScan(admin, game.id, userId, "success", levelId);
  }

  ctx.body = {
    game_id: result?.game_id ?? null,
    level_id: result?.level_id ?? null,
    level_number: result?.level_number ?? null,
    is_valid: result?.is_valid ?? false,
    is_expected_level: result?.is_expected_level ?? false,
    is_duplicate: result?.is_duplicate ?? false,
    game_status: result?.game_status ?? game.status,
    current_level: result?.current_level ?? 0,
    total_points: result?.total_points ?? 0,
    location_riddle: result?.location_riddle ?? null,
    answer_riddle: result?.answer_riddle ?? null,
    case_sensitive: result?.case_sensitive ?? false,
    error_message: result?.error_message ?? null,
  };
});

/** POST /api/v1/trail/vision-decode
 *  Google Cloud Vision fallback for QR decoding.
 *  Only called when client-side jsQR fails.
 *  Rate-limited and credentials server-only.
 */
const visionSchema = z.object({
  image: z.string().min(100),
  mime: z.enum(['image/jpeg', 'image/png', 'image/webp']).default('image/jpeg'),
});

// In-memory rate limiter for Vision calls per user
const visionRateLimiter = new Map<string, { count: number; resetAt: number }>();
const VISION_RATE_LIMIT = 5; // max requests per window
const VISION_RATE_WINDOW_MS = 60_000; // 1 minute window

function checkVisionRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = visionRateLimiter.get(userId);
  if (!entry || now > entry.resetAt) {
    visionRateLimiter.set(userId, { count: 1, resetAt: now + VISION_RATE_WINDOW_MS });
    return { allowed: true };
  }
  if (entry.count >= VISION_RATE_LIMIT) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  return { allowed: true };
}

trailRouter.post("/vision-decode", async (ctx) => {
  if (!isVisionAvailable()) {
    ctx.status = 503;
    ctx.body = { error: { code: "VISION_UNAVAILABLE", message: "Vision fallback not configured" } };
    return;
  }

  const admin = getAdmin();
  const userId = ctx.state.user.id as string;

  const rateLimit = checkVisionRateLimit(userId);
  if (!rateLimit.allowed) {
    ctx.status = 429;
    ctx.body = {
      error: {
        code: "VISION_RATE_LIMITED",
        message: `Vision rate limit exceeded. Try again in ${rateLimit.retryAfter}s.`,
      },
    };
    return;
  }

  const parsed = visionSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    ctx.status = 400;
    ctx.body = { error: { code: "VALIDATION_FAILED", message: "Image data required" } };
    return;
  }

  const { image, mime } = parsed.data;

  // Decode base64 image
  let imageBuffer: Buffer;
  try {
    imageBuffer = Buffer.from(image, 'base64');
  } catch {
    ctx.status = 400;
    ctx.body = { error: { code: "INVALID_IMAGE", message: "Invalid base64 image data" } };
    return;
  }

  // Basic size limit: 8MB
  if (imageBuffer.length > 8 * 1024 * 1024) {
    ctx.status = 400;
    ctx.body = { error: { code: "IMAGE_TOO_LARGE", message: "Image must be under 8 MB" } };
    return;
  }

  const visionResult = await decodeQrFromImage(imageBuffer, mime);
  if (!visionResult?.text) {
    ctx.body = { decoded: null };
    return;
  }

  // Apply the SAME strict token parser as the client
  const token = extractTrailToken(visionResult.text);
  if (!token) {
    ctx.body = { decoded: null, rejected: "NOT_A_TRAIL_QR" };
    return;
  }

  ctx.body = { decoded: token, confidence: visionResult.confidence };
});

/** POST /api/v1/trail/answer */
trailRouter.post("/answer", async (ctx) => {
  const admin = getAdmin();
  const userId = ctx.state.user.id as string;

  const parsed = answerSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    ctx.status = 400;
    ctx.body = { error: { code: "VALIDATION_FAILED", message: "Answer and token are required." } };
    return;
  }
  const { token, answer } = parsed.data;

  const game = await resolveHiddenTrailGame(admin);
  if (!game) {
    ctx.status = 404;
    ctx.body = { error: { code: "GAME_NOT_CONFIGURED", message: NOT_CONFIGURED.message } };
    return;
  }

  if (game.status === "paused") {
    ctx.body = { error: { code: "GAME_PAUSED", message: "The trail is temporarily paused." } };
    return;
  }
  if (game.status === "ended") {
    ctx.body = { error: { code: "GAME_ENDED", message: "The trail has closed." } };
    return;
  }

  const { data, error } = await admin.rpc("process_qr_answer", {
    p_token: token,
    p_user_id: userId,
    p_answer: answer,
  });
  if (error) {
    ctx.status = 500;
    ctx.body = { error: { code: "ANSWER_FAILED", message: "Could not process your answer." } };
    return;
  }

  const result = Array.isArray(data) ? data[0] : data;
  const levelId = result?.level_id ?? null;

  if (!result?.success) {
    const isWrong = String(result?.error_message ?? "").toUpperCase().includes("WRONG_ANSWER");
    await logScan(admin, game.id, userId, isWrong ? "answer_incorrect" : "invalid_token", levelId);
    ctx.status = isWrong ? 400 : 400;
    ctx.body = {
      success: false,
      error: {
        code: isWrong ? "WRONG_ANSWER" : "INVALID_TOKEN",
        message: isWrong ? "Not quite. Try again." : result?.error_message ?? "Invalid marker.",
      },
    };
    return;
  }

  // Success — completion is committed atomically in the DB.
  await logScan(admin, game.id, userId, "success", levelId);

  // process_qr_answer does not return level metadata; resolve from the token.
  const { data: answeredLevel } = await admin
    .from("qr_levels")
    .select("id, level_number")
    .eq("token", token)
    .maybeSingle();
  const answeredLevelId = answeredLevel?.id ?? levelId;
  const answeredLevelNumber = answeredLevel?.level_number ?? result.current_level ?? null;

  // Publish a safe realtime event (best-effort; DB remains authority).
  const profile = await getProfile(admin, userId);
  const mode = (game.leaderboard_name_mode ?? "FIRST_NAME") as DisplayNameMode;
  const event: CompletionEvent = {
    type: "completion",
    display_name: deriveDisplayName(profile?.full_name, mode),
    level: answeredLevelNumber ?? result.level_number ?? 0,
    points: result.points_awarded,
    occurred_at: new Date().toISOString(),
    event_id: randomUUID(),
  };
  await publishCompletion(admin, event);

  // Idempotent achievement evaluation.
  await evaluateAchievements(admin, game.id, userId);

  ctx.body = {
    success: true,
    points_awarded: result.points_awarded,
    scanner_position: result.scanner_position,
    total_points: result.total_points,
    current_level: result.current_level,
    level_number: answeredLevelNumber,
    status: result.status,
    is_completed: result.is_completed,
    location_riddle: result.location_riddle ?? null,
    answer_riddle: result.answer_riddle ?? null,
    game_id: game.id,
    level_id: answeredLevelId,
  };
});

/** GET /api/v1/trail/stats */
trailRouter.get("/stats", async (ctx) => {
  const admin = getAdmin();
  const userId = ctx.state.user.id as string;

  const game = await resolveHiddenTrailGame(admin);
  if (!game) {
    ctx.body = { configured: false };
    return;
  }
  const participant = await getParticipant(admin, game.id, userId);
  if (!participant) {
    ctx.body = { configured: true, stats: null };
    return;
  }

  const [completions, scanLogs, photos] = await Promise.all([
    admin.from("qr_completions").select("*, qr_levels(level_number, title)").eq("game_id", game.id).eq("user_id", userId).order("answered_at", { ascending: true }),
    admin.from("qr_scan_logs").select("result, created_at").eq("game_id", game.id).eq("user_id", userId).order("created_at", { ascending: true }),
    admin.from("hidden_trail_photos").select("id").eq("game_id", game.id).eq("user_id", userId),
  ]);

  const completionRows = (completions.data ?? []) as Array<{ answered_at: string | null; points_awarded: number; qr_levels: Array<{ level_number: number; title: string }> | null }>;
  const scanRows = (scanLogs.data ?? []) as Array<{ result: string; created_at: string }>;
  const photoCount = (photos.data ?? []).length;

  const wrongAnswers = scanRows.filter((s) => s.result === "answer_incorrect").length;
  const invalidScans = scanRows.filter((s) => ["invalid_token", "wrong_level"].includes(s.result)).length;

  // Build chronological streak sequence.
  const events: Array<{ kind: "success" | "wrong"; at: string }> = [
    ...completionRows.map((c) => ({ kind: "success" as const, at: c.answered_at ?? new Date(0).toISOString() })),
    ...scanRows.filter((s) => s.result === "answer_incorrect").map((s) => ({ kind: "wrong" as const, at: s.created_at })),
  ].sort((a, b) => +new Date(a.at) - +new Date(b.at));
  const streak = calculateStreak(events.map((e) => ({ kind: e.kind })));

  // Rank among all participants.
  const { data: allParticipants } = await admin
    .from("qr_participants")
    .select("user_id, total_points, completed_at")
    .eq("game_id", game.id)
    .order("total_points", { ascending: false })
    .order("completed_at", { ascending: true });
  const ranked = (allParticipants ?? []) as Array<{ user_id: string; total_points: number; completed_at: string | null }>;
  const rankIndex = ranked.findIndex((r) => r.user_id === userId);

  const started = participant.started_at ? +new Date(participant.started_at) : 0;
  const finished = participant.completed_at ? +new Date(participant.completed_at) : 0;
  const totalMs = started && finished ? finished - started : null;

  ctx.body = {
    configured: true,
    stats: {
      markers_cleared: participant.current_level,
      total_levels: completionRows.length > 0 ? undefined : undefined,
      total_points: participant.total_points,
      wrong_answers: wrongAnswers,
      invalid_scans: invalidScans,
      photos: photoCount,
      streak: streak.current,
      best_streak: streak.best,
      status: participant.status,
      started_at: participant.started_at,
      completed_at: participant.completed_at,
      total_time_seconds: totalMs ? Math.floor(totalMs / 1000) : null,
      rank: rankIndex >= 0 ? rankIndex + 1 : null,
      total_participants: ranked.length,
    },
  };
});

/** GET /api/v1/trail/replay */
trailRouter.get("/replay", async (ctx) => {
  const admin = getAdmin();
  const userId = ctx.state.user.id as string;

  const game = await resolveHiddenTrailGame(admin);
  if (!game) {
    ctx.body = { configured: false };
    return;
  }
  const participant = await getParticipant(admin, game.id, userId);
  if (!participant) {
    ctx.body = { configured: true, timeline: [] };
    return;
  }

  const [completions, photos] = await Promise.all([
    admin.from("qr_completions").select("*, qr_levels(level_number, title)").eq("game_id", game.id).eq("user_id", userId).order("answered_at", { ascending: true }),
    admin.from("hidden_trail_photos").select("id, level_id, created_at, capture_stage").eq("game_id", game.id).eq("user_id", userId).order("created_at", { ascending: true }),
  ]);

  const timeline: Array<Record<string, unknown>> = [];
  if (participant.started_at) {
    timeline.push({ type: "start", occurred_at: participant.started_at, label: "Started Hunt" });
  }
  for (const c of (completions.data ?? []) as Array<{
    level_id: string;
    points_awarded: number;
    answered_at: string | null;
    qr_levels: Array<{ level_number: number; title: string }> | { level_number: number; title: string } | null;
  }>) {
    const levelInfo = Array.isArray(c.qr_levels) ? c.qr_levels[0] : c.qr_levels;
    const photo = (photos.data ?? []).find(
      (p) => (p as { level_id: string }).level_id === c.level_id
    );
    timeline.push({
      type: "marker",
      level: levelInfo?.level_number ?? null,
      title: levelInfo?.title ?? "Marker",
      points: c.points_awarded,
      occurred_at: c.answered_at,
      photo_id: photo ? (photo as { id: string }).id : null,
    });
  }
  if (participant.completed_at) {
    timeline.push({ type: "complete", occurred_at: participant.completed_at, label: "Trail Complete" });
  }

  ctx.body = { configured: true, timeline };
});

/** GET /api/v1/trail/achievements */
trailRouter.get("/achievements", async (ctx) => {
  const admin = getAdmin();
  const userId = ctx.state.user.id as string;

  const game = await resolveHiddenTrailGame(admin);
  if (!game) {
    ctx.body = { configured: false };
    return;
  }

  const [allAchievements, userAchievements] = await Promise.all([
    admin.from("achievements").select("*").eq("is_active", true).order("code"),
    admin.from("user_achievements").select("achievement_id, earned_at").eq("game_id", game.id).eq("user_id", userId),
  ]);

  const unlockedIds = new Set((userAchievements.data ?? []).map((a) => (a as { achievement_id: string }).achievement_id));
  const list = (allAchievements.data ?? []).map((a) => {
    const ach = a as { id: string; code: string; name: string; description: string | null; icon: string | null };
    return {
      code: ach.code,
      name: ach.name,
      description: ach.description,
      icon: ach.icon,
      unlocked: unlockedIds.has(ach.id),
      earned_at: (userAchievements.data ?? []).find((u) => (u as { achievement_id: string }).achievement_id === ach.id)?.earned_at ?? null,
    };
  });

  ctx.body = { configured: true, achievements: list };
});

/**
 * Evaluate and award achievements idempotently after a successful completion.
 */
async function evaluateAchievements(admin: ReturnType<typeof getSupabaseAdmin>, gameId: string, userId: string) {
  try {
    const game = await resolveHiddenTrailGame(admin!);
    if (!game) return;

    const [completions, scanLogs, allCompletions, photoRows] = await Promise.all([
      admin!.from("qr_completions").select("id, level_id, answered_at").eq("game_id", gameId).eq("user_id", userId).order("answered_at", { ascending: true }),
      admin!.from("qr_scan_logs").select("result").eq("game_id", gameId).eq("user_id", userId),
      admin!.from("qr_completions").select("user_id, answered_at").eq("game_id", gameId).order("answered_at", { ascending: true }).limit(1),
      admin!.from("hidden_trail_photos").select("id").eq("game_id", gameId).eq("user_id", userId),
    ]);

    const { count: totalLevelCount } = await admin!
      .from("qr_levels")
      .select("id", { count: "exact", head: true })
      .eq("game_id", gameId);

    const completionCount = (completions.data ?? []).length;
    const wrongCount = (scanLogs.data ?? []).filter((s) => (s as { result: string }).result === "answer_incorrect").length;

    // Fetch achievement ids by code.
    const { data: defs } = await admin!.from("achievements").select("id, code");
    const byCode = new Map((defs ?? []).map((d) => [(d as { code: string }).code, (d as { id: string }).id]));

    const grant = async (code: string) => {
      const achievementId = byCode.get(code);
      if (!achievementId) return;
      await admin!
        .from("user_achievements")
        .upsert(
          { user_id: userId, achievement_id: achievementId, game_id: gameId },
          { onConflict: "user_id,achievement_id,game_id", ignoreDuplicates: true }
        );
    };

    const isComplete = completionCount >= (totalLevelCount ?? 0) && (totalLevelCount ?? 0) > 0;
    const perfect = isComplete && wrongCount === 0;
    const firstCompletion = (allCompletions.data ?? [])[0] as { user_id: string } | undefined;
    const photoCount = (photoRows.data ?? []).length;

    if (isComplete) {
      await grant("FINISHER");
      await grant("EXPLORER");
      if (perfect) await grant("PERFECT_TRAIL");
    }
    if (firstCompletion && firstCompletion.user_id === userId) await grant("FIRST_BLOOD");
    if (photoCount >= 5) await grant("PHOTO_HUNTER");
  } catch {
    // Achievement evaluation must never corrupt core scoring.
  }
}

export { evaluateAchievements };