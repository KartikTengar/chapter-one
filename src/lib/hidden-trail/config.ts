export const HIDDEN_TRAIL_SLUG = "hidden-trail" as const;

/**
 * LEGACY — do not rely on this hard-coded UUID as the source of truth.
 *
 * The Hidden Trail game must be resolved by its canonical slug
 * (`HIDDEN_TRAIL_SLUG`) so the system works regardless of which
 * database row actually exists. This constant is retained only as a
 * backward-compatible fallback for databases seeded before the `slug`
 * column was added.
 */
export const HIDDEN_TRAIL_GAME_ID = "00000000-0000-0000-0000-000000000001" as const;