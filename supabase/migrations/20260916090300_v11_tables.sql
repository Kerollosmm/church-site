-- =============================================================================
-- 04 / 07 — جداول v1.1 الجديدة (v1.1 tables)
-- Source: BACKEND_AND_DATA_SPEC.md §3.3 (tables 16..22)
-- Apply order: 4th. Depends on files 01 (ENUMs), 02 (profiles + normalize_arabic)
--                          and 03 (altars, mass_schedules, clinic_specialties).
--
-- Schema only — no seed rows are inserted by any migration file.
-- Every FK is inline REFERENCES so Postgres names it <table>_<column>_fkey.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 16. استثناءات القداسات الموسمية (mass_exceptions)
-- يلبي متطلب إدارة "قداسات الأعياد والأصوام" وتعديلات المواعيد الطارئة دون مساس
-- بالجدول الأسبوعي الثابت — يغذي شريط التنبيهات وصفحة /masses.
-- FK mass_exceptions_altar_id_fkey / mass_exceptions_original_schedule_id_fkey /
--    mass_exceptions_created_by_fkey
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mass_exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exception_date DATE NOT NULL,
    altar_id UUID REFERENCES altars(id) ON DELETE SET NULL,
    original_schedule_id UUID REFERENCES mass_schedules(id) ON DELETE SET NULL,
    action exception_action_enum NOT NULL DEFAULT 'added',
    title_ar VARCHAR(200) NOT NULL,
    start_time TIME,
    end_time TIME,
    notes_ar TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 17. شريط التنبيهات المركزي (site_alerts)
-- يغذي "شريط التنبيهات ونبض الخدمة" في القالب الموحد (INFORMATION_ARCHITECTURE §2.5).
-- FK site_alerts_created_by_fkey
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_ar TEXT NOT NULL,
    severity alert_severity_enum NOT NULL DEFAULT 'info',
    placement VARCHAR(30) NOT NULL DEFAULT 'all',  -- home | masses | clinics | all
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ends_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 18. البث المباشر والأرشيف (stream_events)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stream_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_ar VARCHAR(200) NOT NULL,
    platform VARCHAR(30) NOT NULL DEFAULT 'youtube',  -- youtube | facebook
    stream_url TEXT NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ,
    status stream_status_enum NOT NULL DEFAULT 'scheduled',
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 19. طلبات التسجيل في المدارس والأنشطة (program_applications)
-- يلبي متطلبات: مدرسة الشمامسة §3.4.1، كاروز §3.4.4، النادي الصيفي §3.5.7.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS program_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_slug VARCHAR(100) NOT NULL,  -- deacon-school | karouz-academy | children-bible | cithara-choir | summer-club | educational-center
    applicant_name VARCHAR(255) NOT NULL,
    applicant_birth_date DATE,
    applicant_stage_ar VARCHAR(150),
    guardian_name VARCHAR(255),
    guardian_phone VARCHAR(50) NOT NULL,
    confession_father_ar VARCHAR(255),
    requested_level_ar VARCHAR(150),
    notes_ar TEXT,
    status application_status_enum NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 20. طلبات التوظيف (job_applications) — مكتب التوظيف §3.6.5
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    profession_ar VARCHAR(200) NOT NULL,
    experience_years INT,
    cv_url TEXT,                          -- Supabase Storage bucket: cvs (public read off)
    notes_ar TEXT,
    status application_status_enum NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 21. اشتراكات تنبيهات واتساب للعيادات (clinic_alert_subscriptions) — PRD §3.2.3
-- الإرسال الفعلي عبر واتساب يُنفذ يدوياً من الإدارة في المرحلة الأولى (Phase 2 للأتمتة).
-- FK clinic_alert_subscriptions_specialty_id_fkey
-- NOTE: specialty_id is NOT NULL to match src/types/database.types.ts, where it
--       is a required column (Insert.specialty_id: string).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clinic_alert_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(50) NOT NULL,
    specialty_id UUID NOT NULL REFERENCES clinic_specialties(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (phone, specialty_id)
);

-- -----------------------------------------------------------------------------
-- 22. الكتاب المقدس القانوني (bible_books + bible_verses) — PRD §3.7.3
-- text_normalized uses normalize_arabic() from file 02 (IMMUTABLE, so it is
-- legal in a STORED generated column).
-- FK bible_verses_book_id_fkey
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bible_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    canonical_order INT NOT NULL UNIQUE,
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    testament VARCHAR(20) NOT NULL,        -- old | new
    is_deuterocanonical BOOLEAN NOT NULL DEFAULT FALSE,
    chapters_count INT NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS bible_verses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID NOT NULL REFERENCES bible_books(id) ON DELETE CASCADE,
    chapter INT NOT NULL,
    verse INT NOT NULL,
    text_ar TEXT NOT NULL,
    text_normalized TEXT GENERATED ALWAYS AS (normalize_arabic(text_ar)) STORED,
    UNIQUE (book_id, chapter, verse)
);
