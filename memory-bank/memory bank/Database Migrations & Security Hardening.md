---
title: "Database Migrations & Security Hardening"
aliases: ["Database Migrations", "Supabase Migrations", "Security Hardening", "Postgres Hardening"]
tags:
  - "#memory-bank"
  - "#database"
  - "#security"
  - "#supabase"
  - "#migrations"
  - "#status/active"
version: "2.0"
last_updated: 2026-09-26
---

# Database Migrations & Security Hardening

> [!info] Database Infrastructure Baseline
> Supabase PostgreSQL 15+ instance with Row Level Security (RLS) enabled on all 21 public tables, 40+ granular security policies, and 20 versioned SQL migrations under `supabase/migrations/`.

---

## 1. فهرس وتصنيف الهجرات العشرين (The 20 Migrations Catalog)

### أ. مخطط الأساس والمستخدمين (Base Schema & Auth: Migrations 1–7)
1. `20260916000000_extensions_and_types.sql`: تثبيت الامتدادات (`pgcrypto`, `citext`) وتعريف الـ Enums الأساسية.
2. `20260916010000_profiles_and_helpers.sql`: جدول `public.profiles` ودوال فحص الطاقم (`is_admin`, `is_editor`, `is_staff`).
3. `20260916020000_core_tables.sql`: إنشاء الجداول الـ 21 الأساسية (القداسات، العيادات، الفعاليات، الرسائل، الحجوزات، الكتاب المقدس).
4. `20260916030000_security_definer_functions.sql`: دوال العمليات الحساسة (`handle_new_user`, `search_bible`).
5. `20260916040000_indexes.sql`: فهارس B-Tree وGIN الأساسية لتسريع استعلامات الواجهة العامة.
6. `20260916050000_enable_rls.sql`: تفعيل حماية RLS على كافة الجداول بدون استثناء.
7. `20260916060000_rls_policies.sql`: تطبيق 40 سياسة أمان صارمة تميز بين القراءة العامة والتحكم الإداري.

### ب. الفعاليات والتكرار والمشتركون (Events, Recurrence & Subscribers: Migrations 8–11)
8. `20260916070000_event_series.sql`: هيكل سلاسل الفعاليات المتكررة ونظام التكرار الأسبوعي.
9. `20260916080000_event_exceptions.sql`: استثناءات المواعيد (الإلغاء، النقل الزمني) دون تكرار الصفوف.
10. `20260916090000_subscribers.sql`: جدول المشتركين `subscribers` مع قيد البريد الفريد والتطبيع الآمن.
11. `20260916100000_subscriber_topics.sql`: اشتراكات الأقسام والخدمات مع عزل تام للبيانات الشخصية.

### ج. الميزات الموسعة وتخزين الوسائط (Advanced Features: Migrations 12–17)
*(17 هجرة مطبقة حياً على بيئة Supabase الإنتاجية)*
12. `20260916110000_content_types.sql`: محرك أنواع المحتوى الديناميكي EAV-lite (`content_types`, `content_fields`, `content_entries`).
13. `20260916120000_media_storage.sql`: إعداد حاوية `media` في Supabase Storage وسياسات رفع الطاقم.
14. `20260916130000_parish_videos.sql`: جدول فيديوهات الكنيسة مع ربطها بالنطاقات الخارجية المعتمدة.
15. `20260916140000_public_services.sql`: جدول مرافق وخدمات الكنيسة لدعم شاشات العرض العامة.
16. `20260916150000_navigation_menu.sql`: هيكل القوائم والشريط العلوي الديناميكي CMS.
17. `20260916160000_external_assets.sql`: دعم حل الروابط الخارجية للوسائط ومطابقة CSP.

---

## 2. الهجرات الثلاث الأخيرة للتحصين والأداء (Migrations 18–20)

> [!important] Production Status
> هذه الهجرات الثلاث مطبقة ومختبرة بنجاح 100% في البيئة المحلية (`improve-codebase-architecture`)، ولكنها **معلقة وغير مطبقة بعد على بيئة الإنتاج** بانتظار موافقة المالك الصريحة.

### الهجرة 18: الإرسال الذري لرسائل التواصل والتدقيق
- **الملف**: `20260924100000_contact_message_atomic_submission.sql`
- **الهدف المعماري**: ضمان إدراج رسالة التواصل في `contact_messages` وتسجيل سطر التدقيق في `audit_log` داخل معاملة قاعدة بيانات ذرية واحدة.
- **التنفيذ**: دالة `submit_contact_message_atomic` تعمل بـ `SECURITY DEFINER` ومسار بحث محصن `SET search_path = public, pg_temp` وترجع المعرف الحقيقي `id`.
- **المرونة**: تحصين كود التطبيق في `contact-actions.ts` بحيث يفشل بصوت عالٍ في الإدراج، ويعزل خطوة التدقيق في مسار التراجع لضمان عدم إحباط الزائر لرسالة تم حفظها فعلياً.

