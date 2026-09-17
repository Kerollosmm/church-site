-- =============================================================================
-- 14 / 14 — جدول فيديوهات الكنيسة والسياسات الأمنية (Parish Videos Schema & RLS)
-- Source: Phase 4 Parish Videos spec (phase4-video-embeds-agent-prompt.md §2.1)
-- Apply order: 14th. Depends on file 02 (public.profiles).
--
-- التغييرات:
--   1. إنشاء نوع البيانات:
--      - `video_provider_enum` ('youtube', 'facebook', 'direct')
--   2. إنشاء جدول `public.parish_videos`:
--      - معرف فريد UUID
--      - العنوان والوصف بالعربية والإنجليزية
--      - مزود الفيديو ورابط المصدر ورابط التضمين المطبع الآمن
--      - رابط الصورة المصغرة والترتيب وحالات التفعيل والظهور العام
--      - حقول التتبع والتوثيق (created_by, updated_by, created_at, updated_at)
--   3. إنشاء فهرس الفرز والظهور العام:
--      - `idx_parish_videos_public_active` على (is_public, is_active, sort_order)
--   4. تفعيل سياسات أمان الصفوف (RLS):
--      - قراءة عامة للزوار للبيانات النشطة والمنشورة فقط (is_public = true AND is_active = true)
--      - قراءة إدارية لكافة الفيديوهات للطاقم الإداري (admin, secretary)
--      - عمليات الإضافة والتعديل والحذف محصورة بالطاقم الإداري (admin, secretary)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. النوع المخصص لمزودي الفيديو (Custom ENUM)
-- -----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE video_provider_enum AS ENUM (
        'youtube',
        'facebook',
        'direct'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- -----------------------------------------------------------------------------
-- 2. جدول فيديوهات الكنيسة (public.parish_videos)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.parish_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_ar TEXT NOT NULL,
    title_en TEXT,
    description_ar TEXT,
    description_en TEXT,
    provider video_provider_enum NOT NULL,
    source_url TEXT NOT NULL,
    embed_url TEXT NOT NULL,
    thumbnail_url TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 3. الفهارس (Indexes)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_parish_videos_public_active 
    ON public.parish_videos (is_public, is_active, sort_order);

-- -----------------------------------------------------------------------------
-- 4. سياسات أمان الصفوف (Row Level Security - RLS)
-- -----------------------------------------------------------------------------
ALTER TABLE public.parish_videos ENABLE ROW LEVEL SECURITY;

-- -------------------------
-- A. سياسات القراءة العامة (Public Read)
-- -------------------------
DROP POLICY IF EXISTS "Public read active parish videos" ON public.parish_videos;
CREATE POLICY "Public read active parish videos"
ON public.parish_videos FOR SELECT
TO public
USING (is_public = true AND is_active = true);

-- -------------------------
-- B. سياسات القراءة الإدارية (Staff Read)
-- -------------------------
DROP POLICY IF EXISTS "Staff read all parish videos" ON public.parish_videos;
CREATE POLICY "Staff read all parish videos"
ON public.parish_videos FOR SELECT
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

-- إضافة فيديو جديد
DROP POLICY IF EXISTS "Staff insert parish videos" ON public.parish_videos;
CREATE POLICY "Staff insert parish videos"
ON public.parish_videos FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.is_active = true
          AND profiles.role IN ('admin', 'secretary')
    )
);

-- تعديل فيديو
DROP POLICY IF EXISTS "Staff update parish videos" ON public.parish_videos;
CREATE POLICY "Staff update parish videos"
ON public.parish_videos FOR UPDATE
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

-- حذف فيديو
DROP POLICY IF EXISTS "Staff delete parish videos" ON public.parish_videos;
CREATE POLICY "Staff delete parish videos"
ON public.parish_videos FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.is_active = true
          AND profiles.role IN ('admin', 'secretary')
    )
);
