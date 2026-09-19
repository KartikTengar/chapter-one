-- =============================================
-- PHASE 5: Supabase Schema Hardening
-- CHAPTER ONE - Database Security & Constraint Hardening
-- Additive only - no DROP / no destructive changes
-- =============================================

BEGIN;

-- =============================================
-- 1. Add missing CHECK constraints (safe additive)
-- =============================================

-- QR Scan Logs result domain
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'qr_scan_logs_result_check'
    AND conrelid = 'public.qr_scan_logs'::regclass
  ) THEN
    ALTER TABLE public.qr_scan_logs
    ADD CONSTRAINT qr_scan_logs_result_check
    CHECK (result IN ('success','duplicate','wrong_level','invalid_token','game_inactive','answer_incorrect'));
  END IF;
END $$;

-- QR Completions scanner_position non-negative
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'qr_completions_scanner_position_check'
    AND conrelid = 'public.qr_completions'::regclass
  ) THEN
    ALTER TABLE public.qr_completions
    ADD CONSTRAINT qr_completions_scanner_position_check
    CHECK (scanner_position >= 0);
  END IF;
END $$;

-- QR Games temporal sanity
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'qr_games_time_check'
    AND conrelid = 'public.qr_games'::regclass
  ) THEN
    ALTER TABLE public.qr_games
    ADD CONSTRAINT qr_games_time_check
    CHECK (end_at IS NULL OR start_at IS NULL OR end_at >= start_at);
  END IF;
END $$;

-- =============================================
-- 2. Harden SECURITY DEFINER functions
-- =============================================

