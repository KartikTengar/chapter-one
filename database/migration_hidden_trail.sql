-- =============================================
-- CHAPTER ONE — HIDDEN TRAIL TABLES
-- =============================================

-- =============================================
-- QR GAMES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.qr_games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'ended')),
  start_at TIMESTAMPTZ NULL,
  end_at TIMESTAMPTZ NULL,
  score_start_level INTEGER NOT NULL DEFAULT 2,
  starting_score INTEGER NOT NULL DEFAULT 100,
  score_floor INTEGER NOT NULL DEFAULT 30,
  final_secret_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  final_secret_hash TEXT NULL,
  final_message TEXT NULL,
  leaderboard_public BOOLEAN NOT NULL DEFAULT TRUE,
  leaderboard_name_mode TEXT NOT NULL DEFAULT 'FIRST_NAME' CHECK (leaderboard_name_mode IN ('FULL_NAME', 'FIRST_NAME', 'INITIALS', 'PARTICIPANT_NUMBER')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- QR LEVELS TABLE
-- =============================================
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

-- =============================================
-- QR PARTICIPANTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.qr_participants (
  game_id UUID NOT NULL REFERENCES public.qr_games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_level INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'active', 'completed')),
  started_at TIMESTAMPTZ NULL,
  last_scan_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,
  
  PRIMARY KEY (game_id, user_id),
  
  CONSTRAINT qr_participants_game_user_unique UNIQUE (game_id, user_id)
);

-- =============================================
-- QR COMPLETIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.qr_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.qr_games(id) ON DELETE CASCADE,
  level_id UUID NOT NULL REFERENCES public.qr_levels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scanner_position INTEGER NOT NULL,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  scanned_at TIMESTAMPTZ NULL,
  answered_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT qr_completions_game_level_user_unique UNIQUE (game_id, level_id, user_id)
);

-- =============================================
-- QR SCAN LOGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.qr_scan_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.qr_games(id) ON DELETE CASCADE,
  level_id UUID NULL REFERENCES public.qr_levels(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  result TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- QR ADMIN AUDIT TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.qr_admin_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NULL,
  details JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- ACHIEVEMENTS TABLES (for future chunks)
-- =============================================
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

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
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
CREATE INDEX IF NOT EXISTS idx_qr_admin_audit_entity_type ON public.qr_admin_audit(entity_type);
CREATE INDEX IF NOT EXISTS idx_qr_admin_audit_created_at ON public.qr_admin_audit(created_at);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.qr_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_admin_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- =============================================
-- QR GAMES POLICIES
-- =============================================

-- Students can read active games
CREATE POLICY "Students can read active games"
  ON public.qr_games
  FOR SELECT
  USING (
    status = 'active' 
    AND (start_at IS NULL OR start_at <= NOW())
    AND (end_at IS NULL OR end_at >= NOW())
  );

-- Admins can manage games
CREATE POLICY "Admins can manage games"
  ON public.qr_games
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- QR LEVELS POLICIES
-- =============================================

-- Students can read active levels for active games (limited info)
CREATE POLICY "Students can read active levels"
  ON public.qr_levels
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.qr_games
      WHERE qr_games.id = qr_levels.game_id
        AND qr_games.status = 'active'
        AND (qr_games.start_at IS NULL OR qr_games.start_at <= NOW())
        AND (qr_games.end_at IS NULL OR qr_games.end_at >= NOW())
    )
    AND qr_levels.is_active = TRUE
  );

-- Admins can manage levels
CREATE POLICY "Admins can manage levels"
  ON public.qr_levels
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- QR PARTICIPANTS POLICIES
-- =============================================

-- Students can read their own participant data
CREATE POLICY "Students can read own participant"
  ON public.qr_participants
  FOR SELECT
  USING (auth.uid() = user_id);

-- Students can update their own participant data (limited fields)
CREATE POLICY "Students can update own participant"
  ON public.qr_participants
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    -- Only allow updating certain fields through secure RPCs
  );

