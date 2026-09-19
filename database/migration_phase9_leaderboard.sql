-- PHASE 9 — LEADERBOARD SYSTEM
BEGIN;

CREATE TABLE IF NOT EXISTS public.game_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_score NUMERIC NOT NULL DEFAULT 0,
  master_points NUMERIC NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_game_user UNIQUE (game_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_game_results_game_id ON public.game_results(game_id);
CREATE INDEX IF NOT EXISTS idx_game_results_user_id ON public.game_results(user_id);
CREATE INDEX IF NOT EXISTS idx_game_results_master_points ON public.game_results(master_points DESC);

ALTER TABLE public.game_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own game results"
ON public.game_results
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage game results"
ON public.game_results
FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Helper view to map Hidden Trail participants to game_results format
CREATE OR REPLACE VIEW public.hidden_trail_results AS
SELECT
  'hidden-trail'::TEXT AS slug,
  p.user_id,
  COALESCE(p.total_points, 0) AS game_score,
  COALESCE(p.total_points, 0) AS master_points,
  p.completed_at
FROM public.qr_participants p
JOIN public.qr_games g ON g.id = p.game_id
WHERE g.status = 'active';

COMMIT;
