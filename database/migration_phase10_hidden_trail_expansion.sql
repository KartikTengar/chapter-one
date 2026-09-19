-- ============================================================
-- PHASE 10 — HIDDEN TRAIL EXPANSION
-- CHAPTER ONE — Supabase
-- SAFE ADDITIVE ONLY — NO DROP / NO DATA LOSS
-- ============================================================
-- 1. Canonical game lookup: add `slug` to qr_games
-- 2. Photo system foundation: hidden_trail_photos table
-- 3. Achievement definitions seed
-- 4. Supporting indexes + RLS
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. CANONICAL GAME LOOKUP BY SLUG
--    Eliminates reliance on a hard-coded game UUID.
--    Code should resolve the Hidden Trail game via slug.
-- ------------------------------------------------------------

ALTER TABLE public.qr_games
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- Backfill existing rows (including the seeded/test game) to the canonical slug.
UPDATE public.qr_games
SET slug = 'hidden-trail'
WHERE slug IS NULL OR slug = '';

-- Only one active Hidden Trail game should carry the canonical slug.
CREATE UNIQUE INDEX IF NOT EXISTS idx_qr_games_slug
  ON public.qr_games (slug)
  WHERE slug IS NOT NULL;

-- ------------------------------------------------------------
-- 2. PHOTO SYSTEM FOUNDATION
--    One optional participant photo per marker.
--    Soft presence signal only — never authoritative proof.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.hidden_trail_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.qr_games(id) ON DELETE CASCADE,
  level_id UUID NOT NULL REFERENCES public.qr_levels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  capture_stage TEXT NOT NULL DEFAULT 'after_completion'
    CHECK (capture_stage IN ('before_answer','after_completion')),
  visibility TEXT NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private','gallery','featured')),
  moderation_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (moderation_status IN ('pending','approved','hidden','rejected')),
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT hidden_trail_photos_game_level_user_unique UNIQUE (game_id, level_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_hidden_trail_photos_game_id ON public.hidden_trail_photos(game_id);
CREATE INDEX IF NOT EXISTS idx_hidden_trail_photos_user_id ON public.hidden_trail_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_hidden_trail_photos_level_id ON public.hidden_trail_photos(level_id);
CREATE INDEX IF NOT EXISTS idx_hidden_trail_photos_moderation ON public.hidden_trail_photos(moderation_status);
CREATE INDEX IF NOT EXISTS idx_hidden_trail_photos_visibility ON public.hidden_trail_photos(visibility);

-- Enforce a single favorite per participant album.
CREATE UNIQUE INDEX IF NOT EXISTS idx_hidden_trail_photos_one_favorite
  ON public.hidden_trail_photos (user_id, game_id)
  WHERE is_favorite = TRUE;

ALTER TABLE public.hidden_trail_photos ENABLE ROW LEVEL SECURITY;

-- Owner can read own photos and update visibility/moderation of own album.
CREATE POLICY "Owners can read own trail photos"
  ON public.hidden_trail_photos
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can insert own trail photos"
  ON public.hidden_trail_photos
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update own trail photos"
  ON public.hidden_trail_photos
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can manage all trail photos.
CREATE POLICY "Admins can manage trail photos"
  ON public.hidden_trail_photos
  FOR ALL TO authenticated
  USING (public.is_profile_admin())
  WITH CHECK (public.is_profile_admin());

-- Public may read approved gallery photos (safe fields only via API;
-- raw storage access remains private/bucketed server-side).
CREATE POLICY "Public can read approved gallery photos"
  ON public.hidden_trail_photos
  FOR SELECT
  USING (moderation_status = 'approved' AND visibility IN ('gallery','featured'));

-- ------------------------------------------------------------
-- 3. ACHIEVEMENT DEFINITIONS (idempotent seed)
--    Definitions only — no fake participant data.
-- ------------------------------------------------------------

INSERT INTO public.achievements (code, name, description, icon, is_active) VALUES
  ('FIRST_BLOOD',    'First Blood',     'First successful completion by any participant', '⚡', TRUE),
  ('PERFECT_TRAIL',  'Perfect Trail',   'Complete all levels with no wrong answers',      '✨', TRUE),
  ('EXPLORER',       'Explorer',        'Complete 10 / 10 markers',                       '🧭', TRUE),
  ('PHOTO_HUNTER',   'Photo Hunter',    'Capture photos at 5 markers',                    '📸', TRUE),
  ('TRAIL_BLAZER',   'Trail Blazer',    'Reach a configured streak threshold',            '🔥', TRUE),
  ('FINISHER',       'Finisher',        'Complete the entire trail',                      '🏁', TRUE),
  ('MOMENT_MAKER',   'Moment Maker',    'Save a favorite moment',                         '💛', TRUE)
ON CONFLICT (code) DO NOTHING;

-- ------------------------------------------------------------
-- 4. AUDIT INDEX
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_qr_admin_audit_created_at ON public.qr_admin_audit(created_at DESC);

-- ------------------------------------------------------------
-- 5. ANSWER RIDDLE TEXT FOR PLAYERS
--    The previous implementation returned only `answer_riddle_hash`
--    (a hash of the answer), which is useless for display and an
--    unnecessary answer-leak risk. Redefine the secure SECURITY
--    DEFINER functions to return the *answer riddle* (the question)
--    to the authenticated player instead. The canonical answer and
--    its hash are never returned.
-- ------------------------------------------------------------

-- The return table changes (answer_riddle replaces answer_riddle_hash), so the
-- functions must be dropped before recreation.

DROP FUNCTION IF EXISTS public.validate_qr_token(TEXT, UUID);

CREATE FUNCTION public.validate_qr_token(p_token TEXT, p_user_id UUID)
RETURNS TABLE (
  game_id UUID,
  level_id UUID,
  level_number INTEGER,
  is_valid BOOLEAN,
  is_expected_level BOOLEAN,
  is_duplicate BOOLEAN,
  game_status TEXT,
  current_level INTEGER,
  total_points INTEGER,
  location_riddle TEXT,
  answer_riddle TEXT,
  case_sensitive BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  v_participant RECORD;
  v_level RECORD;
  v_game RECORD;
  v_expected_level INTEGER;
  v_completion_count INTEGER;
BEGIN
  game_id := NULL; level_id := NULL; level_number := NULL;
  is_valid := FALSE; is_expected_level := FALSE; is_duplicate := FALSE;
  game_status := NULL; current_level := NULL; total_points := NULL;
  location_riddle := NULL; answer_riddle := NULL; case_sensitive := FALSE;
  error_message := NULL;

  SELECT * INTO v_level FROM public.qr_levels WHERE token = p_token AND is_active = TRUE;
  IF NOT FOUND THEN error_message := 'Invalid or inactive QR token'; RETURN; END IF;

  SELECT * INTO v_game FROM public.qr_games WHERE id = v_level.game_id;
  IF NOT FOUND THEN error_message := 'Game not found'; RETURN; END IF;

  IF v_game.status <> 'active' OR (v_game.start_at IS NOT NULL AND v_game.start_at > NOW()) OR (v_game.end_at IS NOT NULL AND v_game.end_at < NOW()) THEN
    error_message := 'Game is not active'; game_status := v_game.status; RETURN;
  END IF;

  SELECT * INTO v_participant FROM public.qr_participants WHERE game_id = v_level.game_id AND user_id = p_user_id;
  IF NOT FOUND THEN
    PERFORM public.start_qr_participant(v_level.game_id, p_user_id);
    SELECT * INTO v_participant FROM public.qr_participants WHERE game_id = v_level.game_id AND user_id = p_user_id;
  END IF;

  game_id := v_game.id; level_id := v_level.id; level_number := v_level.level_number;
  is_valid := TRUE; game_status := v_game.status; current_level := v_participant.current_level; total_points := v_participant.total_points;

  v_expected_level := COALESCE(v_participant.current_level, 0) + 1;
  is_expected_level := (v_level.level_number = v_expected_level);

  SELECT COUNT(*) INTO v_completion_count FROM public.qr_completions WHERE game_id = v_level.game_id AND level_id = v_level.id AND user_id = p_user_id;
  is_duplicate := (v_completion_count > 0);

  IF NOT is_expected_level AND error_message IS NULL THEN error_message := 'Wrong trail - this marker is not part of your current path'; END IF;
  IF is_duplicate AND error_message IS NULL THEN error_message := 'Already cleared - you have already completed this marker'; END IF;

  IF is_expected_level AND NOT is_duplicate THEN
    location_riddle := v_level.location_riddle;
    answer_riddle := v_level.answer_riddle;
    case_sensitive := v_level.case_sensitive;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

ALTER FUNCTION public.validate_qr_token(TEXT, UUID) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.validate_qr_token(TEXT, UUID) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.validate_qr_token(TEXT, UUID) TO authenticated;

DROP FUNCTION IF EXISTS public.process_qr_answer(TEXT, UUID, TEXT);

CREATE FUNCTION public.process_qr_answer(p_token TEXT, p_user_id UUID, p_answer TEXT)
RETURNS TABLE (
  success BOOLEAN,
  points_awarded INTEGER,
  scanner_position INTEGER,
  total_points INTEGER,
  current_level INTEGER,
  status TEXT,
  location_riddle TEXT,
  answer_riddle TEXT,
  case_sensitive BOOLEAN,
  is_completed BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  v_validation RECORD;
  v_participant RECORD;
  v_level RECORD;
  v_game RECORD;
  v_normalized_answer TEXT;
  v_scanner_position INTEGER;
  v_points INTEGER;
BEGIN
  success := FALSE; points_awarded := 0; scanner_position := 0; total_points := 0; current_level := 0;
  status := 'not_started'; location_riddle := NULL; answer_riddle := NULL; case_sensitive := FALSE;
  is_completed := FALSE; error_message := NULL;

  SELECT * INTO v_validation FROM public.validate_qr_token(p_token, p_user_id) LIMIT 1;
  IF NOT v_validation.is_valid THEN error_message := v_validation.error_message; RETURN; END IF;
  IF NOT v_validation.is_expected_level OR v_validation.is_duplicate THEN error_message := v_validation.error_message; RETURN; END IF;

  SELECT * INTO v_level FROM public.qr_levels WHERE id = v_validation.level_id;
  SELECT * INTO v_game FROM public.qr_games WHERE id = v_validation.game_id;
  SELECT * INTO v_participant FROM public.qr_participants WHERE game_id = v_validation.game_id AND user_id = p_user_id;

  IF v_level.case_sensitive THEN v_normalized_answer := TRIM(p_answer); ELSE v_normalized_answer := LOWER(TRIM(p_answer)); END IF;

  IF public.hash_answer(v_normalized_answer) <> v_level.answer_hash THEN
    error_message := 'WRONG_ANSWER';
    RETURN;
  END IF;

  WITH position_allocated AS (
    UPDATE public.qr_levels SET scanner_position_next = COALESCE(scanner_position_next,0)+1 WHERE id = v_level.id RETURNING scanner_position_next-1 AS allocated_position
  )
  SELECT allocated_position INTO v_scanner_position FROM position_allocated;

  v_points := GREATEST(v_game.score_floor, v_game.starting_score - (v_scanner_position * (v_scanner_position - 1)));

  INSERT INTO public.qr_completions (game_id, level_id, user_id, scanner_position, points_awarded, scanned_at, answered_at)
  VALUES (v_validation.game_id, v_validation.level_id, p_user_id, v_scanner_position, v_points, NOW(), NOW());

  UPDATE public.qr_participants
  SET current_level = v_validation.level_number,
      total_points = v_participant.total_points + v_points,
      last_scan_at = NOW(),
      completed_at = CASE WHEN v_validation.level_number = (SELECT MAX(level_number) FROM public.qr_levels WHERE game_id = v_validation.game_id) THEN NOW() ELSE NULL END,
      status = CASE WHEN v_validation.level_number = (SELECT MAX(level_number) FROM public.qr_levels WHERE game_id = v_validation.game_id) THEN 'completed' ELSE 'active' END
  WHERE game_id = v_validation.game_id AND user_id = p_user_id;

  SELECT * INTO v_participant FROM public.qr_participants WHERE game_id = v_validation.game_id AND user_id = p_user_id;

  success := TRUE;
  points_awarded := v_points;
  scanner_position := v_scanner_position;
  total_points := v_participant.total_points;
  current_level := v_participant.current_level;
  status := v_participant.status;
  is_completed := (v_participant.status = 'completed');

  IF NOT is_completed THEN
    SELECT location_riddle INTO location_riddle FROM public.qr_levels WHERE game_id = v_validation.game_id AND level_number = v_participant.current_level + 1 LIMIT 1;
  END IF;
  answer_riddle := v_level.answer_riddle;
  case_sensitive := v_level.case_sensitive;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

ALTER FUNCTION public.process_qr_answer(TEXT, UUID, TEXT) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.process_qr_answer(TEXT, UUID, TEXT) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.process_qr_answer(TEXT, UUID, TEXT) TO authenticated;

COMMIT;