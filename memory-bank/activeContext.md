# Active Context — الحالة الحالية

## 1. الحالة والفرع الحالي (Current Git State)
- **Current Branch**: `improve-codebase-architecture`
- **Current Commit SHA**: `07b179ed9b331aa0e4db46437da78b1563712899`
- **Working Tree**: Clean (0 uncommitted changes).
- **Historical Evidence Archive**: Historical QA runs, previous tunnel logs, screenshots, gate counts, and old probe transcripts have been separated into dated archive document [`memory-bank/archive/qa-evidence-2026-09-22.md`](file:///c:/Church-Site/memory-bank/archive/qa-evidence-2026-09-22.md).

---

## 2. الوضع التنفيذي الحالي (Current Execution Status)

### هجرات قاعدة البيانات والأمان (Database Migrations & Security)
- **الهجرات الثلاث الأخيرة (Implemented locally — Not yet applied to Church-Site production)**:
  * `20260924100000_contact_message_atomic_submission.sql`: إدراج الرسالة وسجل التدقيق ذرياً (Implemented locally).
  * `20260924110000_rpc_security_hardening.sql`: تحصين صلاحيات دوال RPC وسياسات RLS:
    - سحب صلاحية التنفيذ العام `EXECUTE` من الدوال الداخلية غير المخصصة للجمهور (`handle_new_user` مسحوبة من `PUBLIC, anon, authenticated`؛ `is_admin`, `is_editor`, `is_staff` مسحوبة من `anon, PUBLIC`).
    - إبقاء `is_admin`, `is_editor`, `is_staff` قابلة للتنفيذ لمستخدمي `authenticated` لضمان عمل سياسات RLS المعتمدة عليها، وإبقاء `search_bible` و`track_condolence_booking` قابلة للاستدعاء من `anon, authenticated` بتصميم مقصود؛ مع بقاء هذه الدوال خاضعة للمراجعة الدورية لمبدأ الحد الأدنى من الصلاحيات (Least Privilege)، وملاحظة أن مستشار Supabase الأمني قد يستمر في إظهار تنبيهات عليها نظراً لطبيعة SECURITY DEFINER.
    - تطبيق تثبيت مسار البحث الآمن الصريح (safe explicit pinned search_path = `public, pg_temp` أو `pg_catalog, public, pg_temp`) لمنع هجمات التلاعب بمسار البحث.
    - تقييد وتطبيع مدخلات `search_bible` (حدود الطول 1–200 ونتائج 1–100) و`track_condolence_booking` (حدود الطول 1–20 ونسق محارف آمن مع حجب تام لكافة البيانات الشخصية الحساسة PII).
    - تنبيه: نتائج مستشار الأمان (Security Advisors) يلزم إعادة تشغيلها والتحقق منها حياً بعد تطبيق الهجرة في الإنتاج.
  * `20260924120000_covering_indexes_and_rls_initplan.sql`: فهارس التغطية وتحسين RLS InitPlan:
    - إضافة 9 فهارس تغطية للمفاتيح الأجنبية الفعلية المثبتة في المخطط الحي (`original_schedule_id` في `mass_exceptions`, و`venue_id` في `events`, و`assigned_priest_id` في `contact_messages`, و`uploaded_by` في `media`, و`created_by`/`updated_by` في `events` و`event_exceptions`, و`altar_id` في `mass_schedules`).
    - تطبيق تحسين مبدئي لـ InitPlan (Initial InitPlan optimization applied) عبر تحويل استدعاء `auth.uid()` في سياسة الملف الشخصي ودوال الطاقم `is_staff()` و`is_editor()` إلى `(select auth.uid())`؛ مع التأكيد على أن بقية سياسات RLS تتطلب مراجعة تفصيلية منفصلة لكل سياسة على حدة (Remaining RLS policies require a separate policy-by-policy review).
- **قواعد ومحددات مخطط Supabase الإلزامية**:
  * مصدر الحقيقة هو مخطط Supabase الحي وسلسلة ملفات الهجرات والفرع الحالي فقط؛ بنك الذاكرة سياق تاريخي وتوجيه معماري فقط.
  * جدول `public.events`: لا يحتوي على عمود `category_id` (التصنيف عبر `taxonomy_terms` و`event_terms`). الفهرس الصحيح هو `idx_events_venue_id ON public.events (venue_id)`.
  * جدول `public.mass_exceptions`: المفتاح الأجنبي الصحيح هو `original_schedule_id` (إلى `mass_schedules(id)`)؛ لا وجود لعمود باسم `mass_schedule_id`. الفهرس الصحيح هو `idx_mass_exceptions_original_schedule_id`.
  * دالة `track_condolence_booking`: فحص حدود الطول (1–20) والمحارف الآمنة وعزل PII مع الحفاظ على التوافقية للمدخلات الصحيحة.
  * الإنتاج محمي بالكامل: الهجرات لم تُطبق بعد على إنتاج Church-Site (Unapplied to production).
- **فحص الأسرار والإفصاح الأمني (Secret Scan Disclosure)**:
  * فحص شجرة الملفات الحالية اجتاز بنجاح: Current-tree secret scan passed (0 secrets detected).
  * الإفصاح الأمني: الفاحص يفحص الملفات المتتبعة حالياً في الشجرة فقط؛ التعرض التاريخي للبيانات الحساسة في تاريخ Git ما زال يستلزم تدوير كلمات المرور وإعادة كتابة تاريخ Git بأدوات مخصصة مثل git-filter-repo.

### الواجهات والمنظومة العامة (Application & Services)
- تطبيق الويب العام `apps/web`: Next.js 15 App Router، ثابت أولاً (Static-First)، صفر مصادقة (INV-01). حراس هيدريشن للنماذج (`isMounted`) لمنع الإرسال قبل جاهزية العميل.
- لوحة الإدارة `apps/admin`: مستقلة ومعزولة الأعطال على المنفذ `3001`، جلسات SSR محمية ومحصورة بالطاقم.
- بوابات الجودة المحلية: 798 فحصاً ناجحاً محلياً بنسبة 100% في Vitest، وبناء الإنتاج لكلا التطبيقين ناجح محلياً (Local verification only — not labeled proven without live production deployment).

---

## 3. العوائق النشطة (Active Blockers)
- **اعتماد وتطبيق الهجرات على بيئة Supabase الحية**: الهجرات `20260924100000` و`20260924110000` و`20260924120000` مجهزة ومطبقة محلياً فقط؛ بانتظار موافقة المالك لتطبيقها على قاعدة البيانات الحية وفحص المستشار الأمني (Supabase Security Advisors).
- **أسرار الإنتاج الخارجية**: استمرار تشغيل إرسال البريد بوضع `noop` والإفصاح الشفاف للزائر لحين تزويد بيانات مزود البريد المعتمد (Resend / SMTP).

---

## 4. الخطوات التالية الفورية (Immediate Next Steps)
1. **استعراض الهجرات والموافقة الصريحة**: الحصول على موافقة المالك قبل أي تطبيق لهجرات قاعدة البيانات على المشروع الحي.
2. **التحقق من المستشار الأمني (Pending live migration and advisor verification)**: تشغيل فحص Supabase Advisors والتحقق من قيود RLS وفهارس التغطية بعد تطبيق الهجرات المعتمدة.
3. **صيانة اتساق بنك الذاكرة**: مواصلة فحص ومطابقة أي تغييرات برمجية ضد ملفات الهجرة وأنواع قاعدة البيانات الناتجة فعلياً دون أي افتراضات غير مختبرة.
