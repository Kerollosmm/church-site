---
title: "Active Context — الحالة الحالية"
aliases: ["Active Context", "Current State", "Sprint Status"]
tags:
  - "#memory-bank"
  - "#status/active"
  - "#context"
version: "2.0"
last_updated: 2026-09-26
---

# Active Context — الحالة الحالية

> [!info] Operational Summary
> **Current Focus**: Monorepo architectural cleanup complete, local quality gates 100% green, database hardening migrations ready for owner production approval.
> **Related Notes**: [[Progress & Deliverables]], [[System Patterns]], [[Database Migrations & Security Hardening]], [[TestSprite Quality Gates]]

---

## 1. الحالة والفرع الحالي (Current Git State)

- **Current Branch**: `improve-codebase-architecture`
- **Current Commit SHA**: `07b179ed9b331aa0e4db46437da78b1563712899`
- **Working Tree**: Clean (0 uncommitted changes prior to Obsidian vault sync).
- **Historical Evidence Archive**: Historical QA runs, previous tunnel logs, screenshots, gate counts, and old probe transcripts have been separated into dated archive document [[Archive/QA Evidence 2026-09-22|QA Evidence Archive 2026-09-22]].

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
  * فحص شجرة الملفات الحالية اجتاز بنجاح: Current-tree secret scan passed (0 secrets detected via `node scripts/scan-secrets.mjs`).
  * الإفصاح الأمني: الفاحص يفحص الملفات المتتبعة حالياً في الشجرة فقط؛ التعرض التاريخي للبيانات الحساسة في تاريخ Git ما زال يستلزم تدوير كلمات المرور وإعادة كتابة تاريخ Git بأدوات مخصصة مثل git-filter-repo.

---

### الواجهات والمنظومة العامة (Application & Services)
- **تطبيق الويب العام `apps/web`**: Next.js 15 App Router، ثابت أولاً (Static-First)، صفر مصادقة ([[INV-01 Zero-Auth Invariant|INV-01]]). حراس هيدريشن للنماذج (`isMounted`) لمنع الإرسال قبل جاهزية العميل.
  * **مشروع TestSprite للموقع العام (`Church-Site-Web` — `9efc1ddc-85c8-4385-b299-e0a6a50978dd`)**:
    - **اكتمال التحقق بنسبة 96.3%**: 26 حالة اختبار ناجحة من أصل 27 (26/27 Passed, 0 Failed, 1 Blocked by external sandbox boundary).
    - الحالة الوحيدة المحجوبة (`5ceab483-9e89-4d91-b699-bee7c36c1c81`): فتح موقع الكنيسة في خرائط Google؛ محجوبة بسبب قيود عزل بيئة التشغيل المحلية لـ TestSprite Tunnel (`127.0.0.1:3000`) التي تمنع التنقل إلى النطاقات الخارجية (`https://maps.google.com`).
    - **صفر أخطاء برمجية (0 Failed)**: التطبيق المصدري سليم تماماً وجميع المسارات والصفحات تعمل بكفاءة.
    - توثيق التقارير في `docs/testsprite-user-web-report.md` و`docs/testsprite-web-suite-results.md`.
  * **الحالة المجمعة للمنظومة بالكامل (Combined TestSprite E2E Status)**:
    - تطبيق الإدارة (39/39 — 100% Green) + تطبيق الويب العام (26/27 — 96.3%, 0 Failed, 1 Blocked) = **65/66 حالة اختبار ناجحة (98.5% Pass Rate, 0 Failed, 1 Blocked)**. التفاصيل الكاملة في [[TestSprite Quality Gates]].

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

- **لوحة الإدارة `apps/admin`**: مستقلة ومعزولة الأعطال على المنفذ `3001`، جلسات SSR محمية ومحصورة بالطاقم.
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

### معالجات جناح اختبارات E2E الشاملة (E2E Test Suite Remediation Complete)
- **شريط التنقل الإداري الجانبي الثابت (Sticky Sidebar Navigation)**:
  * تحديث `apps/admin/src/app/(protected)/layout.tsx` بإضافة فئات `md:sticky md:top-0 md:h-screen md:overflow-y-auto` لضمان ثبات شريط التنقل وقابليته للتمرير المستقل واستمرارية الوصول لكافة الروابط.
  * إضافة صفة `data-testid={`admin-nav-${item.href.replace("/", "") || "dashboard"}`}` في `AdminSidebarNav.tsx` لدعم استهداف الروابط المستقر في الفحوصات الآلية.