-- Harden start_qr_participant
CREATE OR REPLACE FUNCTION public.start_qr_participant(
  p_game_id UUID,
  p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.qr_participants (
    game_id, user_id, current_level, total_points, status, started_at, last_scan_at
  )
  VALUES (
    p_game_id, p_user_id, 0, 0, 'active', NOW(), NOW()
  )
  ON CONFLICT (game_id, user_id) DO UPDATE
  SET 
    current_level = GREATEST(EXCLUDED.current_level, qr_participants.current_level),
    total_points = GREATEST(EXCLUDED.total_points, qr_participants.total_points),
    status = 'active',
    started_at = COALESCE(qr_participants.started_at, EXCLUDED.started_at),
    last_scan_at = NOW()
  WHERE qr_participants.game_id = EXCLUDED.game_id 
    AND qr_participants.user_id = EXCLUDED.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

ALTER FUNCTION public.start_qr_participant(UUID, UUID) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.start_qr_participant(UUID, UUID) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.start_qr_participant(UUID, UUID) TO authenticated;

-- Harden validate_qr_token
CREATE OR REPLACE FUNCTION public.validate_qr_token(
  p_token TEXT,
  p_user_id UUID
)
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
  v_participant qr_participants%ROWTYPE;
  v_level qr_levels%ROWTYPE;
  v_game qr_games%ROWTYPE;
  v_expected_level INTEGER;
  v_completion_count INTEGER;
BEGIN
  game_id := NULL;
  level_id := NULL;
  level_number := NULL;
  is_valid := FALSE;
  is_expected_level := FALSE;
  is_duplicate := FALSE;
  game_status := NULL;
  current_level := NULL;
  total_points := NULL;
  location_riddle := NULL;
  answer_riddle_hash := NULL;
  case_sensitive := FALSE;
  error_message := NULL;

  SELECT * INTO v_level FROM public.qr_levels WHERE token = p_token AND is_active = TRUE;
  IF NOT FOUND THEN error_message := 'Invalid or inactive QR token'; RETURN; END IF;

  SELECT * INTO v_game FROM public.qr_games WHERE id = v_level.game_id;
  IF NOT FOUND THEN error_message := 'Game not found'; RETURN; END IF;

  IF v_game.status <> 'active' 
     OR (v_game.start_at IS NOT NULL AND v_game.start_at > NOW())
     OR (v_game.end_at IS NOT NULL AND v_game.end_at < NOW()) THEN
    error_message := 'Game is not active';
    game_status := v_game.status;
    RETURN;
  END IF;

  SELECT * INTO v_participant FROM public.qr_participants WHERE game_id = v_level.game_id AND user_id = p_user_id;
  IF NOT FOUND THEN
    PERFORM public.start_qr_participant(v_level.game_id, p_user_id);
    SELECT * INTO v_participant FROM public.qr_participants WHERE game_id = v_level.game_id AND user_id = p_user_id;
  END IF;

  game_id := v_game.id;
  level_id := v_level.id;
  level_number := v_level.level_number;
  is_valid := TRUE;
  game_status := v_game.status;
  current_level := v_participant.current_level;
  total_points := v_participant.total_points;

  v_expected_level := COALESCE(v_participant.current_level, 0) + 1;
  is_expected_level := (v_level.level_number = v_expected_level);

  SELECT COUNT(*) INTO v_completion_count FROM public.qr_completions WHERE game_id = v_level.game_id AND level_id = v_level.id AND user_id = p_user_id;
  is_duplicate := (v_completion_count > 0);

  IF NOT is_expected_level AND error_message IS NULL THEN
    error_message := 'Wrong trail - this marker is not part of your current path';
  END IF;
  IF is_duplicate AND error_message IS NULL THEN
    error_message := 'Already cleared - you have already completed this marker';
  END IF;

  IF is_expected_level AND NOT is_duplicate THEN
    location_riddle := v_level.location_riddle;
    answer_riddle_hash := v_level.answer_hash;
    case_sensitive := v_level.case_sensitive;
  END IF;

EXCEPTION WHEN OTHERS THEN
  error_message := 'Validation error: ' || SQLERRM;
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

ALTER FUNCTION public.validate_qr_token(TEXT, UUID) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.validate_qr_token(TEXT, UUID) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.validate_qr_token(TEXT, UUID) TO authenticated;

-- Harden process_qr_answer
CREATE OR REPLACE FUNCTION public.process_qr_answer(
  p_token TEXT,
  p_user_id UUID,
  p_answer TEXT
)
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
  v_validation public.validate_qr_token%ROWTYPE;
  v_participant qr_participants%ROWTYPE;
  v_level qr_levels%ROWTYPE;
  v_game qr_games%ROWTYPE;
  v_normalized_answer TEXT;
  v_scanner_position INTEGER;
  v_points INTEGER;
BEGIN
  success := FALSE;
  points_awarded := 0;
  scanner_position := 0;
  total_points := 0;
  current_level := 0;
  status := 'not_started';
  location_riddle := NULL;
  answer_riddle_hash := NULL;
  case_sensitive := FALSE;
  is_completed := FALSE;
  error_message := NULL;

  FOR v_validation IN SELECT * FROM public.validate_qr_token(p_token, p_user_id) LOOP EXIT; END LOOP;
  IF NOT v_validation.is_valid THEN error_message := v_validation.error_message; RETURN; END IF;
  IF NOT v_validation.is_expected_level OR v_validation.is_duplicate THEN error_message := v_validation.error_message; RETURN; END IF;

  SELECT * INTO v_level FROM public.qr_levels WHERE id = v_validation.level_id;
  SELECT * INTO v_game FROM public.qr_games WHERE id = v_validation.game_id;
  SELECT * INTO v_participant FROM public.qr_participants WHERE game_id = v_validation.game_id AND user_id = p_user_id;

  IF v_level.case_sensitive THEN
    v_normalized_answer := TRIM(p_answer);
  ELSE
    v_normalized_answer := LOWER(TRIM(p_answer));
  END IF;

  IF public.hash_answer(v_normalized_answer) <> v_level.answer_hash THEN
    error_message := 'Not quite. Try again.';
    RETURN;
  END IF;

  WITH position_allocated AS (
    UPDATE public.qr_levels
    SET scanner_position_next = COALESCE(scanner_position_next, 0) + 1
    WHERE id = v_level.id
    RETURNING (scanner_position_next - 1) as allocated_position
  )
  SELECT allocated_position INTO v_scanner_position FROM position_allocated;

  v_points := GREATEST(v_game.score_floor, v_game.starting_score - (v_scanner_position * (v_scanner_position - 1)));

  INSERT INTO public.qr_completions (game_id, level_id, user_id, scanner_position, points_awarded, scanned_at, answered_at)
  VALUES (v_validation.game_id, v_validation.level_id, p_user_id, v_scanner_position, v_points, NOW(), NOW());

  UPDATE public.qr_participants
  SET 
    current_level = v_validation.level_number,
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

EXCEPTION WHEN OTHERS THEN
  error_message := 'Processing error: ' || SQLERRM;
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

ALTER FUNCTION public.process_qr_answer(TEXT, UUID, TEXT) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.process_qr_answer(TEXT, UUID, TEXT) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.process_qr_answer(TEXT, UUID, TEXT) TO authenticated;

-- =============================================
-- 3. Policy hardening - use centralized admin check
-- =============================================

-- Replace inline admin EXISTS with is_profile_admin where appropriate
DROP POLICY IF EXISTS "Admins can manage games" ON public.qr_games;
CREATE POLICY "Admins can manage games"
  ON public.qr_games
  FOR ALL
  USING ((SELECT public.is_profile_admin()))
  WITH CHECK ((SELECT public.is_profile_admin()));

DROP POLICY IF EXISTS "Admins can manage levels" ON public.qr_levels;
CREATE POLICY "Admins can manage levels"
  ON public.qr_levels
  FOR ALL
  USING ((SELECT public.is_profile_admin()))
  WITH CHECK ((SELECT public.is_profile_admin()));

DROP POLICY IF EXISTS "Admins can manage participants" ON public.qr_participants;
CREATE POLICY "Admins can manage participants"
  ON public.qr_participants
  FOR ALL
  USING ((SELECT public.is_profile_admin()))
  WITH CHECK ((SELECT public.is_profile_admin()));

DROP POLICY IF EXISTS "Admins can manage completions" ON public.qr_completions;
CREATE POLICY "Admins can manage completions"
  ON public.qr_completions
  FOR ALL
  USING ((SELECT public.is_profile_admin()))
  WITH CHECK ((SELECT public.is_profile_admin()));

DROP POLICY IF EXISTS "Admins can manage scan logs" ON public.qr_scan_logs;
CREATE POLICY "Admins can manage scan logs"
  ON public.qr_scan_logs
  FOR ALL
  USING ((SELECT public.is_profile_admin()))
  WITH CHECK ((SELECT public.is_profile_admin()));

DROP POLICY IF EXISTS "Admins can manage audit logs" ON public.qr_admin_audit;
CREATE POLICY "Admins can manage audit logs"
  ON public.qr_admin_audit
  FOR ALL
  USING ((SELECT public.is_profile_admin()))
  WITH CHECK ((SELECT public.is_profile_admin()));

DROP POLICY IF EXISTS "Admins can manage achievements" ON public.achievements;
CREATE POLICY "Admins can manage achievements"
  ON public.achievements
  FOR ALL
  USING ((SELECT public.is_profile_admin()))
  WITH CHECK ((SELECT public.is_profile_admin()));

DROP POLICY IF EXISTS "Admins can manage user achievements" ON public.user_achievements;
CREATE POLICY "Admins can manage user achievements"
  ON public.user_achievements
  FOR ALL
  USING ((SELECT public.is_profile_admin()))
  WITH CHECK ((SELECT public.is_profile_admin()));

-- Events policies also use centralized check
DROP POLICY IF EXISTS "Admins can create events" ON public.events;
CREATE POLICY "Admins can create events"
  ON public.events
  FOR INSERT
  WITH CHECK ((SELECT public.is_profile_admin()));

DROP POLICY IF EXISTS "Admins can update events" ON public.events;
CREATE POLICY "Admins can update events"
  ON public.events
  FOR UPDATE
  USING ((SELECT public.is_profile_admin()))
  WITH CHECK ((SELECT public.is_profile_admin()));

DROP POLICY IF EXISTS "Admins can delete events" ON public.events;
CREATE POLICY "Admins can delete events"
  ON public.events
  FOR DELETE
  USING ((SELECT public.is_profile_admin()));

-- =============================================
-- 4. Defense in depth - revoke excessive privileges
-- =============================================

-- Ensure profiles table has no INSERT/UPDATE/DELETE for anon/authenticated
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.profiles FROM PUBLIC, anon, authenticated;

-- Ensure qr_admin_audit is append-only for authenticated users
REVOKE INSERT, UPDATE, DELETE ON TABLE public.qr_admin_audit FROM authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO authenticated;

COMMIT;

-- End of Phase 5 Hardening
