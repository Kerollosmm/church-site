-- =============================================================================
-- 11 / 11 — سياسات الأمان على مستوى الصفوف لجدول المشتركين (RLS for subscribers)
-- Source: same feature as file 10; follows the rules of files 07 and 09 exactly.
--
-- قاعدة v1.1 الحاكمة كما هي: لا توجد أي سياسة `TO authenticated USING (TRUE)`، وكل كتابة إدارية
-- تمر عبر is_staff().
--
-- قراءة عامة: **لا شيء**. بريد المشترك بيانات شخصية، ولا يجوز أن يقرأها الزائر — ولا يوجد أي
-- مسار عام يعرض قائمة المشتركين.
-- إدراج عام: **لا سياسة** عمداً. الاستمارة العامة تُكتب من الخادم بعميل service-role بعد تحديد
-- المعدل والتحقق من Turnstile ومخطط zod، تماماً كبقية الاستمارات العامة في الملف 07؛ ولا يُفتح
-- الباب لمفتاح anon ليُدرج صفوفاً مباشرة بلا هذه البوابات.
-- إدارة الطاقم: قراءة وتعديل للطاقم الكنسي عبر is_staff()، و**لا سياسة DELETE إطلاقاً** —
-- إيقاف الاشتراك (is_active = FALSE) هو الطريق، فيبقى السجل قابلاً للمراجعة.
--
-- كل CREATE POLICY مسبوقة بـ DROP POLICY IF EXISTS حتى يمكن إعادة تطبيق الملف.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- تفعيل RLS (جدول واحد)
-- -----------------------------------------------------------------------------
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- صلاحيات الطاقم الكنسي (Staff = is_staff() كما في الملفات 07 و09)
-- SELECT و UPDATE منفصلتان: لا حاجة لسياسة INSERT للطاقم (لا شاشة إدارية تُنشئ مشتركين)،
-- والكتابة العامة تمر بعميل الخدمة كما هو موضّح أعلاه.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff read subscribers" ON subscribers;
CREATE POLICY "Staff read subscribers" ON subscribers FOR SELECT TO authenticated USING (is_staff());

DROP POLICY IF EXISTS "Staff update subscribers" ON subscribers;
CREATE POLICY "Staff update subscribers" ON subscribers FOR UPDATE TO authenticated
    USING (is_staff()) WITH CHECK (is_staff());
