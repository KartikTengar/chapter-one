-- Hidden Trail production lifecycle + photo storage
-- Idempotent migration for the current game-management lifecycle.

BEGIN;

ALTER TABLE public.qr_games
  DROP CONSTRAINT IF EXISTS qr_games_status_check;

ALTER TABLE public.qr_games
  ADD CONSTRAINT qr_games_status_check
  CHECK (
    status IN (
      'draft',
      'scheduled',
      'active',
      'ready',
      'running',
      'paused',
      'ended',
      'archived'
    )
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hidden-trail-photos',
  'hidden-trail-photos',
  false,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

UPDATE public.qr_games
SET photo_feature_enabled = TRUE,
    updated_at = NOW()
WHERE slug = 'hidden-trail'
  AND status = 'running'
  AND is_current = TRUE;

COMMIT;
