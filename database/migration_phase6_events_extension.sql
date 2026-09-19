-- Phase 6: Extend events table additively
BEGIN;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS registration_open BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ NULL;

-- Optional indexes
CREATE INDEX IF NOT EXISTS idx_events_featured ON public.events(featured);
CREATE INDEX IF NOT EXISTS idx_events_registration_open ON public.events(registration_open);

COMMIT;
