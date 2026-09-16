-- =============================================================================
-- 09 / 09 — سياسات الأمان على مستوى الصفوف لنظام الفعاليات (RLS for events)
-- Source: same feature as file 08; follows the rules of file 07 exactly.
--
-- قاعدة v1.1 الحاكمة كما هي: لا توجد أي سياسة `TO authenticated USING (TRUE)`،
-- وكل كتابة إدارية تمر عبر is_staff() / is_admin().
--
-- قراءة عامة:
--   • events        : المنشور فقط. المسودات والملغاة والمؤرشفة لا يراها الزائر.
--   • event_series  : المنشورة فقط (نفس المنطق).
--   • taxonomy_terms: المصطلحات النشطة (retiring a term hides it, it does not delete it).
--   • event_terms   : الروابط بلا محتوى حساس، لكنها لا تُقرأ إلا مع فعالية يراها القارئ
--                     أصلاً، لذا تُترك للقراءة العامة كما في bible_books/bible_verses.
--   • event_exceptions: نافذة زمنية (كما في mass_exceptions) — تكفي لعرض التعديلات
--                     الجارية دون كشف تاريخ قديم لا يخدم الزائر.
--   • media         : الملفات المعلنة (is_public) فقط.
--   • audit_log     : لا قراءة عامة إطلاقاً — الطاقم فقط.
--
-- كل CREATE POLICY مسبوقة بـ DROP POLICY IF EXISTS حتى يمكن إعادة تطبيق الملف.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- تفعيل RLS على كل جداول النظام (7 tables)
-- -----------------------------------------------------------------------------
ALTER TABLE taxonomy_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- القراءة العامة (Public Read)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read active taxonomy terms" ON taxonomy_terms;
CREATE POLICY "Public read active taxonomy terms" ON taxonomy_terms FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Public read published event series" ON event_series;
CREATE POLICY "Public read published event series" ON event_series FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Public read published events" ON events;
CREATE POLICY "Public read published events" ON events FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Public read recent event exceptions" ON event_exceptions;
CREATE POLICY "Public read recent event exceptions" ON event_exceptions FOR SELECT
    USING (occurrence_date >= CURRENT_DATE - INTERVAL '90 days');

DROP POLICY IF EXISTS "Public read event terms" ON event_terms;
CREATE POLICY "Public read event terms" ON event_terms FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Public read public media" ON media;
CREATE POLICY "Public read public media" ON media FOR SELECT USING (is_public = TRUE);

-- -----------------------------------------------------------------------------
-- صلاحيات الطاقم الكنسي (Staff = is_staff() كما في الملف 07)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff manage taxonomy terms" ON taxonomy_terms;
CREATE POLICY "Staff manage taxonomy terms" ON taxonomy_terms FOR ALL TO authenticated
    USING (is_staff()) WITH CHECK (is_staff());

DROP POLICY IF EXISTS "Staff manage event series" ON event_series;
CREATE POLICY "Staff manage event series" ON event_series FOR ALL TO authenticated
    USING (is_staff()) WITH CHECK (is_staff());

DROP POLICY IF EXISTS "Staff manage events" ON events;
CREATE POLICY "Staff manage events" ON events FOR ALL TO authenticated
    USING (is_staff()) WITH CHECK (is_staff());

DROP POLICY IF EXISTS "Staff manage event exceptions" ON event_exceptions;
CREATE POLICY "Staff manage event exceptions" ON event_exceptions FOR ALL TO authenticated
    USING (is_staff()) WITH CHECK (is_staff());

DROP POLICY IF EXISTS "Staff manage event terms" ON event_terms;
CREATE POLICY "Staff manage event terms" ON event_terms FOR ALL TO authenticated
    USING (is_staff()) WITH CHECK (is_staff());

DROP POLICY IF EXISTS "Staff manage media" ON media;
CREATE POLICY "Staff manage media" ON media FOR ALL TO authenticated
    USING (is_staff()) WITH CHECK (is_staff());

-- -----------------------------------------------------------------------------
-- سجل التدقيق: قراءة وإضافة للطاقم فقط — بلا أي سياسة UPDATE أو DELETE
-- (السجل للإضافة فقط؛ انظر تعليق ملف 08 على الجدول).
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff read audit log" ON audit_log;
CREATE POLICY "Staff read audit log" ON audit_log FOR SELECT TO authenticated USING (is_staff());

DROP POLICY IF EXISTS "Staff append audit log" ON audit_log;
CREATE POLICY "Staff append audit log" ON audit_log FOR INSERT TO authenticated WITH CHECK (is_staff());
