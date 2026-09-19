-- ============================================================
-- PHASE 5B LIVE RECONCILIATION MIGRATION
-- CHAPTER ONE - Supabase Live Database Reconciliation
-- SAFE ADDITIVE ONLY - NO DROP / NO DATA LOSS
-- ============================================================
-- Target Project: csnhvvbezzbpmhqgxrhr
-- Purpose:
-- 1. Fix handle_new_user admin escalation vulnerability
-- 2. Harden function security
-- 3. Reconcile is_admin vs is_profile_admin
-- 4. Deploy missing Hidden Trail schema
-- 5. Harden Hidden Trail RLS / functions
-- ============================================================

BEGIN;

-- ============================================================
-- PHASE B & C - FIX handle_new_user ADMIN ESCALATION
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, ''),
    'student'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated, service_role;

-- Trigger remains attached; no EXECUTE needed for trigger invocation

-- ============================================================
-- PHASE D - CANONICAL ADMIN HELPER
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_profile_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
SET row_security = off;

ALTER FUNCTION public.is_profile_admin() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.is_profile_admin() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_profile_admin() TO authenticated;

-- Compatibility wrapper for existing policies that use is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT public.is_profile_admin();
$$ LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = '';

ALTER FUNCTION public.is_admin() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ============================================================
-- PHASE F - VERIFY EXISTING TABLES PRESERVED
-- No changes to profiles/events/event_registrations schema
-- Ensure RLS remains enabled - already verified
-- ============================================================

-- ============================================================
-- PHASE G/I/J/K - HIDDEN TRAIL SCHEMA DEPLOYMENT (ADDITIVE)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.qr_games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','active','paused','ended')),
  start_at TIMESTAMPTZ NULL,
  end_at TIMESTAMPTZ NULL,
  score_start_level INTEGER NOT NULL DEFAULT 2,
  starting_score INTEGER NOT NULL DEFAULT 100,
  score_floor INTEGER NOT NULL DEFAULT 30,
  final_secret_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  final_secret_hash TEXT NULL,
  final_message TEXT NULL,
  leaderboard_public BOOLEAN NOT NULL DEFAULT TRUE,
  leaderboard_name_mode TEXT NOT NULL DEFAULT 'FIRST_NAME' CHECK (leaderboard_name_mode IN ('FULL_NAME','FIRST_NAME','INITIALS','PARTICIPANT_NUMBER')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT qr_games_time_check CHECK (end_at IS NULL OR start_at IS NULL OR end_at >= start_at)
);

CREATE TABLE IF NOT EXISTS public.qr_levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.qr_games(id) ON DELETE CASCADE,
  level_number INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  location_riddle TEXT NOT NULL,
  answer_riddle TEXT NOT NULL,
  answer_hash TEXT NOT NULL,
  case_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
  admin_location TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  scanner_position_next INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT qr_levels_game_level_unique UNIQUE (game_id, level_number)
);

