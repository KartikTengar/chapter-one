-- Supabase SQL Migration: CHAPTER ONE
-- Paste this into the Supabase SQL Editor
-- Requires: supabase init (or Supabase project created)

-- =============================================
-- PROFILES TABLE
-- =============================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT DEFAULT NULL,
  college_id TEXT DEFAULT NULL,
  year TEXT DEFAULT NULL,
  branch TEXT DEFAULT NULL,
  phone TEXT DEFAULT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT profiles_role_check CHECK (role IN ('student', 'admin'))
);

-- Auto-create profile on signup
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update updated_at on profile update
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- EVENTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  image_url TEXT DEFAULT NULL,
  category TEXT DEFAULT 'general',
  max_participants INTEGER DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- EVENT_REGISTRATIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_registration UNIQUE (user_id, event_id)
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id
  ON public.event_registrations(user_id);

CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id
  ON public.event_registrations(event_id);

CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON public.profiles(role);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Students can read own profile"
  ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Students can update own profile"
  ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON public.profiles
  FOR SELECT TO authenticated
  USING ((SELECT public.is_profile_admin()));

CREATE POLICY "Admins can update any profile"
  ON public.profiles
  FOR UPDATE TO authenticated
  USING ((SELECT public.is_profile_admin()))
  WITH CHECK ((SELECT public.is_profile_admin()));

-- Events: anyone can read published events
CREATE POLICY "Anyone can read events"
  ON public.events
  FOR SELECT
  USING (true);

-- Events: admins can create/update/delete all events
CREATE POLICY "Admins can create events"
  ON public.events
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update events"
  ON public.events
  FOR UPDATE
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

CREATE POLICY "Admins can delete events"
  ON public.events
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Event registrations: students can create their own
CREATE POLICY "Students can create own registration"
  ON public.event_registrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Event registrations: students can read own registrations
CREATE POLICY "Students can read own registrations"
  ON public.event_registrations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Event registrations: admins can read all
CREATE POLICY "Admins can read all registrations"
  ON public.event_registrations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Event registrations: admins can delete any
CREATE POLICY "Admins can delete any registration"
  ON public.event_registrations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- SEED: Create initial admin user
-- Run this AFTER creating the first admin via Supabase dashboard
-- Or use the Supabase dashboard to manually set role='admin' on any user
-- =============================================
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'YOUR_ADMIN_EMAIL_HERE';

COMMIT;
