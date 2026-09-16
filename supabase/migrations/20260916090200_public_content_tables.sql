-- =============================================================================
-- 03 / 07 — جداول المحتوى العام (Public content tables)
-- Source: BACKEND_AND_DATA_SPEC.md §3.2 (tables 1..15)
-- Apply order: 3rd. Depends on files 01 (uuid-ossp, ENUMs) and 02 (profiles).
--
-- Schema only — no seed rows are inserted by any migration file.
--
-- NOTE ON NULLABILITY: every column that carries a DEFAULT in §3 is declared
-- NOT NULL here, because src/types/database.types.ts (the application contract)
-- types those columns as non-nullable. All other columns keep the spec's
-- exact names, types, defaults, inline REFERENCES and ON DELETE actions.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. المذابح (altars) — بلا تغيير
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS altars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    patron_saint VARCHAR(255) NOT NULL,
    consecration_date DATE,
    description_ar TEXT NOT NULL,
    historical_notes TEXT,
    image_url TEXT,
    display_order INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. الكهنة (clergy) — بلا تغيير
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clergy (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerical_name_ar VARCHAR(255) NOT NULL,
    clerical_name_en VARCHAR(255),
    rank_title_ar VARCHAR(100) NOT NULL DEFAULT 'قس',
    ordination_date DATE NOT NULL,
    hegumen_date DATE,
    feast_day VARCHAR(150),
    responsibilities_ar TEXT NOT NULL,
    confession_hours_ar TEXT NOT NULL,
    phone_office VARCHAR(50),
    whatsapp_number VARCHAR(50),
    email VARCHAR(255),
    photo_url TEXT,
    bio_ar TEXT,
    display_order INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. القداسات الأسبوعية (mass_schedules) — بلا تغيير
-- FK mass_schedules_altar_id_fkey / mass_schedules_celebrant_priest_id_fkey
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mass_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    altar_id UUID NOT NULL REFERENCES altars(id) ON DELETE RESTRICT,
    celebrant_priest_id UUID REFERENCES clergy(id) ON DELETE SET NULL,
    day_of_week day_of_week_enum NOT NULL,
    title_ar VARCHAR(150) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    target_group_ar VARCHAR(150) NOT NULL DEFAULT 'عام لجميع الشعب',
    notes_ar TEXT,
    is_seasonal BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 4. تخصصات العيادات (clinic_specialties) — بلا تغيير
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clinic_specialties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_ar VARCHAR(150) NOT NULL UNIQUE,
    name_en VARCHAR(150) NOT NULL UNIQUE,
    slug VARCHAR(150) NOT NULL UNIQUE,
    description_ar TEXT,
    room_number VARCHAR(50),
    icon_name VARCHAR(100) NOT NULL DEFAULT 'Stethoscope',
    display_order INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 5. الاجتماعات (church_meetings) — بلا تغيير (11 قطاعاً في البذر)
-- FK church_meetings_supervising_priest_id_fkey
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS church_meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_ar VARCHAR(200) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    target_age_ar VARCHAR(150) NOT NULL,
    patron_saint VARCHAR(150),
    motto_verse_ar TEXT NOT NULL,
    bible_reference VARCHAR(100) NOT NULL,
    day_of_week day_of_week_enum NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location_hall_ar VARCHAR(150) NOT NULL,
    supervising_priest_id UUID REFERENCES clergy(id) ON DELETE SET NULL,
    servant_in_charge_ar VARCHAR(200) NOT NULL,
    whatsapp_group_link TEXT,
    telegram_channel_link TEXT,
    description_ar TEXT NOT NULL,
    cover_image_url TEXT,
    display_order INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 9. المدارس والأكاديميات (schools_academies) — بلا تغيير (5 صفوف في البذر)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schools_academies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_ar VARCHAR(200) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    category_type VARCHAR(100) NOT NULL,
    curriculum_summary_ar TEXT NOT NULL,
    academic_stages_count INT NOT NULL DEFAULT 1,
    registration_open BOOLEAN NOT NULL DEFAULT FALSE,
    registration_start_date DATE,
    registration_deadline DATE,
    responsible_servant_ar VARCHAR(200) NOT NULL,
    study_schedule_ar TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 10. الأنشطة (activities) — بلا تغيير
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_ar VARCHAR(200) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
    description_ar TEXT NOT NULL,
    target_audience_ar VARCHAR(150) NOT NULL,
    schedule_text_ar TEXT NOT NULL,
    location_ar VARCHAR(150) NOT NULL,
    responsible_servant_ar VARCHAR(200) NOT NULL,
    whatsapp_link TEXT,
    display_order INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 11. الخدمات العامة (public_services) — بلا تغيير
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_ar VARCHAR(200) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    service_type VARCHAR(100) NOT NULL,
    description_ar TEXT NOT NULL,
    working_hours_ar VARCHAR(200) NOT NULL,
    location_ar VARCHAR(150) NOT NULL,
    contact_phone VARCHAR(50),
    contact_whatsapp VARCHAR(50),
    guidelines_ar TEXT,
    display_order INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 12. حجوزات قاعة العزاء (condolence_bookings)
-- The inline UNIQUE on booking_reference_code intentionally produces the
-- constraint name `condolence_bookings_booking_reference_code_key`, which
-- src/actions/condolence-actions.ts matches to distinguish a reference-code
-- collision from a date clash (see also uq_condolence_active_date in file 06).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS condolence_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_reference_code VARCHAR(20) NOT NULL UNIQUE,  -- => condolence_bookings_booking_reference_code_key
    deceased_full_name VARCHAR(255) NOT NULL,
    applicant_name VARCHAR(255) NOT NULL,
    applicant_phone VARCHAR(50) NOT NULL,
    applicant_national_id VARCHAR(30),
    relationship_to_deceased VARCHAR(100) NOT NULL,
    event_date DATE NOT NULL,
    slot_time VARCHAR(100) NOT NULL DEFAULT 'مسائي من 6:00 م إلى 10:00 م',
    hall_name VARCHAR(100) NOT NULL DEFAULT 'قاعة العزاء الرئيسية المجهزة',
    special_requests TEXT,
    status booking_status_enum NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    approved_by_priest_id UUID REFERENCES clergy(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_future_event_date CHECK (event_date >= CURRENT_DATE - INTERVAL '1 day')
);

-- -----------------------------------------------------------------------------
-- 13. رسائل التواصل (contact_messages) — بلا تغيير
-- FK contact_messages_assigned_priest_id_fkey
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_name VARCHAR(255) NOT NULL,
    sender_phone VARCHAR(50) NOT NULL,
    sender_email VARCHAR(255),
    urgency contact_urgency_enum NOT NULL DEFAULT 'normal',
    assigned_priest_id UUID REFERENCES clergy(id) ON DELETE SET NULL,
    message_content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    admin_response_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 14. الأخبار (news_articles) — بلا تغيير
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS news_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_ar VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    excerpt_ar TEXT NOT NULL,
    body_markdown_ar TEXT NOT NULL,
    featured_image_url TEXT,
    category VARCHAR(100) NOT NULL DEFAULT 'إعلان كنسي',
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    author_name VARCHAR(150) NOT NULL DEFAULT 'المكتب الإعلامي للكنيسة',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 15. الحسابات البنكية (donation_accounts) — بلا تغيير
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS donation_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bank_name_ar VARCHAR(150) NOT NULL,
    bank_name_en VARCHAR(150) NOT NULL,
    account_title_ar VARCHAR(255) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    iban_number VARCHAR(100) NOT NULL,
    swift_code VARCHAR(50) NOT NULL,
    purpose_category_ar VARCHAR(150) NOT NULL,
    display_order INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