CREATE TABLE IF NOT EXISTS public.qr_participants (
  game_id UUID NOT NULL REFERENCES public.qr_games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_level INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','active','completed')),
  started_at TIMESTAMPTZ NULL,
  last_scan_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,
  PRIMARY KEY (game_id, user_id),
  CONSTRAINT qr_participants_game_user_unique UNIQUE (game_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.qr_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.qr_games(id) ON DELETE CASCADE,
  level_id UUID NOT NULL REFERENCES public.qr_levels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scanner_position INTEGER NOT NULL CHECK (scanner_position >= 0),
  points_awarded INTEGER NOT NULL DEFAULT 0,
  scanned_at TIMESTAMPTZ NULL,
  answered_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT qr_completions_game_level_user_unique UNIQUE (game_id, level_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.qr_scan_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.qr_games(id) ON DELETE CASCADE,
  level_id UUID NULL REFERENCES public.qr_levels(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  result TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT qr_scan_logs_result_check CHECK (result IN ('success','duplicate','wrong_level','invalid_token','game_inactive','answer_incorrect'))
);

CREATE TABLE IF NOT EXISTS public.qr_admin_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NULL,
  details JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NULL,
  rule_config JSONB NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_achievements (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.qr_games(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id, game_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_qr_levels_game_id ON public.qr_levels(game_id);
CREATE INDEX IF NOT EXISTS idx_qr_levels_token ON public.qr_levels(token);
CREATE INDEX IF NOT EXISTS idx_qr_participants_user_id ON public.qr_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_participants_game_id ON public.qr_participants(game_id);
CREATE INDEX IF NOT EXISTS idx_qr_completions_game_id ON public.qr_completions(game_id);
CREATE INDEX IF NOT EXISTS idx_qr_completions_user_id ON public.qr_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_completions_level_id ON public.qr_completions(level_id);
CREATE INDEX IF NOT EXISTS idx_qr_scan_logs_game_id ON public.qr_scan_logs(game_id);
CREATE INDEX IF NOT EXISTS idx_qr_scan_logs_user_id ON public.qr_scan_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_scan_logs_result ON public.qr_scan_logs(result);
CREATE INDEX IF NOT EXISTS idx_qr_admin_audit_admin_user_id ON public.qr_admin_audit(admin_user_id);

-- Enable RLS
ALTER TABLE public.qr_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_admin_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PHASE L - HIDDEN TRAIL RLS POLICIES
-- ============================================================

-- qr_games
DROP POLICY IF EXISTS "Students can read active games" ON public.qr_games;
CREATE POLICY "Students can read active games"
ON public.qr_games FOR SELECT
USING (status = 'active' AND (start_at IS NULL OR start_at <= NOW()) AND (end_at IS NULL OR end_at >= NOW()));

DROP POLICY IF EXISTS "Admins can manage games" ON public.qr_games;
CREATE POLICY "Admins can manage games"
ON public.qr_games FOR ALL
USING (public.is_profile_admin())
WITH CHECK (public.is_profile_admin());

-- qr_levels
DROP POLICY IF EXISTS "Students can read active levels" ON public.qr_levels;
CREATE POLICY "Students can read active levels"
ON public.qr_levels FOR SELECT
USING (
  is_active = TRUE AND EXISTS (
    SELECT 1 FROM public.qr_games g
    WHERE g.id = qr_levels.game_id
      AND g.status = 'active'
      AND (g.start_at IS NULL OR g.start_at <= NOW())
      AND (g.end_at IS NULL OR g.end_at >= NOW())
  )
);

DROP POLICY IF EXISTS "Admins can manage levels" ON public.qr_levels;
CREATE POLICY "Admins can manage levels"
ON public.qr_levels FOR ALL
USING (public.is_profile_admin())
WITH CHECK (public.is_profile_admin());

-- qr_participants
DROP POLICY IF EXISTS "Students can read own participant" ON public.qr_participants;
CREATE POLICY "Students can read own participant"
ON public.qr_participants FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Students can update own participant" ON public.qr_participants;
CREATE POLICY "Students can update own participant"
ON public.qr_participants FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage participants" ON public.qr_participants;
CREATE POLICY "Admins can manage participants"
ON public.qr_participants FOR ALL
USING (public.is_profile_admin())
WITH CHECK (public.is_profile_admin());

-- qr_completions
DROP POLICY IF EXISTS "Students can read own completions" ON public.qr_completions;
CREATE POLICY "Students can read own completions"
ON public.qr_completions FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage completions" ON public.qr_completions;
CREATE POLICY "Admins can manage completions"
ON public.qr_completions FOR ALL
USING (public.is_profile_admin())
WITH CHECK (public.is_profile_admin());

-- qr_scan_logs
DROP POLICY IF EXISTS "Students can insert own scan logs" ON public.qr_scan_logs;
CREATE POLICY "Students can insert own scan logs"
ON public.qr_scan_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Students can read own scan logs" ON public.qr_scan_logs;
CREATE POLICY "Students can read own scan logs"
ON public.qr_scan_logs FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage scan logs" ON public.qr_scan_logs;
CREATE POLICY "Admins can manage scan logs"
ON public.qr_scan_logs FOR ALL
USING (public.is_profile_admin())
WITH CHECK (public.is_profile_admin());

-- qr_admin_audit
DROP POLICY IF EXISTS "Admins can manage audit logs" ON public.qr_admin_audit;
CREATE POLICY "Admins can manage audit logs"
ON public.qr_admin_audit FOR ALL
USING (public.is_profile_admin())
WITH CHECK (public.is_profile_admin());

-- achievements
DROP POLICY IF EXISTS "Students can read achievements" ON public.achievements;
CREATE POLICY "Students can read achievements"
ON public.achievements FOR SELECT
USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can manage achievements" ON public.achievements;
CREATE POLICY "Admins can manage achievements"
ON public.achievements FOR ALL
USING (public.is_profile_admin())
WITH CHECK (public.is_profile_admin());

-- user_achievements
DROP POLICY IF EXISTS "Students can read own achievements" ON public.user_achievements;
CREATE POLICY "Students can read own achievements"
ON public.user_achievements FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage user achievements" ON public.user_achievements;
CREATE POLICY "Admins can manage user achievements"
ON public.user_achievements FOR ALL
USING (public.is_profile_admin())
WITH CHECK (public.is_profile_admin());

-- ============================================================
-- PHASE M - HIDDEN TRAIL FUNCTIONS - HARDENED
-- ============================================================

CREATE OR REPLACE FUNCTION public.hash_answer(answer TEXT)
RETURNS TEXT AS $$
  SELECT encode(digest(answer::bytea, 'sha256'), 'hex')
$$ LANGUAGE SQL IMMUTABLE;

ALTER FUNCTION public.hash_answer(TEXT) OWNER TO postgres;

CREATE OR REPLACE FUNCTION public.start_qr_participant(p_game_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.qr_participants (game_id, user_id, current_level, total_points, status, started_at, last_scan_at)
  VALUES (p_game_id, p_user_id, 0, 0, 'active', NOW(), NOW())
  ON CONFLICT (game_id, user_id) DO UPDATE
  SET current_level = GREATEST(EXCLUDED.current_level, qr_participants.current_level),
      total_points = GREATEST(EXCLUDED.total_points, qr_participants.total_points),
      status = 'active',
      started_at = COALESCE(qr_participants.started_at, EXCLUDED.started_at),
      last_scan_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

ALTER FUNCTION public.start_qr_participant(UUID, UUID) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.start_qr_participant(UUID, UUID) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.start_qr_participant(UUID, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.validate_qr_token(p_token TEXT, p_user_id UUID)
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
  answer_riddle_hash TEXT,
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
  location_riddle := NULL; answer_riddle_hash := NULL; case_sensitive := FALSE;
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
    answer_riddle_hash := v_level.answer_hash;
    case_sensitive := v_level.case_sensitive;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

ALTER FUNCTION public.validate_qr_token(TEXT, UUID) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.validate_qr_token(TEXT, UUID) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.validate_qr_token(TEXT, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.process_qr_answer(p_token TEXT, p_user_id UUID, p_answer TEXT)
RETURNS TABLE (
  success BOOLEAN,
  points_awarded INTEGER,
  scanner_position INTEGER,
  total_points INTEGER,
  current_level INTEGER,
  status TEXT,
  location_riddle TEXT,
  answer_riddle_hash TEXT,
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
  status := 'not_started'; location_riddle := NULL; answer_riddle_hash := NULL; case_sensitive := FALSE;
  is_completed := FALSE; error_message := NULL;

  SELECT * INTO v_validation FROM public.validate_qr_token(p_token, p_user_id) LIMIT 1;
  IF NOT v_validation.is_valid THEN error_message := v_validation.error_message; RETURN; END IF;
  IF NOT v_validation.is_expected_level OR v_validation.is_duplicate THEN error_message := v_validation.error_message; RETURN; END IF;

  SELECT * INTO v_level FROM public.qr_levels WHERE id = v_validation.level_id;
  SELECT * INTO v_game FROM public.qr_games WHERE id = v_validation.game_id;
  SELECT * INTO v_participant FROM public.qr_participants WHERE game_id = v_validation.game_id AND user_id = p_user_id;

  IF v_level.case_sensitive THEN v_normalized_answer := TRIM(p_answer); ELSE v_normalized_answer := LOWER(TRIM(p_answer)); END IF;

  IF public.hash_answer(v_normalized_answer) <> v_level.answer_hash THEN error_message := 'Not quite. Try again.'; RETURN; END IF;

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
  answer_riddle_hash := v_level.answer_hash;
  case_sensitive := v_level.case_sensitive;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

ALTER FUNCTION public.process_qr_answer(TEXT, UUID, TEXT) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.process_qr_answer(TEXT, UUID, TEXT) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.process_qr_answer(TEXT, UUID, TEXT) TO authenticated;

COMMIT;

-- End of Phase 5B Live Reconciliation Migration