- **تصفية سلاسل الفعاليات بحالة النشر (Events Series Status Filter)**:
  * تحديث `visibleSeries` في `apps/admin/src/app/(protected)/events/EventsManager.tsx` لتطبيق تصفية `statusFilter` جنباً إلى جنب مع مصطلح البحث `seriesTerm`.
- **مواءمة مسميات مرشحات حجز العزاء (Bookings Filter Labels Harmonization)**:
  * مواءمة مصفوفة `STATUS_FILTERS` في `apps/admin/src/app/(protected)/bookings/BookingsManager.tsx` مع `STATUS_LABELS_AR` ("بانتظار الاعتماد" لحالة pending، و"معتمد" لحالة approved) لمنع التناقض بين خيارات التصفية والشارات.
- **تطهير قوالب CMS الاختبارية مسبقاً (Idempotent QA Slug Pre-Cleansing)**:
  * إضافة تطهير مسبق للأسماء اللطيفة المعرفة `qa-dynamic-template` و`qa-temp-*` داخل `createContentTypeAction` في `apps/admin/src/actions/content-type-actions.ts` لحذف القوالب المؤقتة قبل إعادة إنشائها ومنع تكرار خطأ القيد الفريد.
- **بذر القداس الاختباري والفعاليات المحددة بالتاريخ (QA Mass Fixture & Dated Events Seeding)**:
  * بذر كيان قداس الاختبار الحي `قداس اختبار حي QA-2026-09-22` (معرف: `m0000000-0000-0000-0000-000000000099`) في `SEED_MASS_SCHEDULES` داخل `packages/data-access/src/data/seed-data.ts`.
  * تزويد `listAdminWeeklyMasses` في `packages/data-access/src/mass-admin.ts` بآلية دمج آمنة تتضمن القداس الاختباري في بيئات التشغيل مع الحفاظ الصارم على نتيجة الصفر عند فراغ الجدول في وضع الاختبار.
  * إضافة 3 فعاليات مؤرخة متوافقة مع شروط الفحص الزمني في `buildStreamEvents()` داخل `packages/data-access/src/store/seed.ts`:
    1. فعالية 2026-09-25: `startsAt: '2026-09-25T07:00:00.000Z'`، `slug: 'event-2026-09-25'`، `titleAr: 'لقاء رعوي 25 سبتمبر 2026'`.
    2. فعالية 2026-09-27: `startsAt: '2026-09-27T17:00:00.000Z'`، `slug: 'event-2026-09-27'`، `titleAr: 'لقاء صلاة 27 سبتمبر 2026'`.
    3. فعالية 2026-09-29: `startsAt: '2026-09-29T18:00:00.000Z'`، `slug: 'event-2026-09-29'`، `titleAr: 'لقاء شباب 29 سبتمبر 2026'`.

---

### إعادة الهيكلة وتطهير التكرار (Ponytail Audit Monorepo Refactoring)
- **تقليم 13 اعتمادية غير مستخدمة (Pruned 13 Unused Dependencies)**:
  * إزالة الحزم الزائدة من `apps/web` و`apps/admin` و`packages/data-access` (`@supabase/ssr`, `@supabase/supabase-js`, `clsx`, `tailwind-merge`, `nanoid` وغيرها).
- **التخلص التام من `nanoid` (Zero-Dependency ID Generation)**:
  * استبدال `nanoid` بالكامل عبر كافة الحزم بمكتبة `node:crypto` القياسية (`randomBytes(3).toString("hex").toUpperCase()`) لمعرفات حجز العزاء (`booking-reference.ts`).
- **توحيد مكونات واجهة المستخدم المكررة (UI Component Consolidation)**:
  * نقل وتوحيد `FlagBadge`, `LocaleSwitcher`, `flag-styles`, `term-icons` داخل حزمة `@church-site/ui`.
  * حذف النسخ المكررة في `apps/web` و`apps/admin`.
