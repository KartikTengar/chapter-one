import { Router } from "@koa/router";
import multer from "@koa/multer";
import { z } from "zod";
import { getSupabaseAdmin, requireUser } from '../services/supabase.js';
import { resolveHiddenTrailGame } from '../services/trail.js';
import {
  PHOTO_BUCKET,
  validateAndOptimizeImage,
  buildStoragePath,
  uploadPhoto,
  deletePhotoObject,
  createPhotoSignedUrl,
} from '../services/photos.js';

function getAdmin() {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase admin client not configured");
  return admin;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024, files: 1 },
});

const photoMetaSchema = z.object({
  level_id: z.string().uuid(),
  capture_stage: z.enum(["before_answer", "after_completion"]).optional(),
  visibility: z.enum(["private", "gallery", "featured"]).optional(),
  consent: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => v === true || v === "true"),
});

export const photoRouter = new Router({ prefix: "/api/v1/trail" });
photoRouter.use(requireUser());

/** GET /api/v1/trail/album — owner's photos with signed URLs. */
photoRouter.get("/album", async (ctx) => {
  const admin = getAdmin();
  const userId = ctx.state.user.id as string;
  const game = await resolveHiddenTrailGame(admin);
  if (!game) {
    ctx.body = { configured: false, photos: [] };
    return;
  }

  const { data, error } = await admin
    .from("hidden_trail_photos")
    .select("*, qr_levels(level_number, title)")
    .eq("game_id", game.id)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) {
    ctx.status = 500;
    ctx.body = { error: { code: "ALBUM_FAILED", message: "Could not load your album." } };
    return;
  }

  const photos = [];
  for (const row of data ?? []) {
    const r = row as Record<string, unknown>;
    const url = await createPhotoSignedUrl(admin, String(r.storage_path), 3600);
    photos.push({
      id: r.id,
      level_id: r.level_id,
      level_number: (r.qr_levels as Array<{ level_number: number }> | null)?.[0]?.level_number ?? null,
      title: (r.qr_levels as Array<{ title: string }> | null)?.[0]?.title ?? null,
      capture_stage: r.capture_stage,
      visibility: r.visibility,
      moderation_status: r.moderation_status,
      is_favorite: r.is_favorite,
      created_at: r.created_at,
      url,
    });
  }

  ctx.body = { configured: true, photos };
});

/** POST /api/v1/trail/photo — multipart upload. */
photoRouter.post("/photo", upload.single("file"), async (ctx) => {
  const admin = getAdmin();
  const userId = ctx.state.user.id as string;

  const file = (ctx.request as unknown as { file?: { buffer: Buffer; mimetype: string; originalname: string } }).file;
  if (!file) {
    ctx.status = 400;
    ctx.body = { error: { code: "PHOTO_REQUIRED", message: "No image was provided." } };
    return;
  }

  const body = (ctx.request.body ?? {}) as Record<string, unknown>;
  const meta = photoMetaSchema.safeParse({
    level_id: body.level_id,
    capture_stage: body.capture_stage,
    visibility: body.visibility,
    consent: body.consent,
  });
  if (!meta.success) {
    ctx.status = 400;
    ctx.body = { error: { code: "VALIDATION_FAILED", message: "Missing or invalid photo metadata." } };
    return;
  }

  const game = await resolveHiddenTrailGame(admin);
  if (!game) {
    ctx.status = 404;
    ctx.body = { error: { code: "GAME_NOT_CONFIGURED", message: "Hidden Trail isn't configured yet." } };
    return;
  }

  if (game.photo_feature_enabled === false) {
    ctx.status = 403;
    ctx.body = { error: { code: "PHOTO_DISABLED", message: "Photo moments are disabled." } };
    return;
  }

  // Verify the level belongs to the active game.
  const { data: level } = await admin
    .from("qr_levels")
    .select("id")
    .eq("id", meta.data.level_id)
    .eq("game_id", game.id)
    .maybeSingle();
  if (!level) {
    ctx.status = 400;
    ctx.body = { error: { code: "VALIDATION_FAILED", message: "Marker not found for this game." } };
    return;
  }

  const validation = await validateAndOptimizeImage(file.buffer, file.mimetype);
  if (!validation.ok) {
    ctx.status = 400;
    ctx.body = { error: { code: validation.code, message: validation.message } };
    return;
  }

  const path = buildStoragePath(game.id, userId, meta.data.level_id);
  try {
    await uploadPhoto(admin, validation.optimized, path);
  } catch {
    ctx.status = 500;
    ctx.body = { error: { code: "PHOTO_UPLOAD_FAILED", message: "Could not save your photo." } };
    return;
  }

  const visibility = meta.data.visibility ?? "private";
  const consent = meta.data.consent || visibility !== "private";
  const moderation = visibility === "private" ? "approved" : "pending";

  const { data: inserted, error: insertError } = await admin
    .from("hidden_trail_photos")
    .insert({
      game_id: game.id,
      level_id: meta.data.level_id,
      user_id: userId,
      storage_path: path,
      capture_stage: meta.data.capture_stage ?? "after_completion",
      visibility,
      moderation_status: moderation,
      photo_consent_granted: consent,
    })
    .select()
    .single();

  if (insertError) {
    // Best-effort cleanup so we don't leave an orphaned object.
    try {
      await deletePhotoObject(admin, path);
    } catch {
      // ignore cleanup failure
    }
    ctx.status = 500;
    ctx.body = { error: { code: "PHOTO_UPLOAD_FAILED", message: "Could not save your photo." } };
    return;
  }

  const url = await createPhotoSignedUrl(admin, path, 3600);
  ctx.status = 201;
  ctx.body = {
    photo: {
      id: inserted.id,
      level_id: inserted.level_id,
      capture_stage: inserted.capture_stage,
      visibility: inserted.visibility,
      moderation_status: inserted.moderation_status,
      is_favorite: inserted.is_favorite,
      url,
    },
  };
});

/** PATCH /api/v1/trail/photo/:id — owner updates visibility/favorite. */
photoRouter.patch("/photo/:id", async (ctx) => {
  const admin = getAdmin();
  const userId = ctx.state.user.id as string;
  const photoId = ctx.params.id as string;

  const body = z
    .object({
      visibility: z.enum(["private", "gallery", "featured"]).optional(),
      is_favorite: z.boolean().optional(),
      consent: z.boolean().optional(),
    })
    .safeParse(ctx.request.body);
  if (!body.success) {
    ctx.status = 400;
    ctx.body = { error: { code: "VALIDATION_FAILED", message: "Invalid photo update." } };
    return;
  }

  const { data: existing } = await admin.from("hidden_trail_photos").select("*").eq("id", photoId).maybeSingle();
  if (!existing || (existing as { user_id: string }).user_id !== userId) {
    ctx.status = 404;
    ctx.body = { error: { code: "PHOTO_NOT_FOUND", message: "Photo not found." } };
    return;
  }

  const updates: Record<string, unknown> = {};
  if (body.data.visibility !== undefined) {
    updates.visibility = body.data.visibility;
    // A non-private visibility requires consent.
    if (body.data.visibility !== "private") updates.photo_consent_granted = true;
    if (body.data.consent === false) updates.visibility = "private";
  }
  if (body.data.is_favorite !== undefined) {
    if (body.data.is_favorite) {
      // Clear any previous favorite for this participant/game first.
      const gameId = (existing as { game_id: string }).game_id;
      await admin
        .from("hidden_trail_photos")
        .update({ is_favorite: false })
        .eq("game_id", gameId)
        .eq("user_id", userId)
        .neq("id", photoId);
      updates.is_favorite = true;
    } else {
      updates.is_favorite = false;
    }
  }

  const { data: updated, error } = await admin
    .from("hidden_trail_photos")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", photoId)
    .select()
    .single();
  if (error) {
    ctx.status = 500;
    ctx.body = { error: { code: "PHOTO_UPDATE_FAILED", message: "Could not update your photo." } };
    return;
  }

  const url = await createPhotoSignedUrl(admin, updated.storage_path, 3600);
  ctx.body = {
    photo: {
      id: updated.id,
      visibility: updated.visibility,
      moderation_status: updated.moderation_status,
      is_favorite: updated.is_favorite,
      url,
    },
  };
});

/** DELETE /api/v1/trail/photo/:id — owner or admin. */
photoRouter.delete("/photo/:id", async (ctx) => {
  const admin = getAdmin();
  const user = ctx.state.user as { id: string; email: string; role: string };
  const photoId = ctx.params.id as string;

  const { data: existing } = await admin.from("hidden_trail_photos").select("*").eq("id", photoId).maybeSingle();
  if (!existing) {
    ctx.status = 404;
    ctx.body = { error: { code: "PHOTO_NOT_FOUND", message: "Photo not found." } };
    return;
  }
  const row = existing as { user_id: string; storage_path: string };
  const isAdmin = user.role === "admin";
  if (!isAdmin && row.user_id !== user.id) {
    ctx.status = 403;
    ctx.body = { error: { code: "FORBIDDEN", message: "You can only delete your own photos." } };
    return;
  }

  const { error: delError } = await admin.from("hidden_trail_photos").delete().eq("id", photoId);
  if (delError) {
    ctx.status = 500;
    ctx.body = { error: { code: "PHOTO_DELETE_FAILED", message: "Could not delete your photo." } };
    return;
  }

  try {
    await deletePhotoObject(admin, row.storage_path);
  } catch {
    // DB row removed; storage object cleanup failure is surfaced, not silent.
    ctx.body = { deleted: true, storage_warning: "Photo record removed but storage cleanup needs attention." };
    return;
  }

  ctx.body = { deleted: true };
});

export { PHOTO_BUCKET };