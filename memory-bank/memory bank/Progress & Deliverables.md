---
title: "Progress & Deliverables — سجل الإنجاز"
aliases: ["Progress", "Deliverables", "Task Progress"]
tags:
  - "#memory-bank"
  - "#status/verified"
  - "#progress"
version: "2.0"
last_updated: 2026-09-26
---

# Progress & Deliverables — سجل الإنجاز

> [!info] High-Level Status Overview
> All primary user flows, administrative workflows, and automated gates are verified locally. Monorepo architecture refactored and consolidated into 5 discrete packages. Combined TestSprite pass rate is **98.5% (65/66 green)** with zero fatal failures.

---

## 1. ما تم إنجازه ومتحقق محلياً (Implemented Locally & Verified)

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
  * إنشاء هجرة `20260924110000_rpc_security_hardening.sql`: سحب `EXECUTE` على `handle_new_user` من `PUBLIC, anon, authenticated`؛ سحب `is_admin`, `is_editor`, `is_staff` من `anon, PUBLIC` مع بقائها ممنوحة لـ `authenticated` لدعم سياسات RLS؛ تثبيت مسار البحث الآمن الصريح (safe explicit search_path = `public, pg_temp`)؛ ضبط `normalize_arabic` بمسار `pg_catalog, public, pg_temp`؛ تقييد وتطبيع مدخلات `search_bible` وفحص حدود `track_condolence_booking` (1–20 محرفاً بنسق آمن) وعزل PII (Implemented locally — راجع [[Database Migrations & Security Hardening]]).
- [x] **فهارس التغطية وتحسين RLS InitPlan (Covering Indexes & RLS InitPlan)**:
  * إنشاء هجرة `20260924120000_covering_indexes_and_rls_initplan.sql`: إضافة 9 فهارس تغطية للمفاتيح الأجنبية الفعلية بالمخطط الحي (`original_schedule_id`, `venue_id`, `assigned_priest_id`, `uploaded_by`, `created_by`, `updated_by`, `altar_id`).
  * تطبيق تحسين مبدئي لـ InitPlan عبر تحويل استدعاء `auth.uid()` في سياسة الملف الشخصي ودوال الطاقم `is_staff()` و`is_editor()` إلى `(select auth.uid())`.
- [x] **تنظيف إعدادات Next.js 15 وإمكانية الوصول (Next.js 15 Config & A11y)**:
  * حذف المفتاح غير المعترف به `keepAliveTimeout: 65000` من `apps/web/next.config.ts` و`apps/admin/next.config.ts` وإلغاء تحذير البناء.
  * حصر نطاقات `*.trycloudflare.com` و`localhost` في `serverActions.allowedOrigins` ببيئة التطوير فقط (`!isProduction`).
  * إضافة مستمع مفتاح `Escape` لمودال الفيديو `AdminVideoModal.tsx` لتعزيز إمكانية الوصول من لوحة المفاتيح والتحقق من تنظيف المستمع عند إغلاق/إلغاء تركيب المكون.
- [x] **تأسيس جناح فحص TestSprite وحل مشاكل المسارات (TestSprite Onboarding & Route Hardening)**:
  * إنشاء وتفعيل مشروعي TestSprite حيين:
    - `Church-Site-Web` (`9efc1ddc-85c8-4385-b299-e0a6a50978dd`): 27 فحصاً معتمداً، واجتياز فحوصات تعريف الكنيسة، وتصفح الأقسام، والميديا.
    - `Church-Site-Admin` (`c698af0b-3a3d-40f9-bbb7-599c74ecea47`): 39 فحصاً معتمداً مع المصادقة الحية لحساب `admin@saintsmaximos.org`.
  * حل عائق بادئة `/admin/*`: إضافة توجيهات مسارات تلقائية في `apps/admin/next.config.ts` تحول `/admin/:path*` إلى `/:path*`.
  * تحصين حقول تسجيل الدخول في `AdminLoginForm.tsx`: تزويد الحقول بخواص `name="email"` و`name="password"`.
  * تسخين المجمّع لكافة مسارات الإدارة وتخفيض زمن التجميع والاستجابة من 108 ثوانٍ إلى أقل من ثانية واحدة.
  * تشغيل واكتمال فحص كافة حالات الاختبار الـ 39 لتطبيق الإدارة بنسبة 100% نجاح تام (39/39 Green). تفاصيل الفحوص موثقة في [[TestSprite Quality Gates]].
- [x] **معالجة واجتياز فحوصات E2E الخمسة بالكامل بنسبة 100%**:
  * حل عاصفة التحميل المسبق (Prefetch Storm Fix): إضافة `prefetch={false}` في كافة مكونات الروابط العامة.
  * تحسين إمكانية الوصول وشريط التنقل السريع: اختصارات القداسات والفعاليات على كافة الشاشات مع حصر القائمة المنسدلة بـ `xl:hidden`.
  * بذر ومزامنة بيانات قاعدة البيانات في Supabase: 37 مصطلح تصنيف، 16 سلسلة فعاليات أسبوعية، 4 فعاليات قادمة، وسجلي بث مباشر.
  * ضبط قناة اليوتيوب: تزويد متغير البيئة `NEXT_PUBLIC_YOUTUBE_CHANNEL_URL` في `apps/web/.env.local`.
  * تحصين الاعتماديات: تثبيت إصدار `zod: 3.24.2` في `pnpm.overrides`.

---

## 2. جدول مؤشرات ومقاييس الاختبارات (Overall Verification Test Metrics)

