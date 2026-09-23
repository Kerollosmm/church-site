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
- [x] **بوابات الجودة المحلية (Local Quality Gates — 100% Green Locally)**:
  * فحص الأسرار: 0 أسرار مكتشفة في الشجرة الحالية عبر `node scripts/scan-secrets.mjs` (Current-tree secret scan passed; Historical credential exposure still requires password rotation and Git history rewrite).
  * فحص الأنواع الصارم: 0 أخطاء عبر 5 مشاريع (`pnpm typecheck`).
  * فحص الأسلوب والتنسيق: 0 أخطاء و0 تحذيرات (`pnpm run lint`).
  * اختبارات الوحدات والتكامل: اجتياز كامل في Vitest بما في ذلك اختبارات تتبع الحجز ومودال الفيديو.
  * بناء الويب للإنتاج: 57 مساراً بنجاح تام وبلا أي تحذيرات (`pnpm --filter web build`).
  * بناء الإدارة للإنتاج: جميع المسارات بنجاح تام وبلا أي تحذيرات (`pnpm --filter admin build`).

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
