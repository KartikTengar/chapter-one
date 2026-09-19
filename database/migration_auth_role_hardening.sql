BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    'student'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_profile_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
SET row_security = off;

ALTER FUNCTION public.is_profile_admin() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.is_profile_admin() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_profile_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.enforce_profile_identity_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.role IS DISTINCT FROM OLD.role THEN
    IF CURRENT_USER <> 'postgres'
       OR COALESCE(current_setting('role', true), 'none') NOT IN ('none', 'postgres')
       OR auth.uid() IS NOT NULL THEN
      RAISE EXCEPTION 'Profile id and role changes require a trusted database operation'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER
SET search_path = '';

ALTER FUNCTION public.enforce_profile_identity_role() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.enforce_profile_identity_role() FROM PUBLIC, anon, authenticated, service_role;

DROP TRIGGER IF EXISTS profiles_identity_role_guard ON public.profiles;
CREATE TRIGGER profiles_identity_role_guard
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_identity_role();

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.profiles FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  profile_columns TEXT;
BEGIN
  SELECT string_agg(quote_ident(attname), ', ' ORDER BY attnum)
  INTO profile_columns
  FROM pg_catalog.pg_attribute
  WHERE attrelid = 'public.profiles'::regclass
    AND attnum > 0 AND NOT attisdropped;

  EXECUTE format(
    'REVOKE INSERT (%s), UPDATE (%s) ON TABLE public.profiles FROM PUBLIC, anon, authenticated',
    profile_columns, profile_columns
  );
END;
$$;

GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT UPDATE (full_name, email, avatar_url, college_id, year, branch, phone)
  ON TABLE public.profiles TO authenticated;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can read own profile" ON public.profiles;
CREATE POLICY "Students can read own profile"
  ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Students can update own profile" ON public.profiles;
CREATE POLICY "Students can update own profile"
  ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles"
  ON public.profiles
  FOR SELECT TO authenticated
  USING ((SELECT public.is_profile_admin()));

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles
  FOR UPDATE TO authenticated
  USING ((SELECT public.is_profile_admin()))
  WITH CHECK ((SELECT public.is_profile_admin()));

COMMIT;
