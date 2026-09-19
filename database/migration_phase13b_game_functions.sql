-- ============================================================
-- PHASE 13 — GAME MANAGEMENT ATOMIC FUNCTIONS
-- CHAPTER ONE — Supabase
-- SAFE ADDITIVE ONLY — NO DROP / NO DATA LOSS
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- create_hidden_trail_game
-- Atomic creation of a game instance + N levels with unique
-- tokens. Rolls back everything on any failure.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_hidden_trail_game(
  p_name TEXT,
  p_slug TEXT,
  p_description TEXT DEFAULT NULL,
  p_admin_user_id UUID DEFAULT NULL,
  p_level_count INTEGER DEFAULT 10,
  p_starting_score INTEGER DEFAULT 100,
  p_score_floor INTEGER DEFAULT 30,
  p_score_start_level INTEGER DEFAULT 2,
  p_leaderboard_name_mode TEXT DEFAULT 'FIRST_NAME',
  p_leaderboard_public BOOLEAN DEFAULT TRUE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_game_id UUID;
  v_i INTEGER;
  v_token TEXT;
BEGIN
  -- Admin gate
  IF p_admin_user_id IS NOT NULL AND NOT public.is_profile_admin() THEN
    RAISE EXCEPTION 'ADMIN_REQUIRED' USING ERRCODE = '42501';
  END IF;

  -- Slug validation
  IF p_slug IS NULL OR btrim(p_slug) = '' THEN
    RAISE EXCEPTION 'SLUG_REQUIRED' USING ERRCODE = '23502';
  END IF;
  IF p_slug !~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$' AND length(p_slug) > 2 THEN
    RAISE EXCEPTION 'INVALID_SLUG' USING ERRCODE = '23502';
  END IF;

  -- Uniqueness
  IF EXISTS (SELECT 1 FROM public.qr_games WHERE slug = p_slug) THEN
    RAISE EXCEPTION 'SLUG_EXISTS' USING ERRCODE = '23502';
  END IF;

  -- Game row
  INSERT INTO public.qr_games (
    name, slug, description, status, game_type, is_current,
    start_at, end_at,
    score_start_level, starting_score, score_floor,
    final_secret_enabled, final_secret_hash, final_message,
    leaderboard_public, leaderboard_name_mode,
    photo_feature_enabled, gallery_enabled, live_display_enabled
  ) VALUES (
    p_name, p_slug, p_description, 'draft', 'hidden-trail', FALSE,
    NULL, NULL,
    p_score_start_level, p_starting_score, p_score_floor,
    FALSE, NULL, NULL,
    p_leaderboard_public, p_leaderboard_name_mode,
    FALSE, TRUE, TRUE
  )
  RETURNING id INTO v_game_id;

  -- Level rows with unique tokens
  FOR v_i IN 1..COALESCE(p_level_count, 10) LOOP
    v_token := encode(gen_random_bytes(24), 'hex');
    INSERT INTO public.qr_levels (
      game_id, level_number, token, title,
      location_riddle, answer_riddle, answer_hash,
      case_sensitive, admin_location, is_active
    ) VALUES (
      v_game_id, v_i, v_token, 'Level ' || v_i,
      '', '', public.hash_answer(''),
      FALSE, NULL, TRUE
    );
  END LOOP;

  -- Audit (no secret values)
  INSERT INTO public.qr_admin_audit (admin_user_id, action, entity_type, entity_id, details)
  VALUES (
    p_admin_user_id, 'GAME_CREATED', 'qr_game', v_game_id,
    jsonb_build_object('name', p_name, 'slug', p_slug, 'level_count', p_level_count)
  );

  RETURN v_game_id;
END;
$$;

-- ------------------------------------------------------------
-- duplicate_hidden_trail_game
-- Clone configuration only: levels + tokens regenerated.
-- NO participants, scores, completions, photos, achievements.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.duplicate_hidden_trail_game(
  p_source_game_id UUID,
  p_name TEXT,
  p_slug TEXT,
  p_admin_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_src RECORD;
  v_new_id UUID;
  v_i INTEGER;
  v_token TEXT;
BEGIN
  IF p_admin_user_id IS NOT NULL AND NOT public.is_profile_admin() THEN
    RAISE EXCEPTION 'ADMIN_REQUIRED' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_src FROM public.qr_games WHERE id = p_source_game_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'SOURCE_NOT_FOUND' USING ERRCODE = 'PGRST116';
  END IF;

  IF p_slug IS NULL OR btrim(p_slug) = '' THEN
    RAISE EXCEPTION 'SLUG_REQUIRED' USING ERRCODE = '23502';
  END IF;
  IF EXISTS (SELECT 1 FROM public.qr_games WHERE slug = p_slug) THEN
    RAISE EXCEPTION 'SLUG_EXISTS' USING ERRCODE = '23502';
  END IF;

  INSERT INTO public.qr_games (
    name, slug, description, status, game_type, is_current,
    start_at, end_at,
    score_start_level, starting_score, score_floor,
    final_secret_enabled, final_secret_hash, final_message,
    leaderboard_public, leaderboard_name_mode,
    photo_feature_enabled, gallery_enabled, live_display_enabled,
    clone_of_game_id
  ) VALUES (
    p_name, p_slug, v_src.description, 'draft', 'hidden-trail', FALSE,
    NULL, NULL,
    v_src.starting_score, v_src.score_floor, v_src.score_start_level,
    v_src.final_secret_enabled, NULL, v_src.final_message,
    v_src.leaderboard_public, v_src.leaderboard_name_mode,
    v_src.photo_feature_enabled, v_src.gallery_enabled, v_src.live_display_enabled,
    p_source_game_id
  )
  RETURNING id INTO v_new_id;

  -- Clone levels with NEW tokens, preserving riddles/config
  FOR v_i IN 1..(SELECT count(*) FROM public.qr_levels WHERE game_id = p_source_game_id) LOOP
    v_token := encode(gen_random_bytes(24), 'hex');
    INSERT INTO public.qr_levels (
      game_id, level_number, token, title,
      location_riddle, answer_riddle, answer_hash,
      case_sensitive, admin_location, is_active
    )
    SELECT
      v_new_id, v_i, v_token, l.title,
      l.location_riddle, l.answer_riddle, l.answer_hash,
      l.case_sensitive, l.admin_location, l.is_active
    FROM public.qr_levels l
    WHERE l.game_id = p_source_game_id AND l.level_number = v_i;
  END LOOP;

  INSERT INTO public.qr_admin_audit (admin_user_id, action, entity_type, entity_id, details)
  VALUES (
    p_admin_user_id, 'GAME_CLONED', 'qr_game', v_new_id,
    jsonb_build_object('source_game_id', p_source_game_id, 'name', p_name, 'slug', p_slug)
  );

  RETURN v_new_id;
END;
$$;

-- ------------------------------------------------------------
-- delete_hidden_trail_game
-- Atomic deletion + storage paths for cleanup.
-- FKs cascade; returns counts and storage paths.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_hidden_trail_game(
  p_game_id UUID,
  p_admin_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_game RECORD;
  v_result JSONB;
  v_storage_paths TEXT[];
  v_level_count INTEGER;
  v_participant_count INTEGER;
  v_completion_count INTEGER;
  v_scan_log_count INTEGER;
  v_photo_count INTEGER;
BEGIN
  IF p_admin_user_id IS NOT NULL AND NOT public.is_profile_admin() THEN
    RAISE EXCEPTION 'ADMIN_REQUIRED' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_game FROM public.qr_games WHERE id = p_game_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'GAME_NOT_FOUND' USING ERRCODE = 'PGRST116';
  END IF;

  -- Cannot delete running or paused games
  IF v_game.status IN ('running', 'paused') THEN
    RAISE EXCEPTION 'ACTIVE_GAME_DELETE_FORBIDDEN' USING ERRCODE = '409';
  END IF;

  -- Collect counts BEFORE deletion (cascade will destroy them)
  v_level_count := (SELECT count(*) FROM public.qr_levels WHERE game_id = p_game_id);
  v_participant_count := (SELECT count(*) FROM public.qr_participants WHERE game_id = p_game_id);
  v_completion_count := (SELECT count(*) FROM public.qr_completions WHERE game_id = p_game_id);
  v_scan_log_count := (SELECT count(*) FROM public.qr_scan_logs WHERE game_id = p_game_id);
  v_photo_count := (SELECT count(*) FROM public.hidden_trail_photos WHERE game_id = p_game_id);

  -- Collect storage paths for post-delete cleanup
  SELECT array_agg(storage_path) INTO v_storage_paths
  FROM public.hidden_trail_photos
  WHERE game_id = p_game_id;

  -- Delete game (cascades to levels, participants, completions, scan_logs, photos, user_achievements)
  DELETE FROM public.qr_games WHERE id = p_game_id;

  -- Audit with safe snapshot (no secrets)
  INSERT INTO public.qr_admin_audit (admin_user_id, action, entity_type, entity_id, details)
  VALUES (
    p_admin_user_id, 'GAME_DELETED', 'qr_game', p_game_id,
    jsonb_build_object(
      'name', v_game.name,
      'slug', v_game.slug,
      'status', v_game.status,
      'levels_deleted', v_level_count,
      'participants_deleted', v_participant_count,
      'completions_deleted', v_completion_count,
      'scan_logs_deleted', v_scan_log_count,
      'photos_deleted', v_photo_count
    )
  );

  RETURN jsonb_build_object(
    'game_id', p_game_id,
    'name', v_game.name,
    'slug', v_game.slug,
    'level_count', v_level_count,
    'participant_count', v_participant_count,
    'completion_count', v_completion_count,
    'scan_log_count', v_scan_log_count,
    'photo_count', v_photo_count,
    'storage_paths', COALESCE(v_storage_paths, '{}'::text[])
  );
END;
$$;

-- ------------------------------------------------------------
-- readiness_hidden_trail_game
-- Authoritative server-side readiness validation.
-- Returns JSONB with checks array and overall passed boolean.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.readiness_hidden_trail_game(
  p_game_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_game RECORD;
  v_checks JSONB := '[]'::JSONB;
  v_passed BOOLEAN := TRUE;
  v_level_count INTEGER;
  v_missing_riddles INTEGER;
  v_missing_answers INTEGER;
  v_missing_tokens INTEGER;
  v_duplicate_tokens INTEGER;
  v_slug_exists BOOLEAN;
  v_score_config_ok BOOLEAN;
BEGIN
  SELECT * INTO v_game FROM public.qr_games WHERE id = p_game_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('passed', FALSE, 'checks', jsonb_build_array(
      jsonb_build_object('name', 'game_exists', 'passed', FALSE, 'detail', 'Game not found')
    ));
  END IF;

  -- Game metadata
  IF v_game.name IS NULL OR btrim(v_game.name) = '' OR v_game.slug IS NULL OR btrim(v_game.slug) = '' THEN
    v_passed := FALSE;
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('name', 'game_metadata', 'passed', FALSE, 'detail', 'Name or slug missing'));
  ELSE
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('name', 'game_metadata', 'passed', TRUE, 'detail', 'Name and slug configured'));
  END IF;

  -- Level count and order
  SELECT count(*) INTO v_level_count FROM public.qr_levels WHERE game_id = p_game_id AND is_active = TRUE;
  IF v_level_count <> 10 THEN
    v_passed := FALSE;
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('name', 'level_count', 'passed', FALSE, 'detail', v_level_count || '/10 levels configured'));
  ELSE
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('name', 'level_count', 'passed', TRUE, 'detail', '10/10 levels configured'));
  END IF;

  -- Check sequential level numbers 1..10
  IF EXISTS (
    SELECT 1 FROM public.qr_levels
    WHERE game_id = p_game_id AND is_active = TRUE
    AND level_number NOT BETWEEN 1 AND 10
  ) THEN
    v_passed := FALSE;
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('name', 'level_order', 'passed', FALSE, 'detail', 'Invalid level numbers'));
  END IF;

  -- Location riddles
  SELECT count(*) INTO v_missing_riddles
  FROM public.qr_levels
  WHERE game_id = p_game_id AND is_active = TRUE
  AND (location_riddle IS NULL OR btrim(location_riddle) = '');
  IF v_missing_riddles > 0 THEN
    v_passed := FALSE;
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('name', 'location_riddles', 'passed', FALSE, 'detail', (10 - v_missing_riddles) || '/10 location riddles'));
  ELSE
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('name', 'location_riddles', 'passed', TRUE, 'detail', '10/10 location riddles'));
  END IF;

  -- Answer riddles
  SELECT count(*) INTO v_missing_riddles
  FROM public.qr_levels
  WHERE game_id = p_game_id AND is_active = TRUE
  AND (answer_riddle IS NULL OR btrim(answer_riddle) = '');
  IF v_missing_riddles > 0 THEN
    v_passed := FALSE;
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('name', 'answer_riddles', 'passed', FALSE, 'detail', (10 - v_missing_riddles) || '/10 answer riddles'));
  ELSE
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('name', 'answer_riddles', 'passed', TRUE, 'detail', '10/10 answer riddles'));
  END IF;

  -- Canonical answers configured (hash present)
  SELECT count(*) INTO v_missing_answers
  FROM public.qr_levels
  WHERE game_id = p_game_id AND is_active = TRUE
  AND (answer_hash IS NULL OR answer_hash = '');
  IF v_missing_answers > 0 THEN
    v_passed := FALSE;
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('name', 'answers_configured', 'passed', FALSE, 'detail', (10 - v_missing_answers) || '/10 answers configured'));
  ELSE
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('name', 'answers_configured', 'passed', TRUE, 'detail', '10/10 answers configured'));
  END IF;

  -- Tokens
  SELECT count(*) INTO v_missing_tokens
  FROM public.qr_levels
  WHERE game_id = p_game_id AND is_active = TRUE AND (token IS NULL OR token = '');
  IF v_missing_tokens > 0 THEN
    v_passed := FALSE;
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('name', 'qr_tokens', 'passed', FALSE, 'detail', (10 - v_missing_tokens) || '/10 QR tokens'));
  ELSE
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('name', 'qr_tokens', 'passed', TRUE, 'detail', '10/10 QR tokens'));
  END IF;

  -- Token uniqueness within game
  SELECT count(*) INTO v_duplicate_tokens
  FROM (SELECT token FROM public.qr_levels WHERE game_id = p_game_id AND is_active = TRUE GROUP BY token HAVING count(*) > 1) t;
  IF v_duplicate_tokens > 0 THEN
    v_passed := FALSE;
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('name', 'token_uniqueness', 'passed', FALSE, 'detail', v_duplicate_tokens || ' duplicate token(s)'));
  ELSE
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('name', 'token_uniqueness', 'passed', TRUE, 'detail', 'Token uniqueness verified'));
  END IF;

  -- Slug uniqueness
  SELECT EXISTS (SELECT 1 FROM public.qr_games WHERE slug = v_game.slug AND id != p_game_id) INTO v_slug_exists;
  IF v_slug_exists THEN
    v_passed := FALSE;
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('name', 'slug_unique', 'passed', FALSE, 'detail', 'Slug already exists'));
  ELSE
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('name', 'slug_unique', 'passed', TRUE, 'detail', 'Slug is unique'));
  END IF;

  -- Scoring config
  v_score_config_ok := (v_game.starting_score > v_game.score_floor AND v_game.score_start_level BETWEEN 1 AND 10);
  IF NOT v_score_config_ok THEN
    v_passed := FALSE;
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('name', 'scoring_config', 'passed', FALSE, 'detail', 'Invalid scoring configuration'));
  ELSE
    v_checks := v_checks || jsonb_build_array(jsonb_build_object('name', 'scoring_config', 'passed', TRUE, 'detail', 'Scoring configuration valid'));
  END IF;

  -- Store readiness snapshot
  UPDATE public.qr_games
  SET readiness = jsonb_build_object(
    'checks', v_checks,
    'passed', v_passed,
    'level_count', v_level_count
  ),
  readiness_checked_at = NOW()
  WHERE id = p_game_id;

  RETURN jsonb_build_object('passed', v_passed, 'checks', v_checks, 'level_count', v_level_count);
END;
$$;

-- ------------------------------------------------------------
-- GRANTS
-- ------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.create_hidden_trail_game TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.duplicate_hidden_trail_game TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.delete_hidden_trail_game TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.readiness_hidden_trail_game TO authenticated, service_role;

COMMIT;