| فئة الاختبار (Test Category) | النطاق (Scope) | الإجمالي (Total) | الناجح (Passed) | الفاشل (Failed) | المحجوب (Blocked) | نسبة النجاح (Pass Rate) | حالة الاعتماد |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Vitest Unit/Integration** | Monorepo Core | 638 | 638 | 0 | 0 | **100%** | Green |
| **Typecheck** | 5 Projects (`pnpm -r typecheck`) | 5 | 5 | 0 | 0 | **100%** | Clean |
| **Admin TestSprite E2E** | `apps/admin` (Port 3001) | 39 | 39 | 0 | 0 | **100%** | Green |
| **Web TestSprite E2E** | `apps/web` (Port 3000) | 27 | 26 | 0 | 1 | **96.3%** | Sandbox Gate |
| **Combined TestSprite E2E** | All Applications | 66 | 65 | 0 | 1 | **98.5%** | Green |
| **Current-Tree Secret Scan** | Whole Repository | 0 | 0 | 0 | 0 | **100%** | Zero Secrets |

> [!note] Blocked Test Clarification
> الحالة المحجوبة الوحيدة في جناح الويب (`5ceab483-9e89-4d91-b699-bee7c36c1c81`): فتح موقع الكنيسة في خرائط Google؛ سبب الحجب ليس عطلاً في الكود بل قيود عزل نفق TestSprite المحلي (`127.0.0.1:3000`) التي تحظر المتصفح الآلي من التنقل للنطاقات الخارجية (`https://maps.google.com`).

---

## 3. إعادة الهيكلة وتطهير التكرار (Ponytail Audit Monorepo Refactoring)

- [x] **تقليم 13 اعتمادية غير مستخدمة**:
  * إزالة الحزم الزائدة من `apps/web` و`apps/admin` و`packages/data-access` (`@supabase/ssr`, `@supabase/supabase-js`, `clsx`, `tailwind-merge`, `nanoid` وغيرها).
- [x] **التخلص التام من `nanoid` (Zero-Dependency ID Generation)**:
  * استبدال `nanoid` بالكامل عبر كافة الحزم بمكتبة `node:crypto` القياسية (`randomBytes(3).toString("hex").toUpperCase()`) لمعرفات حجز العزاء (`booking-reference.ts`).
- [x] **توحيد مكونات واجهة المستخدم المشتركة**:
  * نقل وتوحيد `FlagBadge`, `LocaleSwitcher`, `flag-styles`, `term-icons` داخل حزمة `@church-site/ui`.
  * حذف النسخ المكررة في `apps/web` و`apps/admin`.
- [x] **حذف البيانات والكود المكرر**:
  * حذف 1,152 سطراً مكرراً من `seed-data.ts`.
  * حذف النسخ الزائدة من `cairo-time.ts`, `mass-schedule.ts`, `trusted-embeds.ts` ونقل الاختبارات التابعة إلى حزمها المناسبة.
- [x] **تقليم أغطية إعادة التصدير الزائفة (Pruned 35+ Re-export Shims)**:
  * إزالة أكثر من 35 ملف shim لإعادة التصدير من مسارات `apps/web/src/lib/` و`apps/web/src/components/ui/`.
  * توجيه الاستيرادات مباشرة إلى الحزم المشتركة `@church-site/data-access` و`@church-site/domain` و`@church-site/ui`.
- [x] **صافي تقليص الكود (Net Code Reduction)**:
  * حذف ما يزيد عن **3,500 سطر صافٍ** من الكود الميت والمكرر عبر المستودع مع حفاظ كامل 100% على كافة الميزات والبوابات الخضراء. التفاصيل المعمارية متوفرة في [[Monorepo Architecture]].

---

## 4. قيد الانتظار والتحقق الحي (Pending Live Migration & Verification)

- [ ] **تطبيق هجرات قاعدة البيانات والأمان على الإنتاج**:
  * الهجرات الثلاث: `20260924100000`, `20260924110000`, `20260924120000` (Implemented locally — Pending live migration and advisor verification).
  > [!caution] Non-Negotiable Human Gate
  > يُمنع منعاً باتاً تطبيق أي هجرة على الإنتاج دون موافقة صريحة من المالك.
- [ ] **تحقق المستشار الأمني (Supabase Security Advisors)**:
  * التحقق الحي بعد تطبيق الهجرات لحسم توصيات RLS وفهارس التغطية في الإنتاج؛ مع ملاحظة أن دوال SECURITY DEFINER المكشوفة للجمهور أو المصادقين قد تستمر بإظهار تحذيرات تتطلب مراجعة دورية لمبدأ الحد الأدنى من الصلاحيات.
- [ ] **الفجوات التشغيلية الخارجية**:
  * استمرار وضع `noop` لمحول البريد الإلكتروني مع بقاء الإفصاح الشفاف للزوار حتى اعتماد مفاتيح المزود (Resend / SMTP).
  * توثيق لقطات شاشات دليل الإدارة الحقيقية من بيئة إنتاجية مأهولة.

---

## 5. مراجع الأرشيف التاريخي (Historical Archives)

تم نقل وتنسيق كافة السجلات والتقارير التاريخية السابقة إلى:
- [[Archive/Progress History 2026-09-22|Progress History Archive 2026-09-22]]
- [[Archive/QA Evidence 2026-09-22|QA Evidence Archive 2026-09-22]]

---
*سجل الإنجاز والتحقق — يتم تحديثه إلزامياً فور اكتمال أي مهمة.*
