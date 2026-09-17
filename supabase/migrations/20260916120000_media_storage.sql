-- =============================================================================
-- 12 / 12 — تهيئة مساحة تخزين الوسائط والسياسات الأمنية (Media Storage & RLS)
-- Source: Phase 2 media upload spec (phase2-media-upload-agent-prompt.md §2.3)
-- Apply order: 12th. Depends on file 08 (public.media) and file 02 (public.profiles).
--
-- التغييرات:
--   1. إنشاء مستودع التخزين `media` داخل schema `storage` (عام للقراءة).
--   2. إضافة حقلي `storage_path` و `checksum` لجدول `public.media`.
--   3. سياسات RLS على `storage.objects`:
--      - قراءة عامة للجميع (public read) لمستودع `media`.
--      - عمليات الإضافة والتعديل والحذف محصورة بالمشرفين والسكرتارية (admin, secretary)
--        من خلال التحقق من `public.profiles`.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. مستودع التخزين (storage bucket)
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. توسيع جدول الوسائط (public.media)
-- -----------------------------------------------------------------------------
ALTER TABLE public.media
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS checksum VARCHAR(64);

-- -----------------------------------------------------------------------------
-- 3. سياسات أمان كائنات التخزين (storage.objects RLS)
-- -----------------------------------------------------------------------------

-- قراءة عامة لملفات الوسائط
DROP POLICY IF EXISTS "Public read media storage objects" ON storage.objects;
CREATE POLICY "Public read media storage objects"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');

-- إضافة ملفات وسائط للطاقم الإداري (admin, secretary)
DROP POLICY IF EXISTS "Staff insert media storage objects" ON storage.objects;
CREATE POLICY "Staff insert media storage objects"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'media'
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('admin', 'secretary')
    )
);

-- تعديل ملفات وسائط للطاقم الإداري (admin, secretary)
DROP POLICY IF EXISTS "Staff update media storage objects" ON storage.objects;
CREATE POLICY "Staff update media storage objects"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'media'
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('admin', 'secretary')
    )
)
WITH CHECK (
    bucket_id = 'media'
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('admin', 'secretary')
    )
);

-- حذف ملفات وسائط للطاقم الإداري (admin, secretary)
DROP POLICY IF EXISTS "Staff delete media storage objects" ON storage.objects;
CREATE POLICY "Staff delete media storage objects"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'media'
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('admin', 'secretary')
    )
);
