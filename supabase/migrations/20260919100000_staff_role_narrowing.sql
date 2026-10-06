-- =============================================================================
-- 17 / 17 — تضييق أدوار الطاقم وفصل صلاحية الكتابة (Staff role narrowing & write split)
-- Source: مراجعة الأمان الشاملة للمستودع، الملاحظة 1 (HIGH). تكمّل الملفات 02 و07 و09 و11.
-- Apply order: 17th. Depends on file 02 (public.profiles + is_staff) and every
--              table/policy created by files 03–15.
--
-- العطل الذي تعالجه هذه الهجرة:
--   كان `handle_new_user()` ينشئ **كل** مستخدم جديد في `auth.users` بدور `servant`
--   و`is_active = TRUE`، وكانت `is_staff()` تعتبر `servant` و`priest` ضمن الطاقم.
--   النتيجة: أي تسجيل عام جديد كان يملك عبر REST API قراءةً وكتابةً وحذفاً على نحو
--   18 جدولاً من خلال سياسات `"Staff manage …" FOR ALL` — بينما تطبيق الإدارة نفسه
--   يرفض هذين الدورين تماماً (`ADMIN_PORTAL_ROLES = ['admin','secretary']`).
--   طبقتان تعتقدان عكس الشيء نفسه عن الدور ذاته.
--
-- القرار (مطابقة التطبيق حرفياً):
--   1. `handle_new_user()` ينشئ الملف **غير نشط** (`is_active = FALSE`)، فلا يمنح
--      تسجيلٌ عابر أي صلاحية إطلاقاً قبل أن يفعّله مسؤول صراحةً.
--   2. `is_staff()` تُضيّق إلى `('admin','secretary')` — أي أن الكهنة والخدام لم يعودوا
--      يقرأون سجل التدقيق أو قائمة المشتركين أو الواردات (لم يكن لديهم أي واجهة إدارية
--      أصلاً، فالسلوك المرئي لا يتغيّر).
--   3. `is_editor()` تُضاف كدالة صريحة لمفهوم «من يكتب» بقيم `('admin','secretary')`
--      نفسها اليوم. الفصل مقصود: `is_staff()` تعني «قد يقرأ أسطح الطاقم» و`is_editor()`
--      تعني «قد يعدّل»، فلو أُوسعت قراءة الطاقم مستقبلاً بقيت الكتابة مقصورة على الدورين.
--   4. تُعاد كتابة **سياسات الكتابة** (26 سياسة) لتستخدم `is_editor()`، فتصبح نية كل
--      سياسة صريحة في مكانها بدل الاعتماد الضمني على دالة مشتركة.
--
-- ما تُرك عمداً بلا مساس:
--   سياسات الملفات 13 و14 و15 (`content_types`، `content_fields`، `content_entries`،
--   `parish_videos`، `nav_menu_items`) وسياسات `storage.objects` في الملف 12: كلها
--   تفحص `role IN ('admin','secretary')` مباشرة — أي أنها صحيحة أصلاً ولا تتأثر
--   بتضييق `is_staff()`، فلا داعي لإعادة كتابتها (وأقلّ تغيير = أقلّ خطر انحراف).
--
-- كل CREATE POLICY مسبوقة بـ DROP POLICY IF EXISTS بنفس الاسم، حتى يمكن إعادة تطبيق
-- الملف بأمان مع الحفاظ على الأسماء التي تعتمد عليها المواصفة ولوحة Supabase.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. المستخدم الجديد يبدأ غير نشط (لا صلاحيات كتابة ولا قراءة إدارية)
--
-- خطوة النشر اليدوية لأول مسؤول صارت:
--   UPDATE profiles SET role = 'admin', is_active = TRUE WHERE id = '<uuid>';
-- (انظر supabase/README.md — «Mandatory manual bootstrap step»)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, full_name_ar, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name_ar', 'خادم جديد'),
    'servant',
    FALSE
  );
  RETURN NEW;
END; $$;

-- -----------------------------------------------------------------------------
-- 2. دوال التحقق من الدور
--
-- `is_staff()`  : قد يقرأ أسطح الطاقم (سجل التدقيق، المشتركين، الواردات).
-- `is_editor()` : قد يكتب في أي جدول محتوى.
-- `is_admin()`  : يدير ملفات الطاقم (بلا تغيير — انظر الملف 02).
--
-- الكهنة والخدام خارج الدالتين: هم شعبٌ مخدوم لا يشرف على المحتوى، وتطبيق الإدارة
-- يرفض تسجيل دخولهم من الأساس.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_staff() RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_active
      AND role IN ('admin', 'secretary')
  );
$$;

CREATE OR REPLACE FUNCTION is_editor() RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_active
      AND role IN ('admin', 'secretary')
  );
$$;

-- -----------------------------------------------------------------------------
-- 3. إعادة توجيه سياسات الكتابة من is_staff() إلى is_editor()
--    (الملحق 06 — الجداول العامة الثمانية عشر)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff manage altars" ON altars;
CREATE POLICY "Staff manage altars" ON altars FOR ALL TO authenticated USING (is_editor()) WITH CHECK (is_editor());

DROP POLICY IF EXISTS "Staff manage clergy" ON clergy;
CREATE POLICY "Staff manage clergy" ON clergy FOR ALL TO authenticated USING (is_editor()) WITH CHECK (is_editor());

DROP POLICY IF EXISTS "Staff manage mass_schedules" ON mass_schedules;
CREATE POLICY "Staff manage mass_schedules" ON mass_schedules FOR ALL TO authenticated USING (is_editor()) WITH CHECK (is_editor());

DROP POLICY IF EXISTS "Staff manage mass_exceptions" ON mass_exceptions;
CREATE POLICY "Staff manage mass_exceptions" ON mass_exceptions FOR ALL TO authenticated USING (is_editor()) WITH CHECK (is_editor());

DROP POLICY IF EXISTS "Staff manage site_alerts" ON site_alerts;
CREATE POLICY "Staff manage site_alerts" ON site_alerts FOR ALL TO authenticated USING (is_editor()) WITH CHECK (is_editor());

DROP POLICY IF EXISTS "Staff manage stream_events" ON stream_events;
CREATE POLICY "Staff manage stream_events" ON stream_events FOR ALL TO authenticated USING (is_editor()) WITH CHECK (is_editor());

DROP POLICY IF EXISTS "Staff manage specialties" ON clinic_specialties;
CREATE POLICY "Staff manage specialties" ON clinic_specialties FOR ALL TO authenticated USING (is_editor()) WITH CHECK (is_editor());

DROP POLICY IF EXISTS "Staff manage meetings" ON church_meetings;
CREATE POLICY "Staff manage meetings" ON church_meetings FOR ALL TO authenticated USING (is_editor()) WITH CHECK (is_editor());

DROP POLICY IF EXISTS "Staff manage schools" ON schools_academies;
CREATE POLICY "Staff manage schools" ON schools_academies FOR ALL TO authenticated USING (is_editor()) WITH CHECK (is_editor());

DROP POLICY IF EXISTS "Staff manage activities" ON activities;
CREATE POLICY "Staff manage activities" ON activities FOR ALL TO authenticated USING (is_editor()) WITH CHECK (is_editor());

DROP POLICY IF EXISTS "Staff manage public_services" ON public_services;
CREATE POLICY "Staff manage public_services" ON public_services FOR ALL TO authenticated USING (is_editor()) WITH CHECK (is_editor());

-- الواردات وأسرار الشعب: لم يكن يفترض أن يقرأها إلا من يشرف على الردّ عليها.
DROP POLICY IF EXISTS "Staff manage condolence_bookings" ON condolence_bookings;
CREATE POLICY "Staff manage condolence_bookings" ON condolence_bookings FOR ALL TO authenticated USING (is_editor()) WITH CHECK (is_editor());

DROP POLICY IF EXISTS "Staff manage contact_messages" ON contact_messages;
CREATE POLICY "Staff manage contact_messages" ON contact_messages FOR ALL TO authenticated USING (is_editor()) WITH CHECK (is_editor());

DROP POLICY IF EXISTS "Staff manage news_articles" ON news_articles;
CREATE POLICY "Staff manage news_articles" ON news_articles FOR ALL TO authenticated USING (is_editor()) WITH CHECK (is_editor());

DROP POLICY IF EXISTS "Staff manage donation_accounts" ON donation_accounts;
CREATE POLICY "Staff manage donation_accounts" ON donation_accounts FOR ALL TO authenticated USING (is_editor()) WITH CHECK (is_editor());

DROP POLICY IF EXISTS "Staff manage program_applications" ON program_applications;
CREATE POLICY "Staff manage program_applications" ON program_applications FOR ALL TO authenticated USING (is_editor()) WITH CHECK (is_editor());

DROP POLICY IF EXISTS "Staff manage job_applications" ON job_applications;
CREATE POLICY "Staff manage job_applications" ON job_applications FOR ALL TO authenticated USING (is_editor()) WITH CHECK (is_editor());

DROP POLICY IF EXISTS "Staff manage clinic_alert_subscriptions" ON clinic_alert_subscriptions;
CREATE POLICY "Staff manage clinic_alert_subscriptions" ON clinic_alert_subscriptions FOR ALL TO authenticated USING (is_editor()) WITH CHECK (is_editor());

-- -----------------------------------------------------------------------------
-- 4. إعادة توجيه سياسات الكتابة (الملف 09 — طبقة الفعاليات والوسائط)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff manage taxonomy terms" ON taxonomy_terms;
CREATE POLICY "Staff manage taxonomy terms" ON taxonomy_terms FOR ALL TO authenticated
    USING (is_editor()) WITH CHECK (is_editor());

DROP POLICY IF EXISTS "Staff manage event series" ON event_series;
CREATE POLICY "Staff manage event series" ON event_series FOR ALL TO authenticated
    USING (is_editor()) WITH CHECK (is_editor());

DROP POLICY IF EXISTS "Staff manage events" ON events;
CREATE POLICY "Staff manage events" ON events FOR ALL TO authenticated
    USING (is_editor()) WITH CHECK (is_editor());

DROP POLICY IF EXISTS "Staff manage event exceptions" ON event_exceptions;
CREATE POLICY "Staff manage event exceptions" ON event_exceptions FOR ALL TO authenticated
    USING (is_editor()) WITH CHECK (is_editor());

DROP POLICY IF EXISTS "Staff manage event terms" ON event_terms;
CREATE POLICY "Staff manage event terms" ON event_terms FOR ALL TO authenticated
    USING (is_editor()) WITH CHECK (is_editor());

DROP POLICY IF EXISTS "Staff manage media" ON media;
CREATE POLICY "Staff manage media" ON media FOR ALL TO authenticated
    USING (is_editor()) WITH CHECK (is_editor());

-- سجل التدقيق: القراءة تبقى على is_staff() (قراءة) والإضافة على is_editor() (كتابة).
DROP POLICY IF EXISTS "Staff read audit log" ON audit_log;
CREATE POLICY "Staff read audit log" ON audit_log FOR SELECT TO authenticated USING (is_staff());

DROP POLICY IF EXISTS "Staff append audit log" ON audit_log;
CREATE POLICY "Staff append audit log" ON audit_log FOR INSERT TO authenticated WITH CHECK (is_editor());

-- -----------------------------------------------------------------------------
-- 5. إعادة توجيه سياسة الكتابة (الملف 11 — المشتركون)
--    SELECT تبقى على is_staff()؛ وتعديل الاشتراك كتابةٌ تستخدم is_editor().
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff read subscribers" ON subscribers;
CREATE POLICY "Staff read subscribers" ON subscribers FOR SELECT TO authenticated USING (is_staff());

DROP POLICY IF EXISTS "Staff update subscribers" ON subscribers;
CREATE POLICY "Staff update subscribers" ON subscribers FOR UPDATE TO authenticated
    USING (is_editor()) WITH CHECK (is_editor());
