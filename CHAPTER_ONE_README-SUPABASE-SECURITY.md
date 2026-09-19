# CHAPTER ONE - Supabase Security & Database Integrity

## Overview
Security model for CHAPTER ONE Phase 5: Supabase schema hardening, Row Level Security defense-in-depth, function hardening, and constraint enforcement without destroying existing data.

**Principles**
- Never DROP tables in production; only additive changes.
- Signup role is always `student`. No `raw_user_meta_data` role escalation.
- Admin promotion only via trusted DB operation or service role.
- All `SECURITY DEFINER` functions owned by `postgres`, `search_path = ''`, revoked from PUBLIC, execute granted only to `authenticated`.
- RLS enabled on all user-facing tables. Centralized admin check via `public.is_profile_admin()`.
- Defense in depth: column-level grants, identity/role guard trigger, CHECK constraints, unique constraints.

## Authentication & Profiles

### `public.profiles`
- PK `id UUID REFERENCES auth.users(id) ON DELETE CASCADE`
- `role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student','admin'))`
- RLS enabled.
- Grants: `SELECT` to `authenticated`; `UPDATE (full_name,email,avatar_url,college_id,year,branch,phone)` to `authenticated`.
- No `INSERT/UPDATE/DELETE` for `anon/authenticated/public`.
- Auto-creation via `public.handle_new_user()` trigger on `auth.users INSERT`.
  - `SECURITY DEFINER`, owner `postgres`, `search_path=''`, revoked from PUBLIC.
  - Hard-codes role `'student'`, ignores any role passed in `raw_user_meta_data`.
- Identity/role guard trigger `profiles_identity_role_guard` on UPDATE raises `42501` if `id` or `role` changes by non-trusted operation.
- Policies:
  - Students can read own profile.
  - Students can update own profile.
  - Admins can read all profiles via `is_profile_admin()`.
  - Admins can update any profile via `is_profile_admin()`.

### Admin detection
`public.is_profile_admin()` - `SQL STABLE SECURITY DEFINER`, `search_path=''`, `row_security=off`, owner `postgres`, `REVOKE ALL` from PUBLIC, `GRANT EXECUTE TO authenticated`.
Returns `EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')`.

## Events & Registrations

### `public.events`
- RLS enabled.
- Anyone can SELECT.
- Admin CRUD via `is_profile_admin()`.

### `public.event_registrations`
- `UNIQUE (user_id, event_id)`
- RLS enabled.
- Students can INSERT own (`auth.uid() = user_id`).
- Students can SELECT own.
- Students can DELETE own - policy "Students can cancel own registration".
- Admins can SELECT/DELETE all via `is_profile_admin()`.

## Hidden Trail - QR Game Schema

### Core tables
- `qr_games`, `qr_levels`, `qr_participants`, `qr_completions`, `qr_scan_logs`, `qr_admin_audit`, `achievements`, `user_achievements`
- RLS enabled on all.
- `qr_games.status CHECK IN ('draft','active','paused','ended')`
- `qr_games.leaderboard_name_mode CHECK IN (...)`
- `qr_levels.game_id` FK cascade, `token TEXT NOT NULL UNIQUE`, `UNIQUE (game_id, level_number)`
- `qr_participants` PK `(game_id, user_id)`, `status CHECK IN ('not_started','active','completed')`
- `qr_completions` `UNIQUE (game_id, level_id, user_id)`

### Policies
- Games: students can read active games; admins manage all via `is_profile_admin()`.
- Levels: students can read active levels for active games; admins manage all.
- Participants: students read own, admins manage all.
- Completions: students read own, admins manage all.
- Scan logs: students insert/read own; admins manage all.
- Admin audit: admins manage all.

### Secure game functions
All `SECURITY DEFINER`, owner `postgres`, `search_path=''`, revoke from PUBLIC, grant execute to `authenticated`.

- `public.start_qr_participant(p_game_id UUID, p_user_id UUID)` - creates/updates participant safely.
- `public.validate_qr_token(p_token TEXT, p_user_id UUID)` - validates token, game active, expected level, duplicate.
- `public.process_qr_answer(p_token TEXT, p_user_id UUID, p_answer TEXT)` - hashes answer, allocates scanner position atomically, creates completion, updates participant.
- `public.hash_answer(answer TEXT)` - SHA-256 helper, immutable SQL.

### Constraints added in Phase 5 hardening
- `qr_scan_logs.result CHECK IN ('success','duplicate','wrong_level','invalid_token','game_inactive','answer_incorrect')`
- `qr_completions.scanner_position CHECK >= 0`
- `qr_games.time_check` ensures `end_at >= start_at` when both present.

## Storage

Intended policy for `event-covers` bucket:
- Public read.
- Write restricted to admins via `is_profile_admin()` check in storage RLS.
- No migration file present yet; must be applied manually in Supabase Storage Policies UI or via `supabase/migrations`.

## Row Level Security Checklist

- [x] `profiles` RLS enabled, column-level grants, identity guard
- [x] `events` RLS enabled, public read, admin write
- [x] `event_registrations` RLS enabled, unique constraint, student cancel
- [x] `qr_games` RLS enabled, active filter for students
- [x] `qr_levels` RLS enabled
- [x] `qr_participants` RLS enabled
- [x] `qr_completions` RLS enabled
- [x] `qr_scan_logs` RLS enabled, result CHECK
- [x] `qr_admin_audit` RLS enabled, admin only
- [x] All `SECURITY DEFINER` functions hardened

## Migration Workflow

- All changes additive. Use `IF NOT EXISTS` checks for constraints.
- Never run `DROP TABLE`/`DROP COLUMN` on production.
- Test migrations on a copy first.
- Document each migration with purpose, risk, rollback.

## Known Limitations / TODO

- `hash_answer` uses `pgcrypto` digest; ensure extension enabled.
- Test data in `migration_hidden_trail.sql` contains dummy hashes - remove before prod.
- `qr_participants` UPDATE policy allows all columns; consider RPC-only updates.
- Storage RLS not yet migrated into version control.

## References

- `database/migration.sql`
- `database/migration_rls_cancel.sql`
- `database/migration_hidden_trail.sql`
- `database/migration_auth_role_hardening.sql`
- `database/migration_phase5_hardening.sql`
