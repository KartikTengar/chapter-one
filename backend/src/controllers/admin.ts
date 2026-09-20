import { Router } from "@koa/router";
import { getSupabaseAdmin, requireUser, requireAdmin } from '../services/supabase.js';
import { resolveHiddenTrailGame } from '../services/trail.js';
import { deletePhotoObject, createPhotoSignedUrl } from '../services/photos.js';
import { calculateTrailScore } from '../utils/trail.js';
import { simulateScores, simulateConcurrentPositions, simulateWrongAnswer, simulateWrongTrail, simulateDuplicate, simulateEngagement } from '../utils/simulation.js';

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

export const adminRouter = new Router({ prefix: "/api/v1/admin/hidden-trail" });
adminRouter.use(requireUser(), requireAdmin());

/** GET /api/v1/admin/hidden-trail/participants — current game participant list. */
adminRouter.get("/participants", async (ctx) => {
  try {
    const admin = getAdmin();
    const game = await resolveHiddenTrailGame(admin);

    if (!game) {
      ctx.body = {
        configured: false,
        participants: [],
        pagination: { page: 1, pageSize: 0, total: 0, totalPages: 0, hasMore: false },
      };
      return;
    }

    const page = Math.max(Number(ctx.query.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(ctx.query.pageSize) || 100, 1), 100);
    const branch = typeof ctx.query.branch === "string" ? ctx.query.branch.trim() : undefined;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let participantQuery = admin
      .from("qr_participants")
      .select(
        "game_id, user_id, current_level, total_points, status, started_at, last_scan_at, completed_at, profiles!inner(full_name, email, branch)",
        { count: "exact" }
      )
      .eq("game_id", game.id);

    if (branch) participantQuery = participantQuery.eq("profiles.branch", branch);

    const { data, error, count } = await participantQuery
      .order("total_points", { ascending: false })
      .order("completed_at", { ascending: true, nullsFirst: false })
      .range(from, to);

    if (error) throw error;

    const participants = (data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      const profile = Array.isArray(r.profiles)
        ? (r.profiles[0] as { full_name?: string | null; email?: string | null } | undefined)
        : (r.profiles as { full_name?: string | null; email?: string | null } | undefined);

      return {
        game_id: r.game_id,
        user_id: r.user_id,
        current_level: Number(r.current_level ?? 0),
        total_points: Number(r.total_points ?? 0),
        status: String(r.status ?? "not_started"),
        started_at: r.started_at ?? null,
        last_scan_at: r.last_scan_at ?? null,
        completed_at: r.completed_at ?? null,
        profiles: {
          full_name: profile?.full_name ?? null,
          email: profile?.email ?? null,
          branch: profile?.branch ?? null,
        },
      };
    });

    ctx.body = {
      configured: true,
      participants,
      pagination: {
        page,
        pageSize,
        total: count ?? participants.length,
        totalPages: Math.ceil((count ?? 0) / pageSize),
        hasMore: from + pageSize < (count ?? 0),
      },
    };
  } catch {
    ctx.status = 500;
    ctx.body = { error: "Failed to load participants" };
  }
});

