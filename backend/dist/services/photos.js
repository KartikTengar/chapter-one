import sharp from "sharp";
import { randomUUID } from "crypto";
export const PHOTO_BUCKET = "hidden-trail-photos";
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_DIMENSION = 1800;
/** Validate MIME, size, and real file signature (via sharp). */
export async function validateAndOptimizeImage(buffer, mimetype) {
    if (!ALLOWED_MIMES.has(mimetype ?? "")) {
        return { ok: false, code: "PHOTO_TYPE_UNSUPPORTED", message: "Only JPEG, PNG and WebP images are allowed." };
    }
    if (buffer.byteLength > MAX_PHOTO_BYTES) {
        return { ok: false, code: "PHOTO_TOO_LARGE", message: "Image is larger than 5 MB." };
    }
    let image;
    try {
        image = sharp(buffer);
        const meta = await image.metadata();
        const width = meta.width ?? 0;
        const height = meta.height ?? 0;
        if (width > 8000 || height > 8000) {
            return { ok: false, code: "PHOTO_TYPE_UNSUPPORTED", message: "Image dimensions are too large." };
        }
        const optimized = await image
            .rotate()
            .resize({ width: Math.min(width, MAX_DIMENSION), height: Math.min(height, MAX_DIMENSION), fit: "inside", withoutEnlargement: true })
            .toFormat("webp", { quality: 82 })
            .toBuffer();
        return { ok: true, optimized, width, height };
    }
    catch {
        return { ok: false, code: "PHOTO_TYPE_UNSUPPORTED", message: "File is not a valid image." };
    }
}
/** Build a server-controlled storage path. */
export function buildStoragePath(gameId, userId, levelId) {
    return `hidden-trail/${gameId}/${userId}/${levelId}/${randomUUID()}.webp`;
}
export async function uploadPhoto(supabase, buffer, path) {
    const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, buffer, {
        contentType: "image/webp",
        upsert: false,
    });
    if (error)
        throw error;
    return path;
}
export async function deletePhotoObject(supabase, path) {
    const { error } = await supabase.storage.from(PHOTO_BUCKET).remove([path]);
    if (error)
        throw error;
}
export async function createPhotoSignedUrl(supabase, path, expiresIn = 3600) {
    const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path, expiresIn);
    if (error || !data)
        return null;
    return data.signedUrl;
}
export function isAdmin(user, configuredAdminEmail) {
    return user.role === "admin" || (!!configuredAdminEmail && user.email === configuredAdminEmail);
}
//# sourceMappingURL=photos.js.map