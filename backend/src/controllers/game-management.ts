import { Router } from "@koa/router";
import { getSupabaseAdmin, requireUser, requireAdmin } from '../services/supabase.js';

function getAdmin() {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase admin client not configured");
  return admin;
}

async function audit(
  adminUserId: string,
  action: string,
  entityType: string,
  entityId: string,
  details: Record<string, unknown>
) {
  await getAdmin().from("qr_admin_audit").insert({
    admin_user_id: adminUserId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
  });
}

function safeInt(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

function normalizeSlug(slug: unknown): string | null {
  if (typeof slug !== "string") return null;
  const trimmed = slug.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

const ALLOWED_UPDATE_FIELDS = new Set([
  "name", "description", "slug",
  "score_start_level", "starting_score", "score_floor",
  "leaderboard_name_mode", "leaderboard_public",
  "photo_feature_enabled", "gallery_enabled", "live_display_enabled",
  "final_message", "final_secret_message",
  "final_secret_enabled", "final_secret_hash",
]);

function pickAllowed(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of ALLOWED_UPDATE_FIELDS) {
    if (key in body) out[key] = body[key];
  }
  return out;
}

const LIFECYCLE_TRANSITIONS: Record<string, string[]> = {
  draft: ["ready", "archived"],
  ready: ["running"],
  running: ["paused", "ended"],
  paused: ["running", "ended"],
  ended: ["archived"],
  archived: [],
};

function canTransition(from: string, to: string): boolean {
  return (LIFECYCLE_TRANSITIONS[from] ?? []).includes(to);
}

export const gameManagementRouter = new Router({ prefix: "/api/v1/admin/games" });
gameManagementRouter.use(requireUser(), requireAdmin());

function getGameId(ctx: any): string {
  const id = ctx.params.id as string;
  if (!id || !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id)) {
    ctx.status = 400;
    ctx.body = { error: "Invalid game id" };
    throw new Error("BAD_ID");
  }
  return id;
}

/** GET /api/v1/admin/games — list all qr_games instances */
gameManagementRouter.get("/", async (ctx) => {
  try {
    const admin = getAdmin();
    const status = typeof ctx.query.status === "string" ? ctx.query.status : undefined;
    const gameType = typeof ctx.query.game_type === "string" ? ctx.query.game_type : undefined;
    const isCurrent = typeof ctx.query.is_current === "string" ? ctx.query.is_current : undefined;

    let query = admin.from("qr_games").select("*").order("created_at", { ascending: false });
    if (status) query = query.eq("status", status);
    if (gameType) query = query.eq("game_type", gameType);
    if (isCurrent === "true") query = query.eq("is_current", true);
    else if (isCurrent === "false") query = query.eq("is_current", false);

    const { data, error } = await query;
    if (error) throw error;
    ctx.body = { data: data ?? [] };
  } catch {
    ctx.status = 500;
    ctx.body = { error: "Failed to fetch games" };
  }
});

