# CHAPTER ONE — Database Migrations

Apply migrations in the order listed. Each file is additive-only (no `DROP TABLE`,
no `TRUNCATE`, no data loss). Run them via the Supabase SQL editor or a migrations
tool against the target project.

## Migration order

1. `database/migration.sql` — base schema (profiles, events, event_registrations, auth triggers, RLS).
2. `database/migration_auth_role_hardening.sql` — harden `handle_new_user` (role always `student`),
   add `is_profile_admin()`, guard role/id changes on `profiles`.
3. `database/migration_hidden_trail.sql` — Hidden Trail functions (`hash_answer`,
   `start_qr_participant`, `validate_qr_token`, `process_qr_answer`) and initial seed.
4. `database/migration_phase5_hardening.sql` — schema/function hardening, RLS via centralized admin check.
5. `database/migration_phase5b_live_reconciliation.sql` — reconcile admin helper + Hidden Trail tables/RLS/functions.
6. `database/migration_phase6_events_extension.sql` — `events.featured`, `registration_open`, `ends_at`.
7. `database/migration_phase8_games.sql` — generic `games` registry + seed `hidden-trail` slug row.
8. `database/migration_phase9_leaderboard.sql` — `game_results` table + `hidden_trail_results` view.
9. `database/migration_rls_cancel.sql` — allow students to cancel own registrations.
10. **`database/migration_phase10_hidden_trail_expansion.sql`** — canonical `qr_games.slug`,
    `hidden_trail_photos` table + RLS, achievement definitions, audit index, and redefined
    functions returning the answer riddle text (not the answer hash) to players.
11. **`database/migration_phase11_koa_photo_realtime.sql`** — grants `service_role` EXECUTE on the
    trail functions (Koa is the sole caller), additive feature flags on `qr_games`
    (`photo_feature_enabled`, `gallery_enabled`, `live_display_enabled`, `photo_consent_text`),
    and the `photo_consent_granted` column.
12. **`database/migration_phase12_fix_function_ambiguity.sql`** — fixes `validate_qr_token` /
    `process_qr_answer` runtime issues discovered during live QA: column-name ambiguity (42702),
    0-based scanner positions, missing `RETURN NEXT` (empty result sets), duplicate-vs-wrong-trail
    precedence, and `hash_answer` search_path so `digest()` (in the `extensions` schema) resolves.

## Phase 10 highlights

- Adds `qr_games.slug` and backfills existing rows to `hidden-trail`. Code now resolves the
  Hidden Trail game by this slug instead of a hard-coded UUID.
- Creates the private `hidden_trail_photos` table (one optional photo per participant per marker)
  with owner/admin RLS and a single-favorite constraint.
- Seeds stable achievement definitions (no fake participant data).
- Redefines `validate_qr_token` / `process_qr_answer` to return `answer_riddle` (the question)
  instead of `answer_riddle_hash`. The canonical answer and its hash are never returned to players.

## Verifying

- Confirm `qr_games` has a `slug` column and exactly one row with `slug = 'hidden-trail'`.
- Confirm `hidden_trail_photos` exists with RLS enabled and the `hidden-trail-photos` bucket
  configured in Storage (see `docs/hidden-trail-storage.md`).
- Confirm `public.is_profile_admin()` exists and `handle_new_user()` always assigns `role = 'student'`.

> Never drop or truncate production tables. Phase 10 is additive only.