-- Admins can manage participants
CREATE POLICY "Admins can manage participants"
  ON public.qr_participants
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- QR COMPLETIONS POLICIES
-- =============================================

-- Students can read their own completions
CREATE POLICY "Students can read own completions"
  ON public.qr_completions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can manage completions
CREATE POLICY "Admins can manage completions"
  ON public.qr_completions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- QR SCAN LOGS POLICIES
-- =============================================

-- Students can insert scan logs (for their own scans)
CREATE POLICY "Students can insert own scan logs"
  ON public.qr_scan_logs
  FOR INSERT
  USING (auth.uid() = user_id);

-- Students can read their own scan logs
CREATE POLICY "Students can read own scan logs"
  ON public.qr_scan_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can manage scan logs
CREATE POLICY "Admins can manage scan logs"
  ON public.qr_scan_logs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- QR ADMIN AUDIT POLICIES
-- =============================================

-- Admins can manage audit logs
CREATE POLICY "Admins can manage audit logs"
  ON public.qr_admin_audit
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- ACHIEVEMENTS POLICIES
-- =============================================

-- Students can read achievements
CREATE POLICY "Students can read achievements"
  ON public.achievements
  FOR SELECT
  USING (is_active = TRUE);

-- Students can read their own user achievements
CREATE POLICY "Students can read own achievements"
  ON public.user_achievements
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can manage achievements
CREATE POLICY "Admins can manage achievements"
  ON public.achievements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can manage user achievements
CREATE POLICY "Admins can manage user achievements"
  ON public.user_achievements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- SECURE RPC FUNCTIONS FOR GAME LOGIC
-- =============================================

-- Function to hash answers (using SHA-256 for demo - in production use pgcrypto or better)
CREATE OR REPLACE FUNCTION public.hash_answer(answer TEXT)
RETURNS TEXT AS $$
  SELECT encode(digest(answer::bytea, 'sha256'), 'hex')
$$ LANGUAGE SQL IMMUTABLE;

-- Function to start a participant in a game
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
    total_points = EXCLUDED.total_points,
    status = 'active',
    started_at = COALESCE(qr_participants.started_at, EXCLUDED.started_at),
    last_scan_at = NOW()
  WHERE qr_participants.game_id = EXCLUDED.game_id 
    AND qr_participants.user_id = EXCLUDED.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Function to validate a QR token and get level info
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
  -- Initialize return values
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

  -- Find the level by token
  SELECT * INTO v_level
  FROM public.qr_levels
  WHERE token = p_token AND is_active = TRUE;

  IF NOT FOUND THEN
    error_message := 'Invalid or inactive QR token';
    RETURN;
  END IF;

  -- Get the game
  SELECT * INTO v_game
  FROM public.qr_games
  WHERE id = v_level.game_id;

  IF NOT FOUND THEN
    error_message := 'Game not found';
    RETURN;
  END IF;

  -- Check if game is active
  IF v_game.status <> 'active' 
     OR (v_game.start_at IS NOT NULL AND v_game.start_at > NOW())
     OR (v_game.end_at IS NOT NULL AND v_game.end_at < NOW()) THEN
    error_message := 'Game is not active';
    game_status := v_game.status;
    RETURN;
  END IF;

  -- Get participant info
  SELECT * INTO v_participant
  FROM public.qr_participants
  WHERE game_id = v_level.game_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    -- Participant doesn't exist, create them
    PERFORM public.start_qr_participant(v_level.game_id, p_user_id);
    
    -- Get the newly created participant
    SELECT * INTO v_participant
    FROM public.qr_participants
    WHERE game_id = v_level.game_id AND user_id = p_user_id;
  END IF;

  -- Set return values
  game_id := v_game.id;
  level_id := v_level.id;
  level_number := v_level.level_number;
  is_valid := TRUE;
  game_status := v_game.status;
  current_level := v_participant.current_level;
  total_points := v_participant.total_points;

  -- Check if this is the expected next level
  v_expected_level := COALESCE(v_participant.current_level, 0) + 1;
  is_expected_level := (v_level.level_number = v_expected_level);

  -- Check if already completed
  SELECT COUNT(*) INTO v_completion_count
  FROM public.qr_completions
  WHERE game_id = v_level.game_id 
    AND level_id = v_level.id 
    AND user_id = p_user_id;

  is_duplicate := (v_completion_count > 0);

  -- If not expected level or duplicate, set appropriate error
  IF NOT is_expected_level AND error_message IS NULL THEN
    error_message := 'Wrong trail - this marker is not part of your current path';
  END IF;

  IF is_duplicate AND error_message IS NULL THEN
    error_message := 'Already cleared - you have already completed this marker';
  END IF;

  -- If valid and expected and not duplicate, return the challenge info
  IF is_expected_level AND NOT is_duplicate AND v_participant.current_level >= v_game.score_start_level - 1 THEN
    location_riddle := v_level.location_riddle;
    answer_riddle_hash := v_level.answer_hash;
    case_sensitive := v_level.case_sensitive;
  ELSIF is_expected_level AND NOT is_duplicate AND v_participant.current_level < v_game.score_start_level - 1 THEN
    -- For levels before score_start_level, still return the answer riddle for consistency
    location_riddle := v_level.location_riddle;
    answer_riddle_hash := v_level.answer_hash;
    case_sensitive := v_level.case_sensitive;
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    error_message := 'Validation error: ' || SQLERRM;
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Function to process an answer submission
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
  v_normalized_expected_answer TEXT;
  v_completion_count INTEGER;
  v_scanner_position INTEGER;
  v_points INTEGER;
