-- ============================================================
-- PHASE 11 — KOA AUTHORITY + PHOTO + REALTIME EXPANSION
-- CHAPTER ONE — Supabase
-- SAFE ADDITIVE ONLY — NO DROP / NO DATA LOSS
-- ============================================================
-- 1. Grant service_role EXECUTE on the secure Hidden Trail functions
--    so Koa becomes the sole authoritative caller (browser never calls RPCs).
-- 2. Additive feature flags on qr_games.
-- 3. Scan log writing support (Koa writes analytics rows).
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. KOA AUTHORITY
--    The SECURITY DEFINER functions remain the atomic source of truth.
--    The browser must never invoke them directly; only the Koa
--    service-role client calls them with a JWT-verified user id.
-- ------------------------------------------------------------

GRANT EXECUTE ON FUNCTION public.validate_qr_token(TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_qr_answer(TEXT, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.start_qr_participant(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.hash_answer(TEXT) TO service_role;

-- ------------------------------------------------------------
-- 2. FEATURE FLAGS (additive)
-- ------------------------------------------------------------

ALTER TABLE public.qr_games
  ADD COLUMN IF NOT EXISTS photo_feature_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS gallery_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS live_display_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS photo_consent_text TEXT;

-- ------------------------------------------------------------
-- 3. SCAN LOG RESULT DOMAIN
--    Ensure the result domain covers the values Koa records for
--    analytics (already present from phase 5); idempotent re-check.
-- ------------------------------------------------------------

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

-- ------------------------------------------------------------
-- 4. PHOTO CONSENT (additive)
--    Records whether the participant agreed their photo may appear
--    in the event gallery. Gallery-visible photos require consent.
-- ------------------------------------------------------------

ALTER TABLE public.hidden_trail_photos
  ADD COLUMN IF NOT EXISTS photo_consent_granted BOOLEAN NOT NULL DEFAULT FALSE;

COMMIT;