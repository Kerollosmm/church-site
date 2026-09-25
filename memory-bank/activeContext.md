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
- تطبيق الويب العام `apps/web`: Next.js 15 App Router، ثابت أولاً (Static-First)، صفر مصادقة (INV-01). حراس هيدريشن للنماذج (`isMounted`) لمنع الإرسال قبل جاهزية العميل. تم تفعيل مشروع TestSprite (`Church-Site-Web`: 27 حالة اختبار معتمدة).
- **معالجة مشاكل E2E الخمس المكتشفة بنجاح (E2E Test Remediation Complete)**:
  1. القضاء على عاصفة التحميل المسبق (Prefetch Storm Fix) عبر إضافة `prefetch={false}` لكافة روابط التنقل العامة وأزرار الإجراءات السريعة في `HeaderClient.tsx`, `HeroBanner.tsx`, `QuickServiceGrid.tsx`, `QuickActionBar.tsx`, `Footer.tsx`، مما أوقف توليد ما يزيد عن 20 طلباً متزامناً وحمى الجلسات من اختناق معدل Cloudflare Quick Tunnel (HTTP 429).
  2. ضبط متغير البيئة `NEXT_PUBLIC_YOUTUBE_CHANNEL_URL=https://www.youtube.com/@st.maximosanddomadios` في `apps/web/.env.local`.
  3. بذر ومزامنة بيانات قاعدة البيانات في Supabase:
     - إدراج 37 سجلاً في `public.taxonomy_terms` (المصطلحات المعيارية للأبعاد الستة: event_type, ministry, audience, language, venue, tag).
     - إدراج 16 سلسلة فعاليات في `public.event_series` (5 قداسات أسبوعية على المذابح الثلاثة و11 اجتماعاً كنسياً أسبوعياً).
     - إدراج 4 فعاليات منشورة في `public.events` تتضمن 3 فعاليات قادمة لشهري سبتمبر وأكتوبر 2026 وربطها بالمصطلحات في `public.event_terms`.
     - إدراج سجلي بث مباشر في `public.stream_events` (بث مباشر نشط مع رابط التضمين المعتمد لليوتيوب، وبث مجدول قادم مع توقيت القاهرة).
  4. تحصين إصدارات الحزم وتثبيت `zod: 3.24.2` في تجاوزات الجذر (`pnpm.overrides`) لمنع تضارب واجهات `@hookform/resolvers`.
  5. بوابات الجودة المحلية: 806 فحوصات ناجحة بنسبة 100% في Vitest (57 ملف فحص)، وفحص الأنواع الصارم `pnpm typecheck` ناجح بنسبة 100% لكافة المشاريع الخمسة.
- لوحة الإدارة `apps/admin`: مستقلة ومعزولة الأعطال على المنفذ `3001`، جلسات SSR محمية ومحصورة بالطاقم.
  * توجيهات `/admin/:path*` -> `/:path*` نشطة لمنع 404.
  * بناء الإنتاج سليم بنسبة 100% وتطبيق الخادم يعمل على المنفذ `3001`.
  * تفعيل مشروع TestSprite للإدارة `Church-Site-Admin` (`c698af0b-3a3d-40f9-bbb7-599c74ecea47`):
    - **اكتمال معالجة وتمرير كافة الاختبارات بنسبة 100%**: 39 اختباراً من أصل 39 ناجحة بالكامل (39/39 Passed, 0 Failed, 0 Skipped).
    - تمت معالجة كافة الحالات الـ 12 السابقة وتمريرها حياً عبر TestSprite CLI بدون وسيط `--timeout` وفقاً لمعايير الجودة الصارمة:
      1. إضافة تصفية القداسات بالحالة وترتيب التوقيت (`AdminMassesTable.tsx`).
      2. إضافة تصفية الفعاليات بنطاق زمني (`EventsManager.tsx`).
      3. إضافة تصفية مواعيد العزاء بنطاق زمني (`BookingsManager.tsx`).
      4. دعم نسخ/تكرار قوالب CMS مع حقولها وبذر حقل العنوان الافتراضي وتصفية القوالب والبحث فيها (`ContentTypeManager.tsx`, `content-type-actions.ts`).
      5. تصحيح كود إعادة الاختبار التلقائي ومزامنة الهيدريشن للقداسات الجديدة (`058737ae-1171-4b45-8e16-e6396faa319f`).
    - توثيق النتائج الكاملة وبوابات الجودة: فحص الأنواع الصارم `pnpm typecheck` نظيف بنسبة 100%، واختبارات الإدارة في Vitest اجتازت 92/92 عبر 12 جناح اختبار بنجاح تام.

---

## 3. العوائق النشطة (Active Blockers)
- **لا توجد أي عوائق برمجية أو اختبارية داخلية**: جناح الاختبارات الإدارية بالكامل 39/39 أخضر (100% Green).
- **اعتماد وتطبيق الهجرات على بيئة Supabase الحية**: الهجرات `20260924100000` و`20260924110000` و`20260924120000` مجهزة ومطبقة محلياً فقط؛ بانتظار موافقة المالك لتطبيقها على قاعدة البيانات الحية وفحص المستشار الأمني (Supabase Security Advisors).
- **أسرار الإنتاج الخارجية**: استمرار تشغيل إرسال البريد بوضع `noop` والإفصاح الشفاف للزائر لحين تزويد بيانات مزود البريد المعتمد (Resend / SMTP).

---

## 4. الخطوات التالية الفورية (Immediate Next Steps)
1. **استعراض الهجرات والموافقة الصريحة**: الحصول على موافقة المالك قبل أي تطبيق لهجرات قاعدة البيانات على المشروع الحي.
2. **التحقق من المستشار الأمني (Pending live migration and advisor verification)**: تشغيل فحص Supabase Advisors والتحقق من قيود RLS وفهارس التغطية بعد تطبيق الهجرات المعتمدة.
3. **صيانة اتساق بنك الذاكرة**: مواصلة فحص ومطابقة أي تغييرات برمجية ضد ملفات الهجرة وأنواع قاعدة البيانات الناتجة فعلياً دون أي افتراضات غير مختبرة.
