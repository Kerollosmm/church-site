-- =============================================================================
-- 13 / 13 — محرك أنواع المحتوى المخصص (Content Types Engine & RLS)
-- Source: Phase 3 spec (phase3-content-types-agent-prompt.md §2.1)
-- Apply order: 13th. Depends on file 02 (public.profiles).
--
-- التغييرات:
--   1. إنشاء نوعي البيانات:
--      - `field_type_enum` ('text','richtext','number','date','media','select','relation','boolean')
--      - `content_status_enum` ('draft','published','archived')
--   2. إنشاء الجداول الثلاثة:
--      - `public.content_types`: تعريف نوع المحتوى والقالب والأيقونة
--      - `public.content_fields`: تعريف حقول النوع ونوع البيانات وقواعد التحقق
--      - `public.content_entries`: بيانات عناصر المحتوى (JSONB data)
--   3. إنشاء الفهارس (GIN على data، و(type, status)، إلخ)
--   4. تفعيل سياسات أمان الصفوف RLS:
--      - قراءة عامة (anon/public) للعناصر المنشورة فقط (status = 'published') والأنواع المفعلة
--      - عمليات الإضافة والتعديل والحذف محصورة بالطاقم الإداري (admin, secretary)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. الأنواع المخصصة (Custom ENUMs)
-- -----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE field_type_enum AS ENUM (
        'text',
        'richtext',
        'number',
        'date',
        'media',
        'select',
        'relation',
        'boolean'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE content_status_enum AS ENUM (
        'draft',
        'published',
        'archived'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- -----------------------------------------------------------------------------
-- 2. جداول محرك المحتوى (Content Tables)
-- -----------------------------------------------------------------------------

-- جدول أنواع المحتوى
CREATE TABLE IF NOT EXISTS public.content_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    icon TEXT,
    template TEXT DEFAULT 'default',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- جدول حقول المحتوى
CREATE TABLE IF NOT EXISTS public.content_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type_id UUID NOT NULL REFERENCES public.content_types(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    label_ar TEXT NOT NULL,
    label_en TEXT,
    field_type field_type_enum NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    is_translatable BOOLEAN NOT NULL DEFAULT TRUE,
    validation_rules JSONB,
    options JSONB,
    sort_order INT NOT NULL DEFAULT 0,
    CONSTRAINT uq_content_fields_type_slug UNIQUE (content_type_id, slug)
);

-- جدول عناصر ومدخلات المحتوى
CREATE TABLE IF NOT EXISTS public.content_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type_id UUID NOT NULL REFERENCES public.content_types(id) ON DELETE RESTRICT,
    slug TEXT NOT NULL,
    status content_status_enum NOT NULL DEFAULT 'draft',
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    published_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_content_entries_type_slug UNIQUE (content_type_id, slug)
);

-- -----------------------------------------------------------------------------
-- 3. الفهارس (Indexes)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_content_entries_data_gin ON public.content_entries USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_content_entries_type_status ON public.content_entries (content_type_id, status);
CREATE INDEX IF NOT EXISTS idx_content_fields_type_sort ON public.content_fields (content_type_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_content_entries_published ON public.content_entries (content_type_id, published_at DESC) WHERE status = 'published';

-- -----------------------------------------------------------------------------
-- 4. سياسات أمان الصفوف (Row Level Security - RLS)
-- -----------------------------------------------------------------------------
ALTER TABLE public.content_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_entries ENABLE ROW LEVEL SECURITY;

-- -------------------------
-- A. سياسات القراءة العامة (Public Read)
-- -------------------------
DROP POLICY IF EXISTS "Public read active content types" ON public.content_types;
CREATE POLICY "Public read active content types"
ON public.content_types FOR SELECT
TO public
USING (is_active = true);

DROP POLICY IF EXISTS "Public read content fields" ON public.content_fields;
CREATE POLICY "Public read content fields"
ON public.content_fields FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1 FROM public.content_types
        WHERE content_types.id = content_fields.content_type_id
          AND content_types.is_active = true
    )
);

DROP POLICY IF EXISTS "Public read published content entries" ON public.content_entries;
CREATE POLICY "Public read published content entries"
ON public.content_entries FOR SELECT
TO public
USING (status = 'published');

-- -------------------------
-- B. سياسات القراءة الإدارية (Staff Read)
-- -------------------------
DROP POLICY IF EXISTS "Staff read all content types" ON public.content_types;
CREATE POLICY "Staff read all content types"
ON public.content_types FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.is_active = true
          AND profiles.role IN ('admin', 'secretary')
    )
);

DROP POLICY IF EXISTS "Staff read all content fields" ON public.content_fields;
CREATE POLICY "Staff read all content fields"
ON public.content_fields FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.is_active = true
          AND profiles.role IN ('admin', 'secretary')
    )
);

DROP POLICY IF EXISTS "Staff read all content entries" ON public.content_entries;
CREATE POLICY "Staff read all content entries"
ON public.content_entries FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.is_active = true
          AND profiles.role IN ('admin', 'secretary')
    )
);

-- -------------------------
-- C. سياسات الكتابة والتعديل والحذف للطاقم الإداري (Staff Mutations)
-- -------------------------

-- content_types
DROP POLICY IF EXISTS "Staff insert content types" ON public.content_types;
CREATE POLICY "Staff insert content types"
ON public.content_types FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.is_active = true
          AND profiles.role IN ('admin', 'secretary')
    )
);

DROP POLICY IF EXISTS "Staff update content types" ON public.content_types;
CREATE POLICY "Staff update content types"
ON public.content_types FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.is_active = true
          AND profiles.role IN ('admin', 'secretary')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.is_active = true
          AND profiles.role IN ('admin', 'secretary')
    )
);

DROP POLICY IF EXISTS "Staff delete content types" ON public.content_types;
CREATE POLICY "Staff delete content types"
ON public.content_types FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.is_active = true
          AND profiles.role IN ('admin', 'secretary')
    )
);

-- content_fields
DROP POLICY IF EXISTS "Staff insert content fields" ON public.content_fields;
CREATE POLICY "Staff insert content fields"
ON public.content_fields FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.is_active = true
          AND profiles.role IN ('admin', 'secretary')
    )
);

DROP POLICY IF EXISTS "Staff update content fields" ON public.content_fields;
CREATE POLICY "Staff update content fields"
ON public.content_fields FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.is_active = true
          AND profiles.role IN ('admin', 'secretary')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.is_active = true
          AND profiles.role IN ('admin', 'secretary')
    )
);

DROP POLICY IF EXISTS "Staff delete content fields" ON public.content_fields;
CREATE POLICY "Staff delete content fields"
ON public.content_fields FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.is_active = true
          AND profiles.role IN ('admin', 'secretary')
    )
);

-- content_entries
DROP POLICY IF EXISTS "Staff insert content entries" ON public.content_entries;
CREATE POLICY "Staff insert content entries"
ON public.content_entries FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.is_active = true
          AND profiles.role IN ('admin', 'secretary')
    )
);

DROP POLICY IF EXISTS "Staff update content entries" ON public.content_entries;
CREATE POLICY "Staff update content entries"
ON public.content_entries FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.is_active = true
          AND profiles.role IN ('admin', 'secretary')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.is_active = true
          AND profiles.role IN ('admin', 'secretary')
    )
);

DROP POLICY IF EXISTS "Staff delete content entries" ON public.content_entries;
CREATE POLICY "Staff delete content entries"
ON public.content_entries FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.is_active = true
          AND profiles.role IN ('admin', 'secretary')
    )
);
