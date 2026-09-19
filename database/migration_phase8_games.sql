-- PHASE 8 — GAMES FOUNDATION
-- Additive migration for generic games registry
BEGIN;

CREATE TABLE IF NOT EXISTS public.games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','UPCOMING','LIVE','PAUSED','ENDED','ARCHIVED')),
  starts_at TIMESTAMPTZ NULL,
  ends_at TIMESTAMPTZ NULL,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  master_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_games_slug ON public.games(slug);
CREATE INDEX IF NOT EXISTS idx_games_status ON public.games(status);
CREATE INDEX IF NOT EXISTS idx_games_visible ON public.games(is_visible);

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Public read for visible games
CREATE POLICY "Public can read visible games"
ON public.games
FOR SELECT
USING (is_visible = TRUE);

-- Admins can manage games
CREATE POLICY "Admins can manage games"
ON public.games
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

-- Seed Hidden Trail as first generic game
INSERT INTO public.games (slug, name, description, cover_url, status, starts_at, ends_at, is_visible, master_enabled)
VALUES (
  'hidden-trail',
  'Hidden Trail',
  'The official fresher week treasure hunt.',
  NULL,
  'LIVE',
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '30 days',
  TRUE,
  FALSE
)
ON CONFLICT (slug) DO NOTHING;

COMMIT;
