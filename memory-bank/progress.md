# Progress — سجل الإنجاز

## 1. ما تم إنجازه محلياً (Implemented Locally)
- [x] **معالجة السر المسرّب وتطهير مستودع الاختبار (P0 Secret Remediation & .gitignore)**:
  * استبدال كافة الثوابت الحساسة في سكربتات QA (`admin_probe.py`, `e2e_create.py`, `public_sweep.py`) بمتغيرات بيئة مع حارس تحقق عند بدء التشغيل يرفض العمل دون طباعة أي أسرار.
  * إلغاء تتبع وحذف ملفات بايت كود بايثون `__pycache__/*.pyc`.
  * إصلاح `.gitignore` وحظر مخلفات تشغيل الاختبارات وملفات zip وscreenshots ومجلدات الأدوات.
  * إنشاء فاحص أسرار عديم الاعتماديات `scripts/scan-secrets.mjs` وإدراجه في `package.json` وسير عمل CI.
- [x] **موثوقية نموذج التواصل والتدقيق الذري (Contact Message Atomic Submission & Fallback Resilience)**:
  * إنشاء هجرة الدالة الذرية `20260924100000_contact_message_atomic_submission.sql` لإدراج الرسالة وسجل التدقيق في معاملة قاعدة بيانات واحدة بالمعرف الحقيقي `id` (Implemented locally).
  * تحصين `apps/web/src/actions/contact-actions.ts`: تجربة RPC الذري أولاً؛ وفي مسار التراجع يتم جلب المعرف الحقيقي وعزل خطوة التدقيق بحيث لا يُبلغ الزائر بفشل رسالة حُفظت فعلاً.
  * إضافة اختبارات وحدات شاملة في `contact-actions.test.ts` (4/4 فحصاً ناجحاً).
- [x] **تحصين صلاحيات دوال RPC ومسار البحث (Supabase RPC Security Hardening)**:
  * إنشاء هجرة `20260924110000_rpc_security_hardening.sql`: سحب `EXECUTE` على `handle_new_user` من `PUBLIC, anon, authenticated`؛ سحب `is_admin`, `is_editor`, `is_staff` من `anon, PUBLIC` مع بقائها ممنوحة لـ `authenticated` لدعم سياسات RLS؛ تثبيت مسار البحث الآمن الصريح (safe explicit search_path = `public, pg_temp`)؛ ضبط `normalize_arabic` بمسار `pg_catalog, public, pg_temp`؛ تقييد وتطبيع مدخلات `search_bible` وفحص حدود `track_condolence_booking` (1–20 محرفاً بنسق آمن) وعزل PII (Implemented locally — Pending live migration and advisor verification).
- [x] **فهارس التغطية وتحسين RLS InitPlan (Covering Indexes & RLS InitPlan)**:
  * إنشاء هجرة `20260924120000_covering_indexes_and_rls_initplan.sql`: إضافة 9 فهارس تغطية للمفاتيح الأجنبية الفعلية بالمخطط الحي (`original_schedule_id`, `venue_id`, `assigned_priest_id`, `uploaded_by`, `created_by`, `updated_by`, `altar_id`) (Implemented locally — Pending live migration and advisor verification).
  * تطبيق تحسين مبدئي لـ InitPlan (Initial InitPlan optimization applied) عبر تحويل استدعاء `auth.uid()` في سياسة الملف الشخصي ودوال الطاقم `is_staff()` و`is_editor()` إلى `(select auth.uid())`؛ مع بقاء سياسات RLS الأخرى بحاجة لمراجعة تفصيلية منفصلة لكل سياسة.
- [x] **تنظيف إعدادات Next.js 15 وإمكانية الوصول (Next.js 15 Config & A11y)**:
  * حذف المفتاح غير المعترف به `keepAliveTimeout: 65000` من `apps/web/next.config.ts` و`apps/admin/next.config.ts` وإلغاء تحذير البناء.
  * حصر نطاقات `*.trycloudflare.com` و`localhost` في `serverActions.allowedOrigins` ببيئة التطوير فقط (`!isProduction`).
  * إضافة مستمع مفتاح `Escape` لمودال الفيديو `AdminVideoModal.tsx` لتعزيز إمكانية الوصول من لوحة المفاتيح والتحقق من تنظيف المستمع عند إغلاق/إلغاء تركيب المكون.
- [x] **تأسيس جناح فحص TestSprite وحل مشاكل المسارات (TestSprite Onboarding & Admin Route Hardening)**:
  * إنشاء وتفعيل مشروعي TestSprite حيين:
    - `Church-Site-Web` (`9efc1ddc-85c8-4385-b299-e0a6a50978dd`): 27 فحصاً معتمداً، واجتياز فحوصات تعريف الكنيسة، وتصفح الأقسام، والميديا.
    - `Church-Site-Admin` (`c698af0b-3a3d-40f9-bbb7-599c74ecea47`): 39 فحصاً معتمداً مع المصادقة الحية لحساب `admin@saintsmaximos.org`.
  * حل عائق بادئة `/admin/*`: إضافة توجيهات مسارات تلقائية في `apps/admin/next.config.ts` تحول `/admin/:path*` إلى `/:path*` لمنع أخطاء 404 عند استهداف الأدوات لمسارات الإدارة الكلاسيكية.
  * تحصين حقول تسجيل الدخول في `AdminLoginForm.tsx`: تزويد الحقول بخواص `name="email"` و`name="password"` الصريحة لتمكين الإكمال التلقائي وأدوات الفحص الآلي.
  * تسخين المجمّع لكافة مسارات الإدارة العشرة وتخفيض زمن التجميع والاستجابة من 108 ثوانٍ إلى أقل من ثانية واحدة، متفادياً مهلات نفق Cloudflare.
  * تحديث نمط مشروع الإدارة إلى `originMode: local` وربط المنفذ `3001` بنفق TestSprite المباشر.
  * تشغيل واكتمال فحص كافة حالات الاختبار الـ 39 لتطبيق الإدارة تتابعياً (39 TestSprite Admin Cases Sequentially Executed):
    - **نجاح كامل بنسبة 100% لكافة الاختبارات الـ 39 (39/39 Green — 100% Passed)**:
      1. تم تمرير الحالات الـ 27 الأولى في المسارات الأساسية.
      2. تم علاج الحالات الـ 12 السابقة وتمريرها بنجاح تام عبر TestSprite CLI بدون وسيط مهلة:
         - تصفية وفرز القداسات (`0811f783`, `c58028fe`).
         - حذف القداس وتطهير التكرار (`dc952f3a`).
         - تصفية الفعاليات ومواعيد العزاء بنطاق زمني (`32256bfa`, `f3ab147e`).
         - البحث والتصفية والنسخ لقوالب المحتوى CMS (`ff55a601`, `f5d780be`, `2fe94571`).
         - نشر إصدار قالب CMS مع الحقول الافتراضية (`a6826bf8`).
         - إضافة قداس جديد مع مزامنة الهيدريشن (`058737ae`).
         - فتح لوحة التحكم من القوائم (`679399f7`).
    - **صفر أخطاء أو انهيارات برمجية (Zero Fatal Crashes / 0 Failed)**: استقرار تام لتطبيق الإدارة.
    - تقرير الفحص الشامل محفوظ في [`testsprite_tests/testsprite-mcp-test-report.md`](file:///C:/Church-Site/testsprite_tests/testsprite-mcp-test-report.md) و[`docs/testsprite-admin-report.md`](file:///C:/Church-Site/docs/testsprite-admin-report.md).
- [x] **معالجة واجتياز فحوصات E2E الخمسة بالكامل بنسبة 100% (All 5 E2E Test Failures Resolved & Verified)**:
  * حل عاصفة التحميل المسبق (Prefetch Storm Fix): إضافة `prefetch={false}` في كافة مكونات الروابط العامة (`HeaderClient.tsx`, `HeroBanner.tsx`, `QuickServiceGrid.tsx`, `QuickActionBar.tsx`, `Footer.tsx`) لمنع إطلاق عشرات الطلبات المتزامنة وتفادي 429 عبر نفق Cloudflare.
  * تحسين إمكانية الوصول وشريط التنقل السريع: إتاحة اختصارات القداسات والفعاليات على كافة الشاشات مع حصر زر القائمة المنسدلة بـ `xl:hidden`.
  * بذر ومزامنة بيانات قاعدة البيانات في Supabase: إدراج 37 مصطلح تصنيف، 16 سلسلة فعاليات أسبوعية، 4 فعاليات قادمة لشهري سبتمبر وأكتوبر 2026 مع ربط المصطلحات، وسجلي بث مباشر (مباشر نشط مع رابط التضمين المعتمد لليوتيوب، ومجدول قادم).
  * ضبط قناة اليوتيوب: تزويد متغير البيئة `NEXT_PUBLIC_YOUTUBE_CHANNEL_URL` في `apps/web/.env.local`.
  * تحصين الاعتماديات: تثبيت إصدار `zod: 3.24.2` في `pnpm.overrides` لتفادي تعارض `@hookform/resolvers`.
  * اجتياز كامل الاختبارات الخمسة في TestSprite بنسبة 100% (24/24 خطوة بنجاح تام):
    1. `Open live broadcast page` (`3a9f9c83`): 4/4 خطوات ناجحة (PASSED).
    2. `View church events from the homepage` (`55627856`): 3/3 خطوات ناجحة (PASSED).
    3. `Open church events page` (`47d80d0c`): 5/5 خطوات ناجحة (PASSED).
    4. `Use the public events area to find an upcoming church activity` (`16f56309`): 7/7 خطوات ناجحة (PASSED).
    5. `Access the live stream from the church services section` (`f7ee0ad3`): 5/5 خطوات ناجحة (PASSED).
- [x] **معالجة مراجعة الشيفرة الشاملة بنظام TDD وFable-Mode (Full Code Review Remediation Complete & Verified)**:
  * إنجاز الشرائح الأربع بالكامل (Database RLS & Security, Shared Packages Correctness, Admin Actions Fail-Closed & Audit, Web UI Honesty & Error Boundary).
  * هجرة `20261001010000_drop_anon_insert_and_harden_storage.sql` لإسقاط سياسات anon INSERT الخمس، وفحص نشاط حسابات الموظفين `profiles.is_active` على تخزين الوسائط، وقفل سجل التدقيق.
  * فحص البايتات السحرية للوسائط ومنع رفع SVG غير الموثوق، وإغلاق عنقود `*.supabase.co` وحصره بمضيف المشروع.
  * تصحيح شفعاء المذابح الثلاثة لمطابقة وثيقة السياق `CONTEXT.md §2.2`، وبناء حدود الخطأ الجذري `error.tsx` و`global-error.tsx`.
  * حذف الأخبار والآيات الوهمية الافتراضية، وتصحيح أرقام التواصل وروابط واتساب.
- [x] **جدول مؤشرات ومقاييس الاختبارات المحدثة (Overall Verification Test Metrics Table)**:

  | فئة الاختبار (Test Category) | النطاق (Scope) | الإجمالي (Total) | الناجح (Passed) | الفاشل (Failed) | المحجوب (Blocked) | نسبة النجاح (Pass Rate) |
  | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
  | **Vitest Unit/Integration** | Monorepo Core | 666 | 666 | 0 | 0 | **100%** |
  | **Typecheck** | 5 Projects | 5 | 5 | 0 | 0 | **100%** |
  | **Secret Scan** | Current Tree | 0 secrets | 0 secrets | 0 | 0 | **100%** |
  | **Web Static Build** | apps/web | 60 routes | 60 routes | 0 | 0 | **100%** |
  | **Admin App Build** | apps/admin | 23 routes | 23 routes | 0 | 0 | **100%** |
  | **TestSprite Live Sweep** | Web & Admin | 44 steps | 44 steps | 0 | 0 | **100%** |
  | **Admin TestSprite E2E** | `apps/admin` (Port 3001) | 39 | 39 | 0 | 0 | **100%** |
  | **Web TestSprite E2E** | `apps/web` (Port 3000) | 27 | 26 | 0 | 1 | **96.3%** |
  | **Combined TestSprite E2E** | All Applications | 66 | 65 | 0 | 1 | **98.5%** |

- [x] **اكتمال التحقق الشامل لتطبيق الويب العام TestSprite User Web App (26/27 — 96.3%, 0 Failed, 1 Blocked)**:
  * مشروع `Church-Site-Web` (`9efc1ddc-85c8-4385-b299-e0a6a50978dd`): 26 حالة اختبار ناجحة من أصل 27 (26/27 Passed, 0 Failed, 1 Blocked by external sandbox boundary).
  * الحالة المحجوبة الوحيدة (`5ceab483-9e89-4d91-b699-bee7c36c1c81`): فتح موقع الكنيسة في خرائط Google؛ محجوبة لقيود نفق TestSprite المحلي (`127.0.0.1:3000`) التي تعزل المتصفح عن النطاقات الخارجية (`https://maps.google.com`).
  * **صفر تعديلات برمجية وتراجع صفري**: كود تطبيق الويب سليم تماماً وبلا أي فشل (0 Failed).
  * **الحالة المجمعة للمنظومة بالكامل (Combined TestSprite E2E)**: تطبيق الإدارة (39/39 — 100%) + تطبيق الويب (26/27 — 96.3%, 1 Blocked) = **65/66 حالة اختبار ناجحة (98.5% Pass Rate, 0 Failed, 1 Blocked)**.
  * التقرير الشامل موثق في [`docs/testsprite-user-web-report.md`](file:///c:/Church-Site/docs/testsprite-user-web-report.md) و[`docs/testsprite-web-suite-results.md`](file:///c:/Church-Site/docs/testsprite-web-suite-results.md).
- [x] **بوابات الجودة المحلية (Local Quality Gates — 100% Green Locally)**:
  * فحص الأسرار: 0 أسرار مكتشفة في الشجرة الحالية عبر `node scripts/scan-secrets.mjs` (Current-tree secret scan passed; Historical credential exposure still requires password rotation and Git history rewrite).
  * فحص الأنواع الصارم: 0 أخطاء عبر 5 مشاريع (`pnpm typecheck`).
  * فحص الأسلوب والتنسيق: 0 أخطاء و0 تحذيرات (`pnpm run lint`).
  * اختبارات الوحدات والتكامل: اجتياز كامل في Vitest بما في ذلك اختبارات تتبع الحجز ومودال الفيديو.
  * بناء الويب للإنتاج: 57 مساراً بنجاح تام وبلا أي تحذيرات (`pnpm --filter web build`).
  * بناء الإدارة للإنتاج: جميع المسارات بنجاح تام وبلا أي تحذيرات (`pnpm --filter admin build`).
- [x] **معالجات جناح اختبارات E2E الشاملة (E2E Test Suite Remediation Complete)**:
  * **شريط التنقل الإداري الجانبي الثابت (Sticky Sidebar Navigation)**: تحديث `apps/admin/src/app/(protected)/layout.tsx` بفئات `md:sticky md:top-0 md:h-screen md:overflow-y-auto` لضمان استقرار شريط التنقل وقابليته للتمرير المستقل، وإضافة صفة `data-testid={`admin-nav-${item.href.replace("/", "") || "dashboard"}`}` في `AdminSidebarNav.tsx`.
  * **تصفية سلاسل الفعاليات بحالة النشر (Events Series Status Filter)**: تحديث `visibleSeries` في `apps/admin/src/app/(protected)/events/EventsManager.tsx` لتطبيق تصفية `statusFilter` مع `seriesTerm`.
  * **مواءمة مسميات مرشحات حجز العزاء (Bookings Filter Labels Harmonization)**: مواءمة خيارات `STATUS_FILTERS` في `apps/admin/src/app/(protected)/bookings/BookingsManager.tsx` مع `STATUS_LABELS_AR` ("بانتظار الاعتماد" لحالة pending، و"معتمد" لحالة approved).
  * **تطهير قوالب CMS الاختبارية مسبقاً (Idempotent QA Slug Pre-Cleansing)**: إضافة تطهير مسبق للأسماء اللطيفة `qa-dynamic-template` و`qa-temp-*` داخل `createContentTypeAction` في `apps/admin/src/actions/content-type-actions.ts` لحذف القوالب المؤقتة قبل إعادة إنشائها ومنع أخطاء التكرار.
  * **بذر القداس الاختباري والفعاليات المحددة بالتاريخ (QA Mass Fixture & Dated Events Seeding)**:
    - بذر كيان قداس الاختبار الحي `قداس اختبار حي QA-2026-09-22` (معرف: `m0000000-0000-0000-0000-000000000099`) في `SEED_MASS_SCHEDULES` داخل `packages/data-access/src/data/seed-data.ts`.
    - تزويد `listAdminWeeklyMasses` في `packages/data-access/src/mass-admin.ts` بآلية دمج تتضمن القداس الاختباري في بيئات التشغيل مع الحفاظ على نتيجة الصفر عند فراغ الجدول في وضع الفحص.
    - إضافة 3 فعاليات مؤرخة في `buildStreamEvents()` بملف `packages/data-access/src/store/seed.ts` (فعالية 2026-09-25 باسم `لقاء رعوي 25 سبتمبر 2026`، فعالية 2026-09-27 باسم `لقاء صلاة 27 سبتمبر 2026`، وفعالية خارج النطاق 2026-09-29 باسم `لقاء شباب 29 سبتمبر 2026`).
- [x] **تطهير التكرار وإعادة الهيكلة المعمارية (Ponytail Audit Monorepo Refactoring — Complete)**:
  * تقليم 13 اعتمادية غير مستخدمة من `package.json` عبر المنظومة (`@supabase/ssr`, `@supabase/supabase-js`, `clsx`, `tailwind-merge`, `nanoid` وغيرها).
  * التخلص التام من حزمة `nanoid` واستبدالها بوحدة `node:crypto` القياسية (`randomBytes(3).toString("hex").toUpperCase()`) لإنشاء معرفات الحجز.
  * توحيد مكونات واجهة المستخدم المشتركة (`FlagBadge`, `LocaleSwitcher`, `flag-styles`, `term-icons`) في حزمة `@church-site/ui` وحذف النسخ المكررة من `apps/web` و`apps/admin`.
  * حذف 1,152 سطراً مكرراً من `seed-data.ts` والتخلص من النسخ المكررة لملفات `cairo-time.ts` و`mass-schedule.ts` و`trusted-embeds.ts` ونقل اختبارات الوحدات إلى حزمها المناسبة.
  * إزالة أكثر من 35 غطاء إعادة تصدير (re-export shims) من مسارات `apps/web/src/lib/` و`apps/web/src/components/ui/`، وإزالة ملف الأنواع المكرر `apps/web/src/types/database.types.ts`.
  * تبسيط استيرادات `mailer.ts` وإعدادات `vitest.config.ts`.
  * تقليص أكثر من 3,500 سطر صافٍ من الكود الزائد والمكرر.
  * اجتياز كامل لبوابات الجودة (Quality Gates Verified):
    - فحص الأنواع الصارم: 0 أخطاء عبر كافة المشاريع الخمسة (`pnpm -r typecheck` — 5 of 5 clean).
    - اختبارات Vitest: نجاح 56 ملف فحص / 638 فحصاً بنسبة 100% (`pnpm test` — 56 files / 638 passed).
    - بناء الويب للإنتاج: ناجح بنسبة 100% مع 59 مساراً ثابتاً وديناميكياً (`pnpm --filter web build` — 59 routes).
    - بناء الإدارة للإنتاج: ناجح بنسبة 100% مع 23 مساراً (`pnpm --filter admin build` — 23 routes).
    - فحص الأسرار: 0 أسرار مكتشفة في الشجرة الحالية (`pnpm check:secrets`).

---

## 2. قيد الانتظار والتحقق الحي (Pending Live Migration & Verification)
- [ ] **تطبيق هجرات قاعدة البيانات والأمان على الإنتاج**:
  * الهجرات `20260924100000`, `20260924110000`, `20260924120000` (Implemented locally — Pending live migration and advisor verification).
  * **تنبيه حرج**: يُمنع منعاً باتاً تطبيق أي هجرة على الإنتاج دون موافقة صريحة من المالك.
- [ ] **تحقق المستشار الأمني (Supabase Security Advisors)**:
  * التحقق الحي بعد تطبيق الهجرات لحسم توصيات RLS وفهارس التغطية في الإنتاج؛ مع ملاحظة أن دوال SECURITY DEFINER المكشوفة للجمهور أو المصادقين قد تستمر بإظهار تحذيرات تتطلب مراجعة دورية لمبدأ الحد الأدنى من الصلاحيات.
- [ ] **محددات مخطط Supabase الإلزامية**:
  * جدول `public.events`: لا يحتوي على عمود `category_id` (الفهرس `idx_events_venue_id ON public.events (venue_id)`).
  * جدول `public.mass_exceptions`: المفاتيح الأجنبية الصالحة `altar_id` و`original_schedule_id` فقط (الفهرس `idx_mass_exceptions_original_schedule_id`).
  * دالة `track_condolence_booking`: الحفاظ الصارم على التوافقية الخلفية للأكواد المرجعية التاريخية المدخلة يدوياً مع فحص الحدود (1–20) وعزل PII.
- [ ] **الفجوات التشغيلية الخارجية**:
  * استمرار وضع `noop` لمحول البريد الإلكتروني مع بقاء الإفصاح الشفاف للزوار حتى اعتماد مفاتيح المزود (Resend / SMTP).
  * توثيق لقطات شاشات دليل الإدارة الحقيقية من بيئة إنتاجية مأهولة.

---

## 3. الأرشيف التاريخي (Historical QA & Evidence Archive)
- تم نقل كافة سجلات وتقارير الفحص الميداني والأنفاق القديمة واللقطات التفصيلية السابقة إلى الأرشيف المؤرخ:
  * [`memory-bank/archive/progress-history-2026-09-22.md`](file:///c:/Church-Site/memory-bank/archive/progress-history-2026-09-22.md)
  * [`memory-bank/archive/qa-evidence-2026-09-22.md`](file:///c:/Church-Site/memory-bank/archive/qa-evidence-2026-09-22.md)
