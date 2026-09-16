-- =============================================================================
-- 02 / 07 — ملفات الطاقم والدوال المساعدة (profiles & helper functions)
-- Source: BACKEND_AND_DATA_SPEC.md §2.2 (profiles, handle_new_user trigger),
--         §2.3 (is_staff / is_admin), §3.3 (normalize_arabic)
-- Apply order: 2nd. Depends on file 01 (staff_role_enum).
--
-- normalize_arabic() is defined here — before any table — because the
-- bible_verses.text_normalized generated column (file 04) requires it to
-- already exist when that table is created.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 2.2 ملفات الطاقم الكنسي (profiles)
--
-- BOOTSTRAP إلزامي (خطوة نشر يدوية، تُنفَّذ مرة واحدة بعد إنشاء أول حساب مدير
-- عبر Supabase Auth، من SQL Editor):
--   UPDATE profiles SET role = 'admin' WHERE id = '<uuid-of-first-admin>';
-- لا يوجد أي مسار آخر لترقية مدير أول (see supabase/README.md).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name_ar VARCHAR(200) NOT NULL,
    role staff_role_enum NOT NULL DEFAULT 'servant',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- إنشاء ملف تلقائي عند أول تسجيل مستخدم (الافتراضي: servant بلا أي صلاحيات كتابة حتى يرقّيه admin)
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, full_name_ar, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name_ar', 'خادم جديد'), 'servant');
  RETURN NEW;
END; $$;

-- Dropped first so the file can be re-applied without error.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- -----------------------------------------------------------------------------
-- 2.3 دوال التحقق من الدور (SECURITY DEFINER لتجنب الاستعلام التكراري في السياسات)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_staff() RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_active
      AND role IN ('admin', 'secretary', 'servant', 'priest')
  );
$$;

CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND is_active
  );
$$;

-- -----------------------------------------------------------------------------
-- تطبيع النص العربي: إزالة التشكيل وتوحيد الألف والياء (للبحث الذكي)
-- IMMUTABLE PARALLEL SAFE: required by the bible_verses.text_normalized
-- generated column and by the idx_verses_normalized_trgm GIN index.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION normalize_arabic(txt text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT translate(
    regexp_replace(txt, '[ًٌٍَُِّْ]', '', 'g'),  -- إزالة الحركات والتنوين والشدة والسكون
    'أإآىي', 'ااايي'
  );
$$;