/** POST /api/v1/admin/games — create a new Hidden Trail instance */
gameManagementRouter.post("/", async (ctx) => {
  try {
    const admin = getAdmin();
    const body = ctx.request.body as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const slug = normalizeSlug(body.slug);
    const description = typeof body.description === "string" ? body.description : null;
    const levelCount = safeInt(body.level_count, 10);
    const startingScore = safeInt(body.starting_score, 100);
    const scoreFloor = safeInt(body.score_floor, 30);
    const scoreStartLevel = safeInt(body.score_start_level, 2);
    const leaderboardNameMode = typeof body.leaderboard_name_mode === "string" ? body.leaderboard_name_mode : "FIRST_NAME";
    const leaderboardPublic = body.leaderboard_public !== false;

    if (!name || !slug) {
      ctx.status = 400;
      ctx.body = { error: "name and slug are required" };
      return;
    }
    if (levelCount < 1 || levelCount > 20) {
      ctx.status = 400;
      ctx.body = { error: "level_count must be 1..20" };
      return;
    }

    const { data: gameId, error } = await admin.rpc("create_hidden_trail_game", {
      p_name: name,
      p_slug: slug,
      p_description: description,
      p_level_count: levelCount,
      p_starting_score: startingScore,
      p_score_floor: scoreFloor,
      p_score_start_level: scoreStartLevel,
      p_leaderboard_name_mode: leaderboardNameMode,
      p_leaderboard_public: leaderboardPublic,
      p_admin_user_id: ctx.state.user.id,
    });
    if (error) {
      if (error.code === "PGRST116") {
        ctx.status = 404;
        ctx.body = { error: error.message };
      } else if (error.code === "42501") {
        ctx.status = 403;
        ctx.body = { error: "Admin access required" };
      } else {
        ctx.status = 400;
        ctx.body = { error: error.message ?? "Creation failed" };
      }
      return;
    }

    await audit(ctx.state.user.id, "GAME_CREATE", "qr_game", gameId, { name, slug, level_count: levelCount });
    const { data: game } = await admin.from("qr_games").select("*").eq("id", gameId).maybeSingle();
    ctx.status = 201;
    ctx.body = { data: game };
  } catch (err: any) {
    if (err?.message === "BAD_ID") return;
    ctx.status = 500;
    ctx.body = { error: "Failed to create game" };
  }
});

/** GET /api/v1/admin/games/:id — game detail */
gameManagementRouter.get("/:id", async (ctx) => {
  try {
    const admin = getAdmin();
    const id = getGameId(ctx);
    const { data, error } = await admin.from("qr_games").select("*").eq("id", id).maybeSingle();
    if (error || !data) {
      ctx.status = 404;
      ctx.body = { error: "Game not found" };
      return;
    }
    const levelCount = (await admin.from("qr_levels").select("*", { count: "exact", head: true }).eq("game_id", id).eq("is_active", true)).count ?? 0;
    const participantCount = (await admin.from("qr_participants").select("*", { count: "exact", head: true }).eq("game_id", id)).count ?? 0;
    const completionCount = (await admin.from("qr_completions").select("*", { count: "exact", head: true }).eq("game_id", id)).count ?? 0;
    ctx.body = {
      data: {
        ...data,
        level_count: levelCount,
        participant_count: participantCount,
        completion_count: completionCount,
      },
    };
  } catch {
    ctx.status = 500;
    ctx.body = { error: "Failed to fetch game" };
  }
});

/** PATCH /api/v1/admin/games/:id — update metadata (DRAFT/READY only) */
gameManagementRouter.patch("/:id", async (ctx) => {
  try {
    const admin = getAdmin();
    const id = getGameId(ctx);
    const { data: existing } = await admin.from("qr_games").select("status").eq("id", id).maybeSingle();
    if (!existing) {
      ctx.status = 404;
      ctx.body = { error: "Game not found" };
      return;
    }
    if (!canTransition(existing.status, existing.status)) {
      ctx.status = 403;
      ctx.body = { error: "Metadata updates only allowed in DRAFT or READY state" };
      return;
    }
    const body = ctx.request.body as Record<string, unknown>;
    const updates = pickAllowed(body);
    if (Object.keys(updates).length === 0) {
      ctx.status = 400;
      ctx.body = { error: "No valid fields provided" };
      return;
    }
    updates.updated_at = new Date().toISOString();
    const { data, error } = await admin.from("qr_games").update(updates).eq("id", id).select().maybeSingle();
    if (error) throw error;
    await audit(ctx.state.user.id, "GAME_UPDATED", "qr_game", id, { fields: Object.keys(updates) });
    ctx.body = { data };
  } catch {
    ctx.status = 500;
    ctx.body = { error: "Failed to update game" };
  }
});

