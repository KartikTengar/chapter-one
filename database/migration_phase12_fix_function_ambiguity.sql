-- ============================================================
-- PHASE 12 — FIX PL/pgSQL COLUMN AMBIGUITY
-- CHAPTER ONE — Supabase
-- SAFE ADDITIVE ONLY — fixes validate_qr_token / process_qr_answer
-- Output parameter names (game_id, level_id, user_id, location_riddle)
-- collided with table column names causing 42702 "column reference
-- ambiguous" at runtime. All references are now fully qualified.
-- ============================================================

BEGIN;

-- hash_answer must resolve digest() which lives in the `extensions` schema on
-- Supabase. Because callers run with SET search_path = '', give hash_answer its
-- own search_path so digest() is always found.
CREATE OR REPLACE FUNCTION public.hash_answer(answer TEXT)
RETURNS TEXT AS $$
  SELECT encode(digest(answer::bytea, 'sha256'), 'hex')
$$ LANGUAGE SQL IMMUTABLE
SET search_path = extensions, public, pg_catalog;

ALTER FUNCTION public.hash_answer(TEXT) OWNER TO postgres;

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

  SELECT * INTO v_level FROM public.qr_levels WHERE qr_levels.token = p_token AND qr_levels.is_active = TRUE;
  IF NOT FOUND THEN error_message := 'Invalid or inactive QR token'; RETURN NEXT; RETURN; END IF;

  SELECT * INTO v_game FROM public.qr_games WHERE qr_games.id = v_level.game_id;
  IF NOT FOUND THEN error_message := 'Game not found'; RETURN NEXT; RETURN; END IF;

  IF v_game.status <> 'active' OR (v_game.start_at IS NOT NULL AND v_game.start_at > NOW()) OR (v_game.end_at IS NOT NULL AND v_game.end_at < NOW()) THEN
    error_message := 'Game is not active'; game_status := v_game.status; RETURN NEXT; RETURN;
  END IF;

  SELECT * INTO v_participant FROM public.qr_participants WHERE qr_participants.game_id = v_level.game_id AND qr_participants.user_id = p_user_id;
  IF NOT FOUND THEN
    PERFORM public.start_qr_participant(v_level.game_id, p_user_id);
    SELECT * INTO v_participant FROM public.qr_participants WHERE qr_participants.game_id = v_level.game_id AND qr_participants.user_id = p_user_id;
  END IF;

  game_id := v_game.id; level_id := v_level.id; level_number := v_level.level_number;
  is_valid := TRUE; game_status := v_game.status; current_level := v_participant.current_level; total_points := v_participant.total_points;

  v_expected_level := COALESCE(v_participant.current_level, 0) + 1;
  is_expected_level := (v_level.level_number = v_expected_level);

  SELECT COUNT(*) INTO v_completion_count FROM public.qr_completions
  WHERE qr_completions.game_id = v_level.game_id AND qr_completions.level_id = v_level.id AND qr_completions.user_id = p_user_id;
  is_duplicate := (v_completion_count > 0);

  IF is_duplicate AND error_message IS NULL THEN error_message := 'Already cleared - you have already completed this marker'; END IF;
  IF NOT is_expected_level AND error_message IS NULL THEN error_message := 'Wrong trail - this marker is not part of your current path'; END IF;

  IF is_expected_level AND NOT is_duplicate THEN
    location_riddle := v_level.location_riddle;
    answer_riddle := v_level.answer_riddle;
    case_sensitive := v_level.case_sensitive;
  END IF;

  RETURN NEXT; RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

ALTER FUNCTION public.validate_qr_token(TEXT, UUID) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.validate_qr_token(TEXT, UUID) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.validate_qr_token(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_qr_token(TEXT, UUID) TO service_role;

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
  IF NOT v_validation.is_valid THEN error_message := v_validation.error_message; RETURN NEXT; RETURN; END IF;
  IF NOT v_validation.is_expected_level OR v_validation.is_duplicate THEN error_message := v_validation.error_message; RETURN NEXT; RETURN; END IF;

  SELECT * INTO v_level FROM public.qr_levels WHERE qr_levels.id = v_validation.level_id;
  SELECT * INTO v_game FROM public.qr_games WHERE qr_games.id = v_validation.game_id;
  SELECT * INTO v_participant FROM public.qr_participants WHERE qr_participants.game_id = v_validation.game_id AND qr_participants.user_id = p_user_id;

  IF v_level.case_sensitive THEN v_normalized_answer := TRIM(p_answer); ELSE v_normalized_answer := LOWER(TRIM(p_answer)); END IF;

  IF public.hash_answer(v_normalized_answer) <> v_level.answer_hash THEN
    error_message := 'WRONG_ANSWER';
    RETURN NEXT; RETURN;
  END IF;

  WITH position_allocated AS (
    UPDATE public.qr_levels SET scanner_position_next = COALESCE(scanner_position_next,0) + 1 WHERE qr_levels.id = v_level.id RETURNING scanner_position_next AS allocated_position
  )
  SELECT allocated_position INTO v_scanner_position FROM position_allocated;

  v_points := GREATEST(v_game.score_floor, v_game.starting_score - (v_scanner_position * (v_scanner_position - 1)));

  INSERT INTO public.qr_completions (game_id, level_id, user_id, scanner_position, points_awarded, scanned_at, answered_at)
  VALUES (v_validation.game_id, v_validation.level_id, p_user_id, v_scanner_position, v_points, NOW(), NOW());

  UPDATE public.qr_participants
  SET current_level = v_validation.level_number,
      total_points = v_participant.total_points + v_points,
      last_scan_at = NOW(),
      completed_at = CASE WHEN v_validation.level_number = (SELECT MAX(qr_levels.level_number) FROM public.qr_levels WHERE qr_levels.game_id = v_validation.game_id) THEN NOW() ELSE NULL END,
      status = CASE WHEN v_validation.level_number = (SELECT MAX(qr_levels.level_number) FROM public.qr_levels WHERE qr_levels.game_id = v_validation.game_id) THEN 'completed' ELSE 'active' END
  WHERE qr_participants.game_id = v_validation.game_id AND qr_participants.user_id = p_user_id;

  SELECT * INTO v_participant FROM public.qr_participants WHERE qr_participants.game_id = v_validation.game_id AND qr_participants.user_id = p_user_id;

  success := TRUE;
  points_awarded := v_points;
  scanner_position := v_scanner_position;
  total_points := v_participant.total_points;
  current_level := v_participant.current_level;
  status := v_participant.status;
  is_completed := (v_participant.status = 'completed');

  IF NOT is_completed THEN
    SELECT qr_levels.location_riddle INTO location_riddle FROM public.qr_levels WHERE qr_levels.game_id = v_validation.game_id AND qr_levels.level_number = v_participant.current_level + 1 LIMIT 1;
  END IF;
  answer_riddle := v_level.answer_riddle;
  case_sensitive := v_level.case_sensitive;

  RETURN NEXT; RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

ALTER FUNCTION public.process_qr_answer(TEXT, UUID, TEXT) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.process_qr_answer(TEXT, UUID, TEXT) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.process_qr_answer(TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_qr_answer(TEXT, UUID, TEXT) TO service_role;

COMMIT;