-- Keep live/running Hidden Trail scores in the master leaderboard.
BEGIN;

CREATE OR REPLACE VIEW public.hidden_trail_results AS
SELECT
  'hidden-trail'::TEXT AS slug,
  p.user_id,
  COALESCE(p.total_points, 0) AS game_score,
  COALESCE(p.total_points, 0) AS master_points,
  p.completed_at
FROM public.qr_participants p
JOIN public.qr_games g ON g.id = p.game_id
WHERE g.status IN ('active', 'running');

COMMIT;