/** GET /api/v1/admin/hidden-trail/photos — moderation queue. */
adminRouter.get("/photos", async (ctx) => {
  try {
    const admin = getAdmin();
    const game = await resolveHiddenTrailGame(admin);
    if (!game) {
      ctx.body = { configured: false, photos: [] };
      return;
    }
    const status = typeof ctx.query.status === "string" ? ctx.query.status : undefined;
    const levelId = typeof ctx.query.level_id === "string" ? ctx.query.level_id : undefined;

    let query = admin
      .from("hidden_trail_photos")
      .select("*, qr_levels(level_number, title), profiles(full_name, email)")
      .eq("game_id", game.id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (status) query = query.eq("moderation_status", status);
    if (levelId) query = query.eq("level_id", levelId);

    const { data, error } = await query;
    if (error) throw error;

    const photos = [];
    for (const row of data ?? []) {
      const r = row as Record<string, unknown>;
      const url = await createPhotoSignedUrl(admin, String(r.storage_path), 3600);
      const profile = Array.isArray(r.profiles)
        ? (r.profiles[0] as { full_name?: string; email?: string })
        : (r.profiles as { full_name?: string; email?: string });
      const level = Array.isArray(r.qr_levels) ? (r.qr_levels[0] as { level_number?: number; title?: string }) : null;
      photos.push({
        id: r.id,
        level_number: level?.level_number ?? null,
        title: level?.title ?? null,
        display_name: profile?.full_name ?? "Anonymous",
        email: profile?.email ?? null,
        capture_stage: r.capture_stage,
        visibility: r.visibility,
        moderation_status: r.moderation_status,
        is_favorite: r.is_favorite,
        created_at: r.created_at,
        url,
      });
    }
    ctx.body = { configured: true, photos };
  } catch {
    ctx.status = 500;
    ctx.body = { error: "Failed to load photos" };
  }
});

/** POST /api/v1/admin/hidden-trail/photos/:id/approve */
adminRouter.post("/photos/:id/approve", async (ctx) => {
  try {
    const admin = getAdmin();
    const photoId = ctx.params.id as string;
    const { data, error } = await admin.from("hidden_trail_photos").update({ moderation_status: "approved", updated_at: new Date().toISOString() }).eq("id", photoId).select().single();
    if (error || !data) {
      ctx.status = 404;
      ctx.body = { error: "Photo not found" };
      return;
    }
    await audit(ctx.state.user.id, "photo_approved", "hidden_trail_photo", photoId, {});
    ctx.body = { ok: true };
  } catch {
    ctx.status = 500;
    ctx.body = { error: "Moderation failed" };
  }
});

/** POST /api/v1/admin/hidden-trail/photos/:id/hide */
adminRouter.post("/photos/:id/hide", async (ctx) => {
  try {
    const admin = getAdmin();
    const photoId = ctx.params.id as string;
    const { data, error } = await admin.from("hidden_trail_photos").update({ moderation_status: "hidden", visibility: "private", updated_at: new Date().toISOString() }).eq("id", photoId).select().single();
    if (error || !data) {
      ctx.status = 404;
      ctx.body = { error: "Photo not found" };
      return;
    }
    await audit(ctx.state.user.id, "photo_hidden", "hidden_trail_photo", photoId, {});
    ctx.body = { ok: true };
  } catch {
    ctx.status = 500;
    ctx.body = { error: "Moderation failed" };
  }
});

/** POST /api/v1/admin/hidden-trail/photos/:id/feature */
adminRouter.post("/photos/:id/feature", async (ctx) => {
  try {
    const admin = getAdmin();
    const photoId = ctx.params.id as string;
    const { data, error } = await admin.from("hidden_trail_photos").update({ visibility: "featured", moderation_status: "approved", updated_at: new Date().toISOString() }).eq("id", photoId).select().single();
    if (error || !data) {
      ctx.status = 404;
      ctx.body = { error: "Photo not found" };
      return;
    }
    await audit(ctx.state.user.id, "photo_featured", "hidden_trail_photo", photoId, {});
    ctx.body = { ok: true };
  } catch {
    ctx.status = 500;
    ctx.body = { error: "Moderation failed" };
  }
});

/** DELETE /api/v1/admin/hidden-trail/photos/:id */
adminRouter.delete("/photos/:id", async (ctx) => {
  try {
    const admin = getAdmin();
    const photoId = ctx.params.id as string;
    const { data: existing } = await admin.from("hidden_trail_photos").select("storage_path").eq("id", photoId).maybeSingle();
    if (!existing) {
      ctx.status = 404;
      ctx.body = { error: "Photo not found" };
      return;
    }
    const { error: delError } = await admin.from("hidden_trail_photos").delete().eq("id", photoId);
    if (delError) {
      ctx.status = 500;
      ctx.body = { error: "Delete failed" };
      return;
    }
    try {
      await deletePhotoObject(admin, (existing as { storage_path: string }).storage_path);
    } catch {
      ctx.body = { ok: true, storage_warning: "Storage cleanup needs attention" };
      return;
    }
    await audit(ctx.state.user.id, "photo_deleted", "hidden_trail_photo", photoId, {});
    ctx.body = { ok: true };
  } catch {
    ctx.status = 500;
    ctx.body = { error: "Delete failed" };
  }
});

/** GET /api/v1/admin/hidden-trail/simulation — test-only, never writes. */
adminRouter.get("/simulation", async (ctx) => {
  const count = Math.min(Math.max(Number(ctx.query.count) || 20, 1), 100);
  ctx.body = {
    simulation: true,
    label: "SIMULATION — NOT REAL DATA",
    scores: simulateScores(count),
    concurrency: simulateConcurrentPositions(10),
    wrong_answer: simulateWrongAnswer(),
    wrong_trail: simulateWrongTrail(),
    duplicate: simulateDuplicate(),
    engagement: simulateEngagement(),
    scoring_note: `points = max(30, 100 - n(n-1))`,
  };
});

export { calculateTrailScore };