import { HIDDEN_TRAIL_SLUG } from "./config.js";
export const HIDDEN_TRAIL_SLUG_NAME = HIDDEN_TRAIL_SLUG;
/** Resolve the canonical Hidden Trail game by slug. Returns null if not configured. */
export async function resolveHiddenTrailGame(supabase) {
    const { data, error } = await supabase
        .from("qr_games")
        .select("*")
        .eq("slug", HIDDEN_TRAIL_SLUG)
        .maybeSingle();
    if (error)
        throw error;
    return data ?? null;
}
export async function getParticipant(supabase, gameId, userId) {
    const { data, error } = await supabase
        .from("qr_participants")
        .select("*")
        .eq("game_id", gameId)
        .eq("user_id", userId)
        .maybeSingle();
    if (error)
        throw error;
    return data ?? null;
}
export async function getProfile(supabase, userId) {
    const { data, error } = await supabase
        .from("profiles")
        .select("full_name, email, college_id")
        .eq("id", userId)
        .maybeSingle();
    if (error)
        throw error;
    return data ?? null;
}
export async function logScan(supabase, gameId, userId, result, levelId) {
    const insert = { game_id: gameId, user_id: userId, result };
    if (levelId)
        insert.level_id = levelId;
    await supabase.from("qr_scan_logs").insert(insert);
}
/**
 * Publish a sanitized completion event to the public Realtime channel.
 * Best-effort: never throws — the database is the authority.
 */
export async function publishCompletion(supabase, payload) {
    try {
        const channel = supabase.channel("hidden_trail");
        await channel.send({
            type: "broadcast",
            event: "hidden_trail.completion",
            payload,
        });
        await channel.unsubscribe();
    }
    catch {
        // Realtime publication failure must never roll back a committed completion.
    }
}
//# sourceMappingURL=trail.js.map