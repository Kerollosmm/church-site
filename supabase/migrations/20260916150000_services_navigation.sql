-- =============================================================================
-- 15 / 15 — جداول الخدمات والتنقل وسياسات الأمان (Services & Navigation CMS Schema & RLS)
-- Source: Phase 7.2 Services & Navigation CMS spec (v7.2)
-- Apply order: 15th. Depends on file 02 (public.profiles) and file 03 (public.public_services).
--
-- التغييرات:
--   1. توسيع جدول الخدمات العامة القائم (public.public_services) بحقول تتبع إضافية وترجمة:
--      - `name_en` (VARCHAR(200))
--      - `description_en` (TEXT)
--      - `updated_at` (TIMESTAMPTZ NOT NULL DEFAULT now())
--      - `created_by` (UUID REFERENCES public.profiles(id) ON DELETE SET NULL)
--      - `updated_by` (UUID REFERENCES public.profiles(id) ON DELETE SET NULL)
--   2. إنشاء جدول عناصر شريط وقوائم التنقل (public.nav_menu_items):
--      - معرف فريد UUID
--      - مفتاح فريد key
--      - التسميات بالعربية والإنجليزية (label_ar, label_en)
--      - الرابط الموجه href
--      - القسم (section): 'main' (القائمة الرئيسية) أو 'secondary' (القائمة الإضافية/الدرج)
--      - رابط العنصر الأب parent_id للقوائم المنسدلة (مثل قائمة "عن الكنيسة")
--      - ترتيب العرض (sort_order)
--      - حالات التفعيل والظهور العام (is_active, is_public)
--      - حقول التتبع والتوثيق (created_by, updated_by, created_at, updated_at)
--   3. إنشاء الفهارس:
--      - `idx_nav_menu_items_public_active` على (section, sort_order ASC) للعناصر النشطة والعامة
--      - `idx_nav_menu_items_parent` على (parent_id)
--   4. تفعيل سياسات أمان الصفوف (RLS):
--      - قراءة عامة للزوار للعناصر النشطة والعامة فقط (is_active = true AND is_public = true)
--      - قراءة وإدارة كاملة محصورة بالطاقم الإداري (admin, secretary)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. توسيع جدول الخدمات العامة (public.public_services)
-- -----------------------------------------------------------------------------
ALTER TABLE public.public_services
    ADD COLUMN IF NOT EXISTS name_en VARCHAR(200),
    ADD COLUMN IF NOT EXISTS description_en TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- 2. جدول عناصر شريط التنقل (public.nav_menu_items)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.nav_menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) NOT NULL UNIQUE,
    label_ar VARCHAR(150) NOT NULL,
    label_en VARCHAR(150),
    href VARCHAR(255) NOT NULL,
    section VARCHAR(50) NOT NULL DEFAULT 'main',
    parent_id UUID REFERENCES public.nav_menu_items(id) ON DELETE CASCADE,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 3. الفهارس (Indexes)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_nav_menu_items_public_active
    ON public.nav_menu_items (section, sort_order ASC)
    WHERE is_active = TRUE AND is_public = TRUE;

CREATE INDEX IF NOT EXISTS idx_nav_menu_items_parent
    ON public.nav_menu_items (parent_id)
    WHERE parent_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 4. سياسات أمان الصفوف (Row Level Security - RLS)
-- -----------------------------------------------------------------------------
ALTER TABLE public.nav_menu_items ENABLE ROW LEVEL SECURITY;

-- -------------------------
-- A. سياسات القراءة العامة (Public Read)
-- -------------------------
DROP POLICY IF EXISTS "Public read active nav menu items" ON public.nav_menu_items;
CREATE POLICY "Public read active nav menu items"
ON public.nav_menu_items FOR SELECT
TO public
USING (is_active = true AND is_public = true);

-- -------------------------
-- B. سياسات القراءة الإدارية (Staff Read)
-- -------------------------
DROP POLICY IF EXISTS "Staff read all nav menu items" ON public.nav_menu_items;
CREATE POLICY "Staff read all nav menu items"
ON public.nav_menu_items FOR SELECT
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

-- إضافة عنصر تنقل جديد
DROP POLICY IF EXISTS "Staff insert nav menu items" ON public.nav_menu_items;
CREATE POLICY "Staff insert nav menu items"
ON public.nav_menu_items FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.is_active = true
          AND profiles.role IN ('admin', 'secretary')
    )
);

-- تعديل عنصر تنقل
DROP POLICY IF EXISTS "Staff update nav menu items" ON public.nav_menu_items;
CREATE POLICY "Staff update nav menu items"
ON public.nav_menu_items FOR UPDATE
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

-- حذف عنصر تنقل
DROP POLICY IF EXISTS "Staff delete nav menu items" ON public.nav_menu_items;
CREATE POLICY "Staff delete nav menu items"
ON public.nav_menu_items FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.is_active = true
          AND profiles.role IN ('admin', 'secretary')
    )
);