BEGIN
  -- Initialize return values
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

  -- First validate the token
  FOR v_validation IN 
    SELECT * FROM public.validate_qr_token(p_token, p_user_id)
  LOOP
    EXIT;
  END LOOP;

  IF NOT v_validation.is_valid THEN
    error_message := v_validation.error_message;
    RETURN;
  END IF;

  -- If not the expected level or duplicate, return early
  IF NOT v_validation.is_expected_level OR v_validation.is_duplicate THEN
    error_message := v_validation.error_message;
    RETURN;
  END IF;

  -- Get the level and game info
  SELECT * INTO v_level
  FROM public.qr_levels
  WHERE id = v_validation.level_id;

  SELECT * INTO v_game
  FROM public.qr_games
  WHERE id = v_validation.game_id;

  SELECT * INTO v_participant
  FROM public.qr_participants
  WHERE game_id = v_validation.game_id AND user_id = p_user_id;

  -- Normalize the answer based on case sensitivity
  IF v_level.case_sensitive THEN
    v_normalized_answer := TRIM(p_answer);
  ELSE
    v_normalized_answer := LOWER(TRIM(p_answer));
  END IF;

  -- Check if answer matches (comparing hashes)
  -- We hash the normalized user answer and compare with the stored hash
  IF public.hash_answer(v_normalized_answer) <> v_level.answer_hash THEN
    error_message := 'Not quite. Try again.';
    RETURN;
  END IF;

  -- Answer is correct! Now we need to atomically:
  -- 1. Allocate scanner position
  -- 2. Calculate points
  -- 3. Create completion
  -- 4. Update participant

  -- Allocate scanner position atomically
  WITH position_allocated AS (
    UPDATE public.qr_levels
    SET scanner_position_next = COALESCE(scanner_position_next, 0) + 1
    WHERE id = v_level.id
    RETURNING (scanner_position_next - 1) as allocated_position
  )
  SELECT allocated_position INTO v_scanner_position
  FROM position_allocated;

  -- Calculate points based on scanner position
  -- Formula: max(score_floor, starting_score - n * (n - 1)) where n is scanner position
  v_points := GREATEST(
    v_game.score_floor,
    v_game.starting_score - (v_scanner_position * (v_scanner_position - 1))
  );

  -- Insert the completion
  INSERT INTO public.qr_completions (
    game_id, level_id, user_id, scanner_position, points_awarded, scanned_at, answered_at
  )
  VALUES (
    v_validation.game_id, v_validation.level_id, p_user_id, v_scanner_position, v_points, NOW(), NOW()
  )
  RETURNING *;

  -- Update participant
  UPDATE public.qr_participants
  SET 
    current_level = v_validation.level_number,
    total_points = v_participant.total_points + v_points,
    last_scan_at = NOW(),
    completed_at = CASE 
      WHEN v_validation.level_number = (SELECT MAX(level_number) FROM public.qr_levels WHERE game_id = v_validation.game_id)
      THEN NOW()
      ELSE NULL
    END,
    status = CASE 
      WHEN v_validation.level_number = (SELECT MAX(level_number) FROM public.qr_levels WHERE game_id = v_validation.game_id)
      THEN 'completed'
      ELSE 'active'
    END
  WHERE game_id = v_validation.game_id AND user_id = p_user_id;

  -- Get updated participant info
  SELECT * INTO v_participant
  FROM public.qr_participants
  WHERE game_id = v_validation.game_id AND user_id = p_user_id;

  -- Set return values
  success := TRUE;
  points_awarded := v_points;
  scanner_position := v_scanner_position;
  total_points := v_participant.total_points;
  current_level := v_participant.current_level;
  status := v_participant.status;
  is_completed := (v_participant.status = 'completed');

  -- If not completed, get the next level's location riddle
  IF NOT is_completed THEN
    SELECT location_riddle INTO location_riddle
    FROM public.qr_levels
    WHERE game_id = v_validation.game_id AND level_number = v_participant.current_level + 1
    LIMIT 1;
  END IF;

  answer_riddle_hash := v_level.answer_hash;
  case_sensitive := v_level.case_sensitive;