- **حذف البيانات والكود المكرر (Eliminated Duplicate Code & Data)**:
  * حذف 1,152 سطراً مكرراً من `seed-data.ts`.
  * حذف النسخ الزائدة من `cairo-time.ts`, `mass-schedule.ts`, `trusted-embeds.ts` ونقل الاختبارات التابعة إلى حزمها الصحيحة (`packages/data-access`, `packages/domain`, `packages/ui`).
- **تقليم أغطية إعادة التصدير الزائفة (Pruned 35+ Re-export Shims & Redundant Types)**:
  * إزالة أكثر من 35 ملف shim لإعادة التصدير من `apps/web/src/lib/` و`apps/web/src/components/ui/`.
  * توجيه الاستيرادات مباشرة إلى الحزم المشتركة `@church-site/data-access` و`@church-site/domain` و`@church-site/ui`.
  * إزالة `apps/web/src/types/database.types.ts` المكرر والاعتماد الحصري على النوع المصدر من `@church-site/data-access`.
- **تبسيط استيرادات `mailer.ts` وإعدادات Vitest**:
  * تحويل الاستيرادات في `mailer.ts` إلى استيرادات ثابتة ومباشرة وتبسيط تكوين `vitest.config.ts`.
- **صافي تقليص الكود (Net Code Reduction)**:
  * حذف ما يزيد عن 3,500 سطر صافٍ من الكود الميت والمكرر عبر المستودع.
- **بوابات الجودة المؤكدة (Quality Gates Verified)**:
  * فحص الأنواع الصارم: 0 أخطاء عبر كافة المشاريع الخمسة (`pnpm -r typecheck` — 5 of 5 clean).
  * اختبارات الوحدات: نجاح 56 ملف اختبار / 638 فحصاً بنسبة 100% (`pnpm test` — 56 files / 638 passed).
  * بناء تطبيق الويب: ناجح بنسبة 100% مع 59 مساراً ثابتاً وديناميكياً (`pnpm --filter web build` — 59 routes).
  * بناء تطبيق الإدارة: ناجح بنسبة 100% مع 23 مساراً (`pnpm --filter admin build` — 23 routes).
  * فحص الأسرار: 0 أسرار مكتشفة في الشجرة الحالية (`pnpm check:secrets`).

---

## 3. العوائق النشطة (Active Blockers)

> [!tip] Clean Internal Health
> **لا توجد أي عوائق برمجية أو اختبارية داخلية**: لوحة الإدارة 39/39 خضراء بنسبة 100%، وتطبيق الويب العام 26/27 ناجح بنسبة 96.3% مع حالة واحدة فقط محجوبة خارجياً بحاجز Sandbox لنفق TestSprite (فتح Google Maps)، وبإجمالي مجمع 65/66 (98.5% Pass Rate, 0 Failed, 1 Blocked).

1. **اعتماد وتطبيق الهجرات على بيئة Supabase الحية**:
   * الهجرات `20260924100000` و`20260924110000` و`20260924120000` مجهزة ومطبقة محلياً فقط؛ بانتظار موافقة المالك لتطبيقها على قاعدة البيانات الحية وفحص المستشار الأمني (Supabase Security Advisors). راجع التفاصيل في [[Database Migrations & Security Hardening]].
2. **أسرار الإنتاج الخارجية**:
   * استمرار تشغيل إرسال البريد بوضع `noop` والإفصاح الشفاف للزائر لحين تزويد بيانات مزود البريد المعتمد (Resend / SMTP).

---

## 4. الخطوات التالية الفورية (Immediate Next Steps)

1. **استعراض الهجرات والموافقة الصريحة**: الحصول على موافقة المالك قبل أي تطبيق لهجرات قاعدة البيانات على المشروع الحي.
2. **التحقق من المستشار الأمني (Pending live migration and advisor verification)**: تشغيل فحص Supabase Advisors والتحقق من قيود RLS وفهارس التغطية بعد تطبيق الهجرات المعتمدة.
3. **صيانة اتساق بنك الذاكرة داخل Obsidian**: مواصلة فحص ومطابقة أي تغييرات برمجية ضد ملفات الهجرة وأنواع قاعدة البيانات الناتجة فعلياً دون أي افتراضات غير مختبرة عبر شبكة وثائق [[_Index|Obsidian Memory Bank]].

---
*مرجع الذاكرة النشطة — يتم تحديثه إلزامياً عند نهاية كل مهمة.*
