-- Keep profile full_name synchronized from Supabase Auth metadata at account creation.
-- Also backfill existing profiles when Auth already contains full_name.

BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), ''),
    NEW.email,
    'student'
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = CASE
          WHEN NULLIF(TRIM(public.profiles.full_name), '') IS NULL
           AND NULLIF(TRIM(EXCLUDED.full_name), '') IS NOT NULL
          THEN EXCLUDED.full_name
          ELSE public.profiles.full_name
        END;
  RETURN NEW;
END;
$$;

ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated, service_role;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

UPDATE public.profiles p
SET full_name = NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), '')
FROM auth.users u
WHERE p.id = u.id
  AND NULLIF(TRIM(p.full_name), '') IS NULL
  AND NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), '') IS NOT NULL;

COMMIT;
