-- =============================================================================
-- بوابة كنيسة القديسين مكسيموس ودوماديوس والأنبا موسى الأسود
-- 01 / 07 — الامتدادات والأنواع المخصصة (Extensions & Custom ENUMs)
-- Source: BACKEND_AND_DATA_SPEC.md §2.1 (staff_role_enum) + §3.1 (all ENUMs)
-- Apply order: 1st. Every later migration depends on these types.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- -----------------------------------------------------------------------------
-- 3.1 الأنواع المخصصة (Custom ENUMs)
-- PostgreSQL has no `CREATE TYPE IF NOT EXISTS`, so each type is wrapped in a
-- guarded DO block: re-running the file on a database that already has the type
-- is a no-op instead of an error.
-- -----------------------------------------------------------------------------

DO $$
BEGIN
    CREATE TYPE day_of_week_enum AS ENUM (
        'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE booking_status_enum AS ENUM (
        'pending', 'approved', 'rejected', 'cancelled'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE education_level_enum AS ENUM (
        'preparatory', 'elementary', 'advanced', 'diploma', 'general'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE contact_urgency_enum AS ENUM (
        'normal', 'spiritual_urgent', 'confession_request', 'emergency'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- جديد v1.1 (§2.1 + §3.1)
DO $$
BEGIN
    CREATE TYPE staff_role_enum AS ENUM ('admin', 'secretary', 'servant', 'priest');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE exception_action_enum AS ENUM ('cancelled', 'added', 'modified');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE alert_severity_enum AS ENUM ('info', 'warning', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE stream_status_enum AS ENUM ('scheduled', 'live', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE application_status_enum AS ENUM ('pending', 'contacted', 'accepted', 'rejected', 'waitlisted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
