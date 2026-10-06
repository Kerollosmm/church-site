-- =============================================================================
-- Migration 20: Covering Indexes for Foreign Keys & RLS InitPlan Optimizations
-- Adds missing FK indexes to optimize cascade checks and JOIN performance.
-- Updates auth.uid() references to (select auth.uid()) for InitPlan query caching.
-- =============================================================================

-- 1. Covering indexes for active foreign keys (optimizes cascade deletes and foreign key joins)
-- mass_schedules.altar_id -> altars(id)
CREATE INDEX IF NOT EXISTS idx_mass_schedules_altar_id ON public.mass_schedules (altar_id);

-- mass_exceptions.original_schedule_id -> mass_schedules(id)
CREATE INDEX IF NOT EXISTS idx_mass_exceptions_original_schedule_id ON public.mass_exceptions (original_schedule_id);

-- events.venue_id -> taxonomy_terms(id)
CREATE INDEX IF NOT EXISTS idx_events_venue_id ON public.events (venue_id);

-- contact_messages.assigned_priest_id -> clergy(id)
CREATE INDEX IF NOT EXISTS idx_contact_messages_priest_id ON public.contact_messages (assigned_priest_id);

-- media.uploaded_by -> profiles(id)
CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON public.media (uploaded_by);

-- events.created_by -> profiles(id)
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events (created_by);

-- events.updated_by -> profiles(id)
CREATE INDEX IF NOT EXISTS idx_events_updated_by ON public.events (updated_by);

-- event_exceptions.created_by -> profiles(id)
CREATE INDEX IF NOT EXISTS idx_event_exceptions_created_by ON public.event_exceptions (created_by);

-- event_exceptions.updated_by -> profiles(id)
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
