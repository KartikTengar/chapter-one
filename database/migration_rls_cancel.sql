-- =============================================
-- EVENT REGISTRATION RLS: Student Cancellation
-- =============================================
-- Allow students to delete their own registrations
CREATE POLICY "Students can cancel own registration"
  ON public.event_registrations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Allow students to read all registrations for their events
-- (Already covered by existing "Students can read own registrations")