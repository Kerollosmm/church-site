-- =============================================================================
-- 07 / 07 — سياسات الأمان على مستوى الصفوف (Row Level Security)
-- Source: BACKEND_AND_DATA_SPEC.md §5 (§5.1 – §5.4)
-- Apply order: last. Requires every table from files 02, 03 and 04.
--
-- قاعدة v1.1 الحاكمة: لا توجد أي سياسة `TO authenticated USING (TRUE)` في هذا
-- المشروع. كل كتابة إدارية تمر عبر is_staff() / is_admin().
-- Policy names are exactly those of the spec — the application and the
-- Supabase dashboard rely on them. Each CREATE POLICY is preceded by a
-- matching DROP POLICY IF EXISTS so the file can be re-applied safely.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- تفعيل RLS على كافة الجداول بدون استثناء (21 tables)
-- -----------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE altars ENABLE ROW LEVEL SECURITY;
ALTER TABLE clergy ENABLE ROW LEVEL SECURITY;
ALTER TABLE mass_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE mass_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools_academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE condolence_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_alert_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_verses ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 5.1 سياسات ملفات الطاقم (profiles)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users read own profile" ON profiles;
CREATE POLICY "Users read own profile" ON profiles FOR SELECT TO authenticated USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins manage profiles" ON profiles;
CREATE POLICY "Admins manage profiles" ON profiles FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- -----------------------------------------------------------------------------
-- 5.2 القراءة العامة (Public Read)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read active altars" ON altars;
CREATE POLICY "Public read active altars" ON altars FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Public read active clergy" ON clergy;
CREATE POLICY "Public read active clergy" ON clergy FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Public read active mass schedules" ON mass_schedules;
CREATE POLICY "Public read active mass schedules" ON mass_schedules FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Public read relevant mass exceptions" ON mass_exceptions;
CREATE POLICY "Public read relevant mass exceptions" ON mass_exceptions FOR SELECT
    USING (exception_date >= CURRENT_DATE - INTERVAL '7 days');

DROP POLICY IF EXISTS "Public read active alerts" ON site_alerts;
CREATE POLICY "Public read active alerts" ON site_alerts FOR SELECT
    USING (is_active = TRUE AND starts_at <= NOW() AND (ends_at IS NULL OR ends_at >= NOW()));

DROP POLICY IF EXISTS "Public read stream events" ON stream_events;
CREATE POLICY "Public read stream events" ON stream_events FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Public read active specialties" ON clinic_specialties;
CREATE POLICY "Public read active specialties" ON clinic_specialties FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Public read active meetings" ON church_meetings;
CREATE POLICY "Public read active meetings" ON church_meetings FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Public read active schools" ON schools_academies;
CREATE POLICY "Public read active schools" ON schools_academies FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Public read active activities" ON activities;
CREATE POLICY "Public read active activities" ON activities FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Public read active public services" ON public_services;
CREATE POLICY "Public read active public services" ON public_services FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Public read published news" ON news_articles;
CREATE POLICY "Public read published news" ON news_articles FOR SELECT USING (is_published = TRUE);

DROP POLICY IF EXISTS "Public read active donation accounts" ON donation_accounts;
CREATE POLICY "Public read active donation accounts" ON donation_accounts FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Public read bible books" ON bible_books;
CREATE POLICY "Public read bible books" ON bible_books FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Public read bible verses" ON bible_verses;
CREATE POLICY "Public read bible verses" ON bible_verses FOR SELECT USING (TRUE);

-- ملاحظة v1.1: لا توجد سياسة SELECT عامة على condolence_bookings — التتبع عبر RPC فقط.

-- -----------------------------------------------------------------------------
-- 5.3 الإدخال العام المفتوح (Public Inserts — anon)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can submit condolence booking" ON condolence_bookings;
CREATE POLICY "Public can submit condolence booking"
ON condolence_bookings FOR INSERT
WITH CHECK (
    status = 'pending' AND
    deceased_full_name IS NOT NULL AND
    applicant_phone IS NOT NULL
);

