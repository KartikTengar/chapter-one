import { Router } from "@koa/router";
import { getSupabaseAdmin } from '../services/supabase.js';
import { resolveHiddenTrailGame } from '../services/trail.js';
import { deriveDisplayName } from '../utils/trail.js';
import { createPhotoSignedUrl } from '../services/photos.js';
function getAdmin() {
    const admin = getSupabaseAdmin();
    if (!admin)
        throw new Error("Supabase admin client not configured");
    return admin;
}
export const galleryRouter = new Router({ prefix: "/api/v1/gallery" });
/**
 * GET /api/v1/gallery/hidden-trail
 * Public gallery — approved + gallery/featured visibility only.
 * No user ids, emails, storage paths, or moderation fields are exposed.
 */
galleryRouter.get("/hidden-trail", async (ctx) => {
    try {
        const admin = getAdmin();
        const game = await resolveHiddenTrailGame(admin);
        if (!game) {
            ctx.body = { configured: false, photos: [] };
            return;
        }
        if (game.gallery_enabled === false) {
            ctx.body = { configured: true, gallery_enabled: false, photos: [] };
            return;
        }
        const { data, error } = await admin
            .from("hidden_trail_photos")
            .select(`
        id,
        user_id,
        level_id,
        storage_path,
        created_at,
        visibility,
        qr_levels(level_number)
      `)
            .eq("game_id", game.id)
            .eq("moderation_status", "approved")
            .in("visibility", ["gallery", "featured"])
            .order("created_at", { ascending: false })
            .limit(120);
        if (error) {
            ctx.status = 500;
            ctx.body = { error: "Failed to load gallery" };
            return;
        }
        const mode = (game.leaderboard_name_mode ?? "FIRST_NAME");
        const photos = [];
        for (const row of data ?? []) {
            const r = row;
            const url = await createPhotoSignedUrl(admin, r.storage_path, 900);
            if (!url)
                continue;
            const { data: profile } = await admin.from("profiles").select("full_name").eq("id", r.user_id).maybeSingle();
            photos.push({
                id: r.id,
                url,
                display_name: deriveDisplayName(profile?.full_name, mode),
                level: r.qr_levels?.[0]?.level_number ?? null,
                visibility: r.visibility,
                created_at: r.created_at,
            });
        }
        ctx.body = { configured: true, gallery_enabled: true, photos };
    }
    catch {
        ctx.status = 500;
        ctx.body = { error: "Failed to load gallery" };
    }
});
//# sourceMappingURL=gallery.js.map