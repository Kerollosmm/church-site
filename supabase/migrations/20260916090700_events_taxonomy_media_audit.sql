-- =============================================================================
-- 08 / 09 — نظام الفعاليات والتصنيفات والوسائط وسجل التدقيق
--           (Events, taxonomy, media & audit-log schema)
-- Source: the core data layer of the events/taxonomy/i18n feature.
-- Apply order: 8th. Depends on file 01 (uuid-ossp), file 02 (profiles + is_staff)
--              and must run BEFORE file 09 (its RLS policies).
--
-- Schema only — no seed rows are inserted by any migration file.
--
-- NOTE ON NULLABILITY AND DEFAULTS: a column with a DEFAULT is declared NOT NULL
-- only when the application type is non-nullable (see src/types/database.types.ts,
-- which mirrors this file column for column).
--
-- NOTE ON `event_series.default_term_ids`: PostgreSQL cannot express a foreign key
-- over the ELEMENTS of an array, so that array is validated by the application
-- (src/store drivers refuse unknown term ids). Every other reference is a real FK.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- الأنواع المخصصة (Custom ENUMs) — نفس نمط الملف 01: كل نوع داخل كتلة محروسة
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    CREATE TYPE event_status_enum AS ENUM ('draft', 'published', 'cancelled', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE recurrence_freq_enum AS ENUM ('weekly', 'monthly');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE event_exception_kind_enum AS ENUM ('cancelled', 'moved');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE taxonomy_dimension_enum AS ENUM (
        'event_type', 'ministry', 'audience', 'language', 'venue', 'tag'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE audit_action_enum AS ENUM (
        'create', 'update', 'publish', 'unpublish', 'cancel', 'reschedule', 'duplicate', 'delete',
        -- رفض صلاحية: أثر تدقيقي لمحاولة لم تُنفَّذ (قبل/بعد = NULL)، وليس حركة على أي صف.
        'denied'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- قاعدة طُبِّق عليها الملف قبل إضافة 'denied': تُرقّى هنا (لا أثر عند وجود القيمة).
ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'denied';

-- -----------------------------------------------------------------------------
-- 1. مصطلحات التصنيف (taxonomy_terms)
-- بعد بُعد واحد لكل مصطلح؛ الفهرس الفريد (dimension, slug) هو ما يجعل الواجهة
-- قادرة على استدعاء مصطلح بعنوان ثابت داخل بعده.
-- FK taxonomy_terms_created_by_fkey / taxonomy_terms_updated_by_fkey
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS taxonomy_terms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dimension taxonomy_dimension_enum NOT NULL,
    slug VARCHAR(120) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    icon VARCHAR(64),                     -- اسم أيقونة lucide، مثل "Church"
    color VARCHAR(32),                    -- رمز من لوحة الألوان ("copticNavy") أو قيمة HEX
    sort_order INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    CONSTRAINT uq_taxonomy_term_dimension_slug UNIQUE (dimension, slug)
);

-- -----------------------------------------------------------------------------
-- 2. السلاسل المتكررة (event_series)
-- قاعدة تكرار صريحة وبسيطة (أسبوعي/شهري) يفهمها غير المبرمج من الجدول مباشرة.
-- المواعيد المتكررة لا تُخزَّن صفاً صفاً؛ تُشتق عند القراءة بمحرك التكرار
-- (src/lib/domain/recurrence.ts).
-- FK event_series_default_venue_id_fkey / event_series_created_by_fkey /
--    event_series_updated_by_fkey
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_series (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_ar VARCHAR(255) NOT NULL,
    title_en VARCHAR(255),
    summary_ar TEXT,
    summary_en TEXT,
    freq recurrence_freq_enum NOT NULL,
    recurrence_interval INT NOT NULL DEFAULT 1,          -- كل كم أسبوع/شهر
    by_weekday INT[] NOT NULL DEFAULT '{}',              -- للتكرار الأسبوعي: 0=الأحد .. 6=السبت
    by_month_day INT,                                    -- للتكرار الشهري: 1..31 أو NULL (يوم البداية)
    start_date DATE NOT NULL,
    end_date DATE,
    start_time TIME NOT NULL,                            -- بتوقيت المنطقة أدناه
    duration_minutes INT NOT NULL DEFAULT 60,
    timezone VARCHAR(64) NOT NULL DEFAULT 'Africa/Cairo',
    default_venue_id UUID REFERENCES taxonomy_terms(id) ON DELETE SET NULL,
    default_term_ids UUID[] NOT NULL DEFAULT '{}',
    status event_status_enum NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    CONSTRAINT event_series_interval_positive CHECK (recurrence_interval >= 1),
    CONSTRAINT event_series_duration_positive CHECK (duration_minutes >= 1),
    CONSTRAINT event_series_month_day_range CHECK (by_month_day IS NULL OR (by_month_day BETWEEN 1 AND 31)),
    CONSTRAINT event_series_date_order CHECK (end_date IS NULL OR end_date >= start_date)
);

-- -----------------------------------------------------------------------------
-- 3. الفعاليات (events)
-- الصف الواحد يؤدي دورين: فعالية مستقلة (series_id = NULL) أو تجاوز لموعد واحد
-- في سلسلة (series_id + occurrence_date + is_exception_of).
-- FK events_venue_id_fkey / events_series_id_fkey / events_is_exception_of_fkey /
--    events_created_by_fkey / events_updated_by_fkey
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(160) NOT NULL UNIQUE,
    title_ar VARCHAR(255) NOT NULL,
    title_en VARCHAR(255),
    summary_ar TEXT,
    summary_en TEXT,
    description_ar TEXT,
    description_en TEXT,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ,
    timezone VARCHAR(64) NOT NULL DEFAULT 'Africa/Cairo',
    all_day BOOLEAN NOT NULL DEFAULT FALSE,
    venue_id UUID REFERENCES taxonomy_terms(id) ON DELETE SET NULL,
    status event_status_enum NOT NULL DEFAULT 'draft',
    series_id UUID REFERENCES event_series(id) ON DELETE SET NULL,
    occurrence_date DATE,
    is_exception_of UUID REFERENCES event_series(id) ON DELETE SET NULL,
    image_url TEXT,
    documents JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    -- تجاوز الموعد لا معنى له بلا سلسلة أصلية، وتاريخ الموعد شرطه وجود سلسلة.
    CONSTRAINT events_occurrence_requires_series CHECK (occurrence_date IS NULL OR series_id IS NOT NULL),
    CONSTRAINT events_end_after_start CHECK (ends_at IS NULL OR ends_at > starts_at)
);

-- -----------------------------------------------------------------------------
-- 4. استثناءات المواعيد (event_exceptions)
-- إلغاء موعد واحد أو نقله دون المساس ببقية السلسلة. القيد الفريد يضمن استثناء
-- واحداً لكل موعد، وهو ما تعتمد عليه عملية upsert في كلا المحركين.
-- FK event_exceptions_series_id_fkey / event_exceptions_created_by_fkey /
--    event_exceptions_updated_by_fkey
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    series_id UUID NOT NULL REFERENCES event_series(id) ON DELETE CASCADE,
    occurrence_date DATE NOT NULL,
    kind event_exception_kind_enum NOT NULL,
    moved_to_date DATE,
    reason_ar TEXT,
    reason_en TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    CONSTRAINT uq_event_exception_occurrence UNIQUE (series_id, occurrence_date),
    -- النقل يستلزم تاريخاً جديداً، والإلغاء لا يقبل تاريخاً جديداً.
    CONSTRAINT event_exception_move_requires_date CHECK (kind <> 'moved' OR moved_to_date IS NOT NULL),
    CONSTRAINT event_exception_cancel_has_no_date CHECK (kind <> 'cancelled' OR moved_to_date IS NULL)
);

-- -----------------------------------------------------------------------------
-- 5. ربط الفعاليات بالتصنيفات (event_terms) — علاقة متعدد إلى متعدد
-- FK event_terms_event_id_fkey / event_terms_term_id_fkey
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_terms (
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES taxonomy_terms(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (event_id, term_id)
);

-- -----------------------------------------------------------------------------
-- 6. الوسائط (media)
-- بيانات وصفية فقط؛ الملف نفسه يبقى خارج المخزن (مسار أو رابط داخل url).
-- FK media_uploaded_by_fkey
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(127) NOT NULL,
    size_bytes BIGINT NOT NULL DEFAULT 0,
    url TEXT NOT NULL,
    alt_ar VARCHAR(255),
    alt_en VARCHAR(255),
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT media_size_non_negative CHECK (size_bytes >= 0)
);

-- -----------------------------------------------------------------------------
-- 7. سجل التدقيق (audit_log)
-- سطر واحد لكل تعديل، يحمل الحالة قبل وبعد. السجل للإضافة فقط: لا سياسة UPDATE
-- ولا DELETE عليه في الملف 09.
-- FK audit_log_actor_id_fkey
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    actor_name VARCHAR(255) NOT NULL,
    action audit_action_enum NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    before JSONB,
    after JSONB,
    summary TEXT NOT NULL
);

-- -----------------------------------------------------------------------------
-- الفهارس (Indexes)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_events_status_starts_at ON events (status, starts_at) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_events_starts_at ON events (starts_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_series_id ON events (series_id);
CREATE INDEX IF NOT EXISTS idx_events_venue_id ON events (venue_id);
CREATE INDEX IF NOT EXISTS idx_events_title_trgm ON events USING gin (title_ar gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_event_series_status ON event_series (status);
CREATE INDEX IF NOT EXISTS idx_event_exceptions_series_date ON event_exceptions (series_id, occurrence_date);

-- ملاحظة: (dimension, slug) يحمل قيد UNIQUE باسم uq_taxonomy_term_dimension_slug،
-- وفهرسه الفريد مضمَّن فيه، فلا يُنشأ فهرس فريد ثانٍ لنفس العمودين.
CREATE INDEX IF NOT EXISTS idx_taxonomy_dimension_active ON taxonomy_terms (dimension, sort_order) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_event_terms_term_id ON event_terms (term_id);

CREATE INDEX IF NOT EXISTS idx_media_public_created ON media (created_at DESC) WHERE is_public = TRUE;

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log (entity_type, entity_id, at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_at ON audit_log (at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log (actor_id, at DESC);