DROP POLICY IF EXISTS "Public can submit contact message" ON contact_messages;
CREATE POLICY "Public can submit contact message"
ON contact_messages FOR INSERT
WITH CHECK (sender_name IS NOT NULL AND message_content IS NOT NULL);

DROP POLICY IF EXISTS "Public can apply to programs" ON program_applications;
CREATE POLICY "Public can apply to programs"
ON program_applications FOR INSERT
WITH CHECK (applicant_name IS NOT NULL AND guardian_phone IS NOT NULL);

DROP POLICY IF EXISTS "Public can apply for jobs" ON job_applications;
CREATE POLICY "Public can apply for jobs"
ON job_applications FOR INSERT
WITH CHECK (full_name IS NOT NULL AND phone IS NOT NULL);

DROP POLICY IF EXISTS "Public can subscribe to clinic alerts" ON clinic_alert_subscriptions;
CREATE POLICY "Public can subscribe to clinic alerts"
ON clinic_alert_subscriptions FOR INSERT
WITH CHECK (phone IS NOT NULL);

-- لا وجود لأي سياسة UPDATE/DELETE عامة في النظام كله.

-- -----------------------------------------------------------------------------
-- 5.4 صلاحيات الطاقم الكنسي (Staff = admin/secretary/servant/priest عبر is_staff())
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff manage altars" ON altars;
CREATE POLICY "Staff manage altars" ON altars FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());

DROP POLICY IF EXISTS "Staff manage clergy" ON clergy;
CREATE POLICY "Staff manage clergy" ON clergy FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());

DROP POLICY IF EXISTS "Staff manage mass_schedules" ON mass_schedules;
CREATE POLICY "Staff manage mass_schedules" ON mass_schedules FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());

DROP POLICY IF EXISTS "Staff manage mass_exceptions" ON mass_exceptions;
CREATE POLICY "Staff manage mass_exceptions" ON mass_exceptions FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());

DROP POLICY IF EXISTS "Staff manage site_alerts" ON site_alerts;
CREATE POLICY "Staff manage site_alerts" ON site_alerts FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());

DROP POLICY IF EXISTS "Staff manage stream_events" ON stream_events;
CREATE POLICY "Staff manage stream_events" ON stream_events FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());

DROP POLICY IF EXISTS "Staff manage specialties" ON clinic_specialties;
CREATE POLICY "Staff manage specialties" ON clinic_specialties FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());

DROP POLICY IF EXISTS "Staff manage meetings" ON church_meetings;
CREATE POLICY "Staff manage meetings" ON church_meetings FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());

DROP POLICY IF EXISTS "Staff manage schools" ON schools_academies;
CREATE POLICY "Staff manage schools" ON schools_academies FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());

DROP POLICY IF EXISTS "Staff manage activities" ON activities;
CREATE POLICY "Staff manage activities" ON activities FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());

DROP POLICY IF EXISTS "Staff manage public_services" ON public_services;
CREATE POLICY "Staff manage public_services" ON public_services FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());

DROP POLICY IF EXISTS "Staff manage condolence_bookings" ON condolence_bookings;
CREATE POLICY "Staff manage condolence_bookings" ON condolence_bookings FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());

DROP POLICY IF EXISTS "Staff manage contact_messages" ON contact_messages;
CREATE POLICY "Staff manage contact_messages" ON contact_messages FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());

DROP POLICY IF EXISTS "Staff manage news_articles" ON news_articles;
CREATE POLICY "Staff manage news_articles" ON news_articles FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());

DROP POLICY IF EXISTS "Staff manage donation_accounts" ON donation_accounts;
CREATE POLICY "Staff manage donation_accounts" ON donation_accounts FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());

DROP POLICY IF EXISTS "Staff manage program_applications" ON program_applications;
CREATE POLICY "Staff manage program_applications" ON program_applications FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());

DROP POLICY IF EXISTS "Staff manage job_applications" ON job_applications;
CREATE POLICY "Staff manage job_applications" ON job_applications FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());

DROP POLICY IF EXISTS "Staff manage clinic_alert_subscriptions" ON clinic_alert_subscriptions;
CREATE POLICY "Staff manage clinic_alert_subscriptions" ON clinic_alert_subscriptions FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());
