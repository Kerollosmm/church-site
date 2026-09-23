-- =============================================================================
-- Migration 20: Covering Indexes for Foreign Keys & RLS InitPlan Optimizations
-- Adds missing FK indexes to optimize cascade checks and JOIN performance.
-- Updates auth.uid() references to (select auth.uid()) for InitPlan query caching.
-- =============================================================================

-- 1. Covering indexes for active foreign keys
CREATE INDEX IF NOT EXISTS idx_mass_schedules_altar_id ON public.mass_schedules (altar_id);
CREATE INDEX IF NOT EXISTS idx_mass_exceptions_schedule_id ON public.mass_exceptions (mass_schedule_id);
CREATE INDEX IF NOT EXISTS idx_events_category_id ON public.events (category_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_priest_id ON public.contact_messages (assigned_priest_id);
CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON public.media (uploaded_by);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events (created_by);
CREATE INDEX IF NOT EXISTS idx_events_updated_by ON public.events (updated_by);
CREATE INDEX IF NOT EXISTS idx_event_exceptions_created_by ON public.event_exceptions (created_by);
CREATE INDEX IF NOT EXISTS idx_event_exceptions_updated_by ON public.event_exceptions (updated_by);

-- 2. RLS InitPlan optimizations
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = (select auth.uid()));

CREATE OR REPLACE FUNCTION public.is_staff() RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid()) AND is_active
      AND role IN ('admin', 'secretary')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_editor() RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid()) AND is_active
      AND role IN ('admin', 'secretary')
  );
$$;
