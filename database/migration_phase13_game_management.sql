-- ============================================================
-- PHASE 13 — GAME MANAGEMENT LIFECYCLE
-- CHAPTER ONE — Supabase
-- SAFE ADDITIVE ONLY — NO DROP / NO DATA LOSS / NO RESET
-- ============================================================
-- Adds the minimal columns needed for multi-instance Hidden Trail
-- management (create / configure / readiness / lifecycle / clone /
-- delete) on top of the existing `qr_games` table.
--
-- The existing real event game is NOT touched. Its slug stays
-- 'hidden-trail' and its is_current flag is set TRUE by backfill.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. LIFE-CYCLE STATE MACHINE
--    draft -> ready -> running -> paused -> ended -> archived
--    The existing CHECK only allowed ('draft','active','paused','ended').
--    We widen it once, additively, and backfill 'active' -> 'running'.
-- ------------------------------------------------------------

ALTER TABLE public.qr_games
  DROP CONSTRAINT IF EXISTS qr_games_status_check;

ALTER TABLE public.qr_games
  ADD CONSTRAINT qr_games_status_check
  CHECK (status IN ('draft', 'ready', 'running', 'paused', 'ended', 'archived'));

-- Migrate the existing live game to the canonical 'running' status.
UPDATE public.qr_games
SET status = 'running'
WHERE status = 'active';

-- ------------------------------------------------------------
-- 2. INSTANCE CLASSIFICATION
--    game_type      : canonical type slug ('hidden-trail').
--    is_current     : explicit "this is the game students should
--                     discover" flag. At most one TRUE per type.
--    archived_at    : when the game was archived (lifecycle audit).
--    clone_of_game_id : optional provenance for duplicated games.
-- ------------------------------------------------------------

ALTER TABLE public.qr_games
  ADD COLUMN IF NOT EXISTS game_type TEXT NOT NULL DEFAULT 'hidden-trail',
  ADD COLUMN IF NOT EXISTS is_current BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS clone_of_game_id UUID NULL REFERENCES public.qr_games(id) ON DELETE SET NULL;

-- Backfill the existing real event game as the canonical current game.
UPDATE public.qr_games
SET game_type = 'hidden-trail',
    is_current = TRUE
WHERE (slug = 'hidden-trail' OR slug IS NULL OR slug = '')
  AND is_current IS FALSE;

-- Enforce at-most-one current game per type (partial unique index).
CREATE UNIQUE INDEX IF NOT EXISTS idx_qr_games_current_per_type
  ON public.qr_games (game_type)
  WHERE is_current = TRUE;

-- ------------------------------------------------------------
-- 3. READINESS SNAPSHOT
--    cached readiness payload + timestamp so the admin UI can show
--    the last check result without re-running validation on every
--    render. Written only by the readiness action.
-- ------------------------------------------------------------

ALTER TABLE public.qr_games
  ADD COLUMN IF NOT EXISTS readiness JSONB NULL,
  ADD COLUMN IF NOT EXISTS readiness_checked_at TIMESTAMPTZ NULL;

-- ------------------------------------------------------------
-- 4. RLS: admins can manage all game lifecycle columns.
--    The existing policy already grants admins FULL control; this
--    section only re-states it idempotently for clarity.
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can manage games" ON public.qr_games;
CREATE POLICY "Admins can manage games"
  ON public.qr_games
  FOR ALL
  USING ((SELECT public.is_profile_admin()))
  WITH CHECK ((SELECT public.is_profile_admin()));

COMMIT;