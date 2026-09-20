-- Predefined JEC branches for profile data and branch-wise leaderboards.
BEGIN;

UPDATE public.profiles
SET branch = NULL
WHERE branch IS NOT NULL AND NULLIF(TRIM(branch), '') IS NULL;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_branch_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_branch_check
  CHECK (
    branch IS NULL OR branch = ANY (ARRAY[
      'CSE','IT','ECE','AI&DS','EE','ME','CE','MT','IP'
    ])
  );

CREATE INDEX IF NOT EXISTS idx_profiles_branch ON public.profiles(branch);

COMMIT;