/** POST /api/v1/admin/games/:id/duplicate — clone a game */
gameManagementRouter.post("/:id/duplicate", async (ctx) => {
  try {
    const admin = getAdmin();
    const id = getGameId(ctx);
    const body = ctx.request.body as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const slug = normalizeSlug(body.slug);
    if (!name || !slug) {
      ctx.status = 400;
      ctx.body = { error: "name and slug are required" };
      return;
    }
    const { data: newId, error } = await admin.rpc("duplicate_hidden_trail_game", {
      p_source_game_id: id,
      p_name: name,
      p_slug: slug,
      p_admin_user_id: ctx.state.user.id,
    });
    if (error) {
      ctx.status = error.code === "42501" ? 403 : 400;
      ctx.body = { error: error.message ?? "Clone failed" };
      return;
    }
    await audit(ctx.state.user.id, "GAME_CLONE", "qr_game", newId, { source_game_id: id, name, slug });
    const { data: game } = await admin.from("qr_games").select("*").eq("id", newId).maybeSingle();
    ctx.status = 201;
    ctx.body = { data: game };
  } catch {
    ctx.status = 500;
    ctx.body = { error: "Failed to clone game" };
  }
});

/** POST /api/v1/admin/games/:id/readiness — run readiness validation */
gameManagementRouter.post("/:id/readiness", async (ctx) => {
  try {
    const admin = getAdmin();
    const id = getGameId(ctx);
    const { data, error } = await admin.rpc("readiness_hidden_trail_game", { p_game_id: id });
    if (error) {
      ctx.status = 500;
      ctx.body = { error: "Readiness check failed" };
      return;
    }
    const result = data as { passed: boolean; checks: unknown[]; level_count: number };
    await audit(ctx.state.user.id, "GAME_READINESS", "qr_game", id, { passed: result.passed, level_count: result.level_count });
    ctx.body = { data: result };
  } catch {
    ctx.status = 500;
    ctx.body = { error: "Failed to run readiness check" };
  }
});