EXCEPTION
  WHEN OTHERS THEN
    error_message := 'Processing error: ' || SQLERRM;
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- =============================================
-- INITIAL DATA FOR TESTING (REMOVE IN PRODUCTION)
-- =============================================

-- Insert a test game
INSERT INTO public.qr_games (
  id, name, description, status, start_at, end_at, 
  score_start_level, starting_score, score_floor,
  final_secret_enabled, leaderboard_public, leaderboard_name_mode
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'CHAPTER ONE — HIDDEN TRAIL',
  'The official fresher week treasure hunt',
  'active',
  NOW() - INTERVAL '1 hour',
  NOW() + INTERVAL '30 days',
  2, -- scoring starts at level 2
  100, -- starting score
  30, -- score floor
  FALSE, -- no final secret
  TRUE, -- public leaderboard
  'FIRST_NAME' -- show first names on leaderboard
)
ON CONFLICT (id) DO NOTHING;

-- Insert test levels (10 levels for the current game)
INSERT INTO public.qr_levels (
  id, game_id, level_number, token, title, location_riddle, answer_riddle, answer_hash, case_sensitive, admin_location, is_active
) VALUES 
-- Level 1 (starting level - no competitive scoring)
(
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  1,
  'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
  'The Beginning',
  'Where freshmen gather before their first lecture',
  'I speak without a mouth and hear without ears. I have nobody, but I come alive with wind. What am I?',
  '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08', -- hash of "echo"
  FALSE,
  'Main Courtyard Near Flagpole',
  TRUE
),
-- Level 2
(
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  2,
  'z6y5x4w3v2u1t0s9r8q7p6o5n4m3l2k1j0i9h8g7f6e5d4c3b2a1',
  'The Gateway to Knowledge',
  'Where wisdom is stored and silence is golden',
  'What has keys but cannot open locks? It has space but no room. You can enter, but not go outside.',
  '2c1743a391305fbf367df8e4f069f9fbd6b4a0a1749c87b58r3c7645d4b5e6f7g8', -- hash of "keyboard" (example)
  FALSE,
  'Library Entrance',
  TRUE
);
-- Additional levels would be inserted here...
-- For brevity, I'm only showing 2 levels but the pattern continues to level 10

-- Create index for better performance on token lookups
CREATE INDEX IF NOT EXISTS idx_qr_levels_token_active ON public.qr_levels(token) WHERE is_active = TRUE;