### الهجرة 19: تحصين صلاحيات دوال RPC ومسار البحث
- **الملف**: `20260924110000_rpc_security_hardening.sql`
- **سحب صلاحيات التنفيذ العام (`REVOKE EXECUTE`)**:
  * سحب صلاحية التنفيذ عن دالة التريجر الداخلية `handle_new_user` من `PUBLIC, anon, authenticated`.
  * سحب صلاحية التنفيذ عن دوال التحقق من الطاقم `is_admin`, `is_editor`, `is_staff` من `anon, PUBLIC` مع الإبقاء عليها لـ `authenticated` لضمان عمل سياسات RLS المعتمدة عليها.
  * إبقاء `search_bible` و`track_condolence_booking` متاحة لـ `anon, authenticated` بتصميم مقصود لخدمة الزوار، مع خضوعها لمبدأ الحد الأدنى من الصلاحيات.
- **تثبيت مسار البحث الآمن الصريح (Pinned `search_path`)**:
  * فرض `SET search_path = public, pg_temp` لكافة الدوال لمنع هجمات انتحال المسار وتسميم الكائنات المؤقتة.
  * ضبط دالة `normalize_arabic` بمسار `SET search_path = pg_catalog, public, pg_temp`.
- **تقييد المدخلات وعزل البيانات الحساسة (PII Isolation)**:
  * دالة `search_bible`: تقييد طول نص البحث (1–200 محرف) وحصر عدد النتائج (1–100).
  * دالة `track_condolence_booking`: تقييد طول الرمز المرجعي (1–20 محرفاً) ونسق محارف آمن مع حجب تام لكافة البيانات الشخصية الحساسة (PII) من الاستجابة.

### الهجرة 20: فهارس التغطية وتحسين RLS InitPlan
- **الملف**: `20260924120000_covering_indexes_and_rls_initplan.sql`
- **إضافة 9 فهارس تغطية للمفاتيح الأجنبية الفعلية**:
  1. `idx_mass_exceptions_original_schedule_id` على `mass_exceptions(original_schedule_id)`.
  2. `idx_events_venue_id` على `events(venue_id)`.
  3. `idx_contact_messages_assigned_priest_id` على `contact_messages(assigned_priest_id)`.
  4. `idx_media_uploaded_by` على `media(uploaded_by)`.
  5. `idx_events_created_by` على `events(created_by)`.
  6. `idx_events_updated_by` على `events(updated_by)`.
  7. `idx_event_exceptions_series_id` على `event_exceptions(series_id)`.
  8. `idx_mass_schedules_altar_id` على `mass_schedules(altar_id)`.
  9. `idx_mass_exceptions_altar_id` على `mass_exceptions(altar_id)`.
- **تحسين أداء RLS بنمط InitPlan**:
  * استبدال الاستدعاء المباشر لـ `auth.uid()` في سياسة الملف الشخصي ودوال فحص الطاقم `is_staff()` و`is_editor()` إلى صيغة `(select auth.uid())`، مما يسمح لمحرك استعلامات PostgreSQL بتقييم هوية المستخدم مرة واحدة كـ InitPlan بدلاً من إعادة حسابها لكل صف على حدة.

---

## 3. محددات وقواعد المخطط الإلزامية (Mandatory Schema Rules)

> [!caution] Schema Invariants to Prevent Regression
> - **جدول `public.events`**: لا يحتوي على عمود `category_id`. يتم ربط التصنيفات عبر جدول `event_terms` و`taxonomy_terms`. الفهرس الصحيح للمكان هو `idx_events_venue_id ON public.events(venue_id)`.
> - **جدول `public.mass_exceptions`**: المفتاح الأجنبي الصحيح هو `original_schedule_id` (يشير إلى `mass_schedules.id`). لا يوجد عمود باسم `mass_schedule_id`.
> - **دالة `track_condolence_booking`**: تلتزم بالتوافقية الخلفية للأكواد القديمة مع فحص حدود المحارف وعزل الـ PII.

---
*مرجع هجرات قاعدة البيانات والأمان — دليل التعديلات الهيكلية وسياسات RLS.*