/** POST /api/v1/admin/games/:id/ready — mark game as READY */
gameManagementRouter.post("/:id/ready", async (ctx) => {
  try {
    const admin = getAdmin();
    const id = getGameId(ctx);
    const { data: existing } = await admin.from("qr_games").select("status").eq("id", id).maybeSingle();
    if (!existing) { ctx.status = 404; ctx.body = { error: "Game not found" }; return; }
    if (!["draft", "ready"].includes(existing.status)) {
      ctx.status = 409;
      ctx.body = { error: `Game must be in 'draft' or 'ready' state, current: ${existing.status}` };
      return;
    }
    // Run readiness check first if in draft state
    if (existing.status === "draft") {
      const { data: readinessData, error: readinessError } = await admin.rpc("readiness_hidden_trail_game", { p_game_id: id });
      if (readinessError) {
        ctx.status = 500;
        ctx.body = { error: "Readiness check failed" };
        return;
      }
      const result = readinessData as { passed: boolean; checks: unknown[]; level_count: number };
      if (!result.passed) {
        ctx.status = 409;
        ctx.body = { error: "Game failed readiness check", checks: result.checks };
        return;
      }
    }
    const { data, error } = await admin.from("qr_games").update({ status: "ready", readiness_passed: true, ready_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id).select().maybeSingle();
    if (error) throw error;
    await audit(ctx.state.user.id, "GAME_READY", "qr_game", id, {});
    ctx.body = { data };
  } catch {
    ctx.status = 500;
    ctx.body = { error: "Failed to mark game ready" };
  }
});

/** POST /api/v1/admin/games/:id/start — transition to RUNNING */
gameManagementRouter.post("/:id/start", async (ctx) => {
  try {
    const admin = getAdmin();
    const id = getGameId(ctx);
    const { data: existing } = await admin.from("qr_games").select("status").eq("id", id).maybeSingle();
    if (!existing) { ctx.status = 404; ctx.body = { error: "Game not found" }; return; }
    if (!canTransition(existing.status, "running")) {
      ctx.status = 409;
      ctx.body = { error: `Cannot start from ${existing.status} state` };
      return;
    }
    const { data, error } = await admin.from("qr_games").update({ status: "running", started_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id).select().maybeSingle();
    if (error) throw error;
    await audit(ctx.state.user.id, "GAME_START", "qr_game", id, { from: existing.status });
    ctx.body = { data };
  } catch {
    ctx.status = 500;
    ctx.body = { error: "Failed to start game" };
  }
});

/** POST /api/v1/admin/games/:id/pause — transition to PAUSED */
gameManagementRouter.post("/:id/pause", async (ctx) => {
  try {
    const admin = getAdmin();
    const id = getGameId(ctx);
    const { data: existing } = await admin.from("qr_games").select("status").eq("id", id).maybeSingle();
    if (!existing) { ctx.status = 404; ctx.body = { error: "Game not found" }; return; }
    if (!canTransition(existing.status, "paused")) {
      ctx.status = 409;
      ctx.body = { error: `Cannot pause from ${existing.status} state` };
      return;
    }
    const { data, error } = await admin.from("qr_games").update({ status: "paused", paused_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id).select().maybeSingle();
    if (error) throw error;
    await audit(ctx.state.user.id, "GAME_PAUSE", "qr_game", id, { from: existing.status });
    ctx.body = { data };
  } catch {
    ctx.status = 500;
    ctx.body = { error: "Failed to pause game" };
  }
});

/** POST /api/v1/admin/games/:id/resume — transition to RUNNING */
gameManagementRouter.post("/:id/resume", async (ctx) => {
  try {
    const admin = getAdmin();
    const id = getGameId(ctx);
    const { data: existing } = await admin.from("qr_games").select("status").eq("id", id).maybeSingle();
    if (!existing) { ctx.status = 404; ctx.body = { error: "Game not found" }; return; }
    if (!canTransition(existing.status, "running")) {
      ctx.status = 409;
      ctx.body = { error: `Cannot resume from ${existing.status} state` };
      return;
    }
    const { data, error } = await admin.from("qr_games").update({ status: "running", paused_at: null, updated_at: new Date().toISOString() }).eq("id", id).select().maybeSingle();
    if (error) throw error;
    await audit(ctx.state.user.id, "GAME_RESUME", "qr_game", id, { from: existing.status });
    ctx.body = { data };
  } catch {
    ctx.status = 500;
    ctx.body = { error: "Failed to resume game" };
  }
});

/** POST /api/v1/admin/games/:id/end — transition to ENDED */
gameManagementRouter.post("/:id/end", async (ctx) => {
  try {
    const admin = getAdmin();
    const id = getGameId(ctx);
    const { data: existing } = await admin.from("qr_games").select("status").eq("id", id).maybeSingle();
    if (!existing) { ctx.status = 404; ctx.body = { error: "Game not found" }; return; }
    if (!canTransition(existing.status, "ended")) {
      ctx.status = 409;
      ctx.body = { error: `Cannot end from ${existing.status} state` };
      return;
    }
    const { data, error } = await admin.from("qr_games").update({ status: "ended", ended_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id).select().maybeSingle();
    if (error) throw error;
    await audit(ctx.state.user.id, "GAME_END", "qr_game", id, { from: existing.status });
    ctx.body = { data };
  } catch {
    ctx.status = 500;
    ctx.body = { error: "Failed to end game" };
  }
});

/** POST /api/v1/admin/games/:id/archive — transition to ARCHIVED */
gameManagementRouter.post("/:id/archive", async (ctx) => {
  try {
    const admin = getAdmin();
    const id = getGameId(ctx);
    const { data: existing } = await admin.from("qr_games").select("status").eq("id", id).maybeSingle();
    if (!existing) { ctx.status = 404; ctx.body = { error: "Game not found" }; return; }
    if (!canTransition(existing.status, "archived")) {
      ctx.status = 409;
      ctx.body = { error: `Cannot archive from ${existing.status} state` };
      return;
    }
    const { data, error } = await admin.from("qr_games").update({ status: "archived", archived_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id).select().maybeSingle();
    if (error) throw error;
    await audit(ctx.state.user.id, "GAME_ARCHIVE", "qr_game", id, { from: existing.status });
    ctx.body = { data };
  } catch {
    ctx.status = 500;
    ctx.body = { error: "Failed to archive game" };
  }
});

/** POST /api/v1/admin/games/:id/current — set as canonical current game */
gameManagementRouter.post("/:id/current", async (ctx) => {
  try {
    const admin = getAdmin();
    const id = getGameId(ctx);
    const { data: existing } = await admin.from("qr_games").select("game_type").eq("id", id).maybeSingle();
    if (!existing) { ctx.status = 404; ctx.body = { error: "Game not found" }; return; }
    const gameType = existing.game_type ?? "hidden-trail";
    await admin.from("qr_games").update({ is_current: false }).eq("game_type", gameType).neq("id", id);
    const { data, error } = await admin.from("qr_games").update({ is_current: true, updated_at: new Date().toISOString() }).eq("id", id).select().maybeSingle();
    if (error) throw error;
    await audit(ctx.state.user.id, "GAME_SET_CURRENT", "qr_game", id, { game_type: gameType });
    ctx.body = { data };
  } catch {
    ctx.status = 500;
    ctx.body = { error: "Failed to set current game" };
  }
});

/** DELETE /api/v1/admin/games/:id — delete a game (must be ended/archived/draft) */
gameManagementRouter.delete("/:id", async (ctx) => {
  try {
    const admin = getAdmin();
    const id = getGameId(ctx);
    const { data, error } = await admin.rpc("delete_hidden_trail_game", { p_game_id: id, p_admin_user_id: ctx.state.user.id });
    if (error) {
      if (error.code === "409") { ctx.status = 409; ctx.body = { error: error.message }; return; }
      if (error.code === "42501") { ctx.status = 403; ctx.body = { error: "Admin access required" }; return; }
      ctx.status = 400;
      ctx.body = { error: error.message ?? "Delete failed" };
      return;
    }
    const result = data as { game_id: string; name: string; storage_paths: string[] };
    await audit(ctx.state.user.id, "GAME_DELETE_CONFIRM", "qr_game", result.game_id, { name: result.name });
    // Best-effort storage cleanup
    const storagePaths = (result.storage_paths as string[]) ?? [];
    let storageOk = true;
    for (const path of storagePaths) {
      try {
        const { error: sErr } = await admin.storage.from("hidden-trail-photos").remove([path]);
        if (sErr) { storageOk = false; }
      } catch { storageOk = false; }
    }
    ctx.body = { data: { game_id: result.game_id, name: result.name, storage_cleaned: storageOk } };
  } catch {
    ctx.status = 500;
    ctx.body = { error: "Failed to delete game" };
  }
});

/** POST /api/v1/admin/games/:id/lifecycle — generic lifecycle action handler */
gameManagementRouter.post("/:id/lifecycle", async (ctx) => {
  try {
    const admin = getAdmin();
    const id = getGameId(ctx);
    const body = ctx.request.body as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action : "";
    
    const { data: existing } = await admin.from("qr_games").select("status, game_type").eq("id", id).maybeSingle();
    if (!existing) { ctx.status = 404; ctx.body = { error: "Game not found" }; return; }
    
    let newStatus: string | null = null;
    let updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    let auditAction = "";
    
    switch (action) {
      case "ready":
        if (!["draft", "ready"].includes(existing.status)) {
          ctx.status = 409;
          ctx.body = { error: `Game must be in 'draft' or 'ready' state, current: ${existing.status}` };
          return;
        }
        // Run readiness check if in draft
        if (existing.status === "draft") {
          const { data: readinessData, error: readinessError } = await admin.rpc("readiness_hidden_trail_game", { p_game_id: id });
          if (readinessError) {
            ctx.status = 500;
            ctx.body = { error: "Readiness check failed" };
            return;
          }
          const result = readinessData as { passed: boolean; checks: unknown[]; level_count: number };
          if (!result.passed) {
            ctx.status = 409;
            ctx.body = { error: "Game failed readiness check", checks: result.checks };
            return;
          }
        }
        newStatus = "ready";
        updateData = { ...updateData, status: "ready", readiness_passed: true, ready_at: new Date().toISOString() };
        auditAction = "GAME_READY";
        break;
      case "start":
        if (!canTransition(existing.status, "running")) {
          ctx.status = 409;
          ctx.body = { error: `Cannot start from ${existing.status} state` };
          return;
        }
        newStatus = "running";
        updateData = { ...updateData, status: "running", started_at: new Date().toISOString() };
        auditAction = "GAME_START";
        break;
      case "pause":
        if (!canTransition(existing.status, "paused")) {
          ctx.status = 409;
          ctx.body = { error: `Cannot pause from ${existing.status} state` };
          return;
        }
        newStatus = "paused";
        updateData = { ...updateData, status: "paused", paused_at: new Date().toISOString() };
        auditAction = "GAME_PAUSE";
        break;
      case "resume":
        if (!canTransition(existing.status, "running")) {
          ctx.status = 409;
          ctx.body = { error: `Cannot resume from ${existing.status} state` };
          return;
        }
        newStatus = "running";
        updateData = { ...updateData, status: "running", paused_at: null };
        auditAction = "GAME_RESUME";
        break;
      case "end":
        if (!canTransition(existing.status, "ended")) {
          ctx.status = 409;
          ctx.body = { error: `Cannot end from ${existing.status} state` };
          return;
        }
        newStatus = "ended";
        updateData = { ...updateData, status: "ended", ended_at: new Date().toISOString() };
        auditAction = "GAME_END";
        break;
      case "archive":
        if (!canTransition(existing.status, "archived")) {
          ctx.status = 409;
          ctx.body = { error: `Cannot archive from ${existing.status} state` };
          return;
        }
        newStatus = "archived";
        updateData = { ...updateData, status: "archived", archived_at: new Date().toISOString() };
        auditAction = "GAME_ARCHIVE";
        break;
      case "readiness":
        const { data: readinessData, error: readinessError } = await admin.rpc("readiness_hidden_trail_game", { p_game_id: id });
        if (readinessError) {
          ctx.status = 500;
          ctx.body = { error: "Readiness check failed" };
          return;
        }
        const result = readinessData as { passed: boolean; checks: unknown[]; level_count: number };
        await audit(ctx.state.user.id, "GAME_READINESS", "qr_game", id, { passed: result.passed, level_count: result.level_count });
        ctx.body = { data: result };
        return;
      case "setCurrent":
        const gameType = existing.game_type ?? "hidden-trail";
        await admin.from("qr_games").update({ is_current: false }).eq("game_type", gameType).neq("id", id);
        const { data: currentData, error: currentError } = await admin.from("qr_games").update({ is_current: true, updated_at: new Date().toISOString() }).eq("id", id).select().maybeSingle();
        if (currentError) throw currentError;
        await audit(ctx.state.user.id, "GAME_SET_CURRENT", "qr_game", id, { game_type: gameType });
        ctx.body = { data: currentData };
        return;
      case "duplicate":
        const name = typeof body.name === "string" ? body.name.trim() : "";
        const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
        if (!name || !slug) {
          ctx.status = 400;
          ctx.body = { error: "name and slug are required" };
          return;
        }
        const { data: newId, error: dupError } = await admin.rpc("duplicate_hidden_trail_game", {
          p_source_game_id: id,
          p_name: name,
          p_slug: slug,
          p_admin_user_id: ctx.state.user.id,
        });
        if (dupError) {
          ctx.status = dupError.code === "42501" ? 403 : 400;
          ctx.body = { error: dupError.message ?? "Clone failed" };
          return;
        }
        await audit(ctx.state.user.id, "GAME_CLONE", "qr_game", newId, { source_game_id: id, name, slug });
        const { data: cloneGame } = await admin.from("qr_games").select("*").eq("id", newId).maybeSingle();
        ctx.status = 201;
        ctx.body = { data: cloneGame };
        return;
      default:
        ctx.status = 400;
        ctx.body = { error: `Unknown action: ${action}` };
        return;
    }
    
    const { data, error } = await admin.from("qr_games").update(updateData).eq("id", id).select().maybeSingle();
    if (error) throw error;
    await audit(ctx.state.user.id, auditAction, "qr_game", id, { from: existing.status });
    ctx.body = { data };
  } catch {
    ctx.status = 500;
    ctx.body = { error: "Failed to process lifecycle action" };
  }
});
