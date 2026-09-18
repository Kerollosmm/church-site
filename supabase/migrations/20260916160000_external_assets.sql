-- =============================================================================
-- 16 / 16 — توسيع جدول الوسائط لدعم الروابط الخارجية (External Assets Metadata)
-- Source: Phase 7.3 External Assets & Link Resolver spec
-- Apply order: 16th. Depends on file 08 (public.media) and file 12 (media_storage).
--
-- التغييرات:
--   1. إضافة حقول الرابط الأصلي والرابط المطبع واسم المضيف ونوع الأصل إلى public.media:
--      - source_url: رابط المشاركة أو المصدر الأصلي كما أدخله الخادم
--      - resolved_url: رابط الصورة المباشر المطبع والمفحوص أمنياً
--      - host: اسم المضيف المعتمد بعد الفحص
--      - kind: نوع الأصل ('youtube-thumb' | 'drive' | 'direct-image')
--   2. الحفاظ التام على سياسات RLS السابقة دون أي تعديل أو ثغرات
-- =============================================================================

ALTER TABLE public.media
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS resolved_url TEXT,
  ADD COLUMN IF NOT EXISTS host VARCHAR(255),
  ADD COLUMN IF NOT EXISTS kind VARCHAR(64);
