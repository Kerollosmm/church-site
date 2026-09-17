# Active Context — الحالة الحالية

## أين نحن (2026-09-17)
- **اكتملت بالكامل واعتُمدت (Phase 3 Content Types Engine — Verified & Complete)**:
  * **سلسلة التزامات المرحلة الثالثة (`563acf5`..`[HEAD]`)**:
    1. `563acf5` `feat(domain): content types model and capabilities`
    2. `1905865` `chore(db): content types schema and rls`
    3. `8ef796e` `feat(data-access): content type repository and runtime schema`
    4. `4427e1f` `feat(admin): content types manager`
    5. `3f0ee20` `feat(admin): dynamic content editor`
    6. `855478c` `test(admin): fix type narrowing in content actions test`
    7. `ebb0e61` `fix(data-access): export dynamic-validator from client entrypoint`
    8. `e316b56` `feat(web): generic content routes and templates`
    9. `620c1e0` `test: cover content engine`
    10. `44abeb3` `test(data-access): add e2e content proof test`
    11. `e897c98` `fix(web): ensure INV-01 isolation regex passes`
    12. `51e76eb` `docs: content types engine`
  * **إحصائيات الاختبارات المحدثة**: 21 ملف اختبار، **362/362 فحصاً ناجحاً بنسبة 100% (Green)** في Vitest بعد إضافة 44 فحصاً جديداً لمحرك المحتوى ونظام التحقق الديناميكي.
  * **بوابات التحقق الصلبة للمرحلة الثالثة (G1–G9 All Passed & Verified)**:
    - G1: فحص الأنواع لكافة التطبيقات والحزم = 0 أخطاء (`.scratch/phase3-gates/g1-web-tsc.txt`، `g1-admin-tsc.txt`).
    - G2: فحص الأسلوب `eslint .` = 0 أخطاء (`.scratch/phase3-gates/g2-lint.txt`).
    - G3: اختبارات الوحدات = 21 ملفاً، 362 فحصاً ناجحاً (`.scratch/phase3-gates/g3-test.txt`).
    - G4: بناء الويب بصفر متغيرات بيئة = 53/53 مساراً ثابتاً (`.scratch/phase3-gates/g4-web-build.txt`).
    - G5: بناء الإدارة = جميع مسارات `/content-types` و`/content/*` بنجاح كامل (`.scratch/phase3-gates/g5-admin-build.txt`).
    - G6: اختبار دورة المحرك الكاملة = 100% نجاح محلياً وحياً على Supabase (PASS):
      * محلياً: 100% نجاح على محرك مخزن الملفات (`.scratch/phase3-gates/g6-content.txt`، `g6-label.txt`).
      * حياً على Supabase (`mlprvcgbwwihnjyvyawm`): تم تطبيق الهجرة 13 (`20260916130000_content_types.sql`) بنجاح كامل عبر `supabase db push`.
      * اختبار الدورة الحية الكاملة عبر `live-content-smoke.ps1`: إنشاء نوع تجريبي (`g6-smoke-live`)، إضافة 3 حقول (نص، وسائط، قائمة اختيار)، إنشاء مشاركة مسودة وإثبات حجبها التام عن قارئ anon (INV-01 Zero-Leakage)، نشر المشاركة وإثبات قراءتها بالكامل عبر قارئ anon، تحديث المشاركة وإثبات انعكاس التعديل، وحذف كامل للسجلات التجريبية وتأكيد خلو قاعدة البيانات من أي بقايا (HTTP 200 / 0 rows).
      * توثيق الأدلة الحية كاملة في `.scratch/phase3-gates/live/`: `live-conclusion.txt` (PASS)، `live-env.txt`، `live-flow.txt`، `live-cleanup.txt`.
    - G7: حفظ سجل Git عبر `git log --follow` مؤكد عبر التاريخ (`.scratch/phase3-gates/g7-git-log.txt`).
    - G8: هجرة قاعدة البيانات 13 (`20260916130000_content_types.sql`) مطبقة حياً ومؤكدة بالكامل (`.scratch/phase3-gates/g8-git-status.txt`).
    - G9: عزل تام للحدود: `apps/web` لا يحوي أي استيراد أو إجراء كتابة، و`apps/admin` لا يحوي استيراداً مباشراً لـ `@supabase` (`.scratch/phase3-gates/g9-content-web.txt`، `g9-imports-admin.txt`).
  * **تسليم التوثيق**:
    - دليل طاقم الكنيسة بالعربية `docs/content-types-guide.md`.
    - وثيقة المعمارية التقنية `docs/phase3-content-types.md`.
    - سجل القرار المعماري `docs/adr/0003-content-types-engine.md`.
    - تقرير المراجعة `REVIEW.md`: إضافة أقسام المرحلة الثالثة 10 إلى 13.
  * **الخطوة التالية الفورية (Next Immediate Step)**:
    - اعتماد واختتام المرحلة الثالثة بالكامل بعد اجتياز كافة البوابات التسع G1-G9 بنجاح 100% مع الإثبات الحي (Phase 3 100% Signed-off & Verified).
    - رفع الالتزامات إلى الفرع الرئيسي على GitHub (`git push origin master`).
- **اكتملت بالكامل واعتُمدت (Phase 2 Media Upload & Supabase Storage — Verified & Complete)**:
  * **سلسلة الالتزامات الستة للمرحلة الثانية (`c0e1c91`..`5ffa1f3`)**:
    1. `c0e1c91` `feat(domain): add storage fields to media model`
    2. `a4458b8` `feat(data-access): add MediaStorage adapter`
    3. `a7ff1fb` `chore(db): add media storage bucket and policies`
    4. `55152be` `feat(admin): real media upload action and uploader`
    5. `fc3d752` `feat(web): render real uploaded media in gallery`
    6. `5ffa1f3` `test: cover media upload pipeline`
  * **إحصائيات الاختبارات المحدثة**: 16 ملف اختبار، **318/318 فحصاً ناجحاً بنسبة 100% (Green)** في Vitest بعد إضافة اختبارات محول التخزين ومخططات الوسائط وإجراءات الرفع ومعرض الصور.
  * **بوابات التحقق الصلبة للمرحلة الثانية (G1–G9 All Passed & Live Verified)**:
    - G1: فحص الأنواع لكافة التطبيقات والحزم = 0 أخطاء (`.scratch/phase2-gates/g1-web-tsc.txt`، `g1-admin-tsc.txt`).
    - G2: فحص الأسلوب `eslint .` = 0 أخطاء (`.scratch/phase2-gates/g2-lint.txt`).
    - G3: اختبارات الوحدات = 16 ملفاً، 318 فحصاً ناجحاً (`.scratch/phase2-gates/g3-test.txt`).
    - G4: بناء الويب بصفر متغيرات بيئة = 50/50 مساراً ثابتاً (`.scratch/phase2-gates/g4-web-build.txt`).
    - G5: بناء الإدارة = 5/5 مسارات بنجاح كامل (`.scratch/phase2-gates/g5-admin-build.txt`).
    - G6: اختبار دورة الرفع والحذف والتحقق من التجزئة SHA-256 ناجح محلياً وحياً على Supabase (PASS):
      * مشروع Supabase الحي: `mlprvcgbwwihnjyvyawm`.
      * تطبيق الهجرة 12 (`20260916120000_media_storage.sql`) بنجاح كامل لإنشاء حاوية `media` وسياسات RLS.
      * اختبار الدورة الحية الكاملة: رفع بايتات تجريبية بـ HTTP 200 وتطابق كامل للتجزئة SHA-256 (`63ef318d...`)، وتنزيل بـ HTTP 200، وحذف بـ HTTP 200، وفحص نفي الوجود اللاحق بـ 404 NoSuchKey.
      * توثيق الأدلة الحية كاملة في `.scratch/phase2-gates/live/` (`live-conclusion.txt`, `live-upload.txt`, `live-delete.txt`, `live-env.txt`).
    - G7: حفظ سجل Git عبر `git log --follow` مؤكد (`.scratch/phase2-gates/g7-git-log.txt`).
    - G8: هجرة مساحة التخزين `20260916120000_media_storage.sql` جاهزة ومؤكدة (`.scratch/phase2-gates/g8-git-status.txt`).
    - G9: عزل تام للحدود: `apps/web` لا يحوي أي استيراد تخزين؛ `apps/admin` لا يحوي أي استيراد مباشر لـ `@supabase` (`.scratch/phase2-gates/g9-storage-web.txt`، `g9-imports-admin.txt`).
  * **تسليم التوثيق**:
    - دليل الإدارة `docs/admin-guide.md`: توثيق إمكانيات الرفع المباشر والصيغ والحد الأقصى 50MB وشارات التخزين.
    - وثيقة التخزين `docs/media-storage.md`: تفصيل الحاوية والمحول ومسار التجزئة وسياسات RLS وثابت INV-01.
    - دليل النشر `docs/deployment-split.md`: توثيق متطلبات `media` bucket ومفتاح `SUPABASE_SERVICE_ROLE_KEY`.
    - تقرير المراجعة `REVIEW.md`: إضافة أقسام المرحلة الثانية 6 إلى 9.
  * **الخطوة التالية الفورية (Next Immediate Step)**:
    - اعتماد واختتام المرحلة الثانية بالكامل (Phase 2 100% Signed-off & Verified).
    - جاهز لبدء التخطيط والتنفيذ للمرحلة الثالثة (Ready for Phase 3 planning / execution).
    - أولويات المرحلة الثالثة المقترحة: محرر مصطلحات التصنيف في لوحة الإدارة، استكمال نصوص أسفار الكتاب المقدس، أو ربط مزود البريد الحقيقي عند توفير بيانات الاعتماد.
- **اكتملت بالكامل ورُفعت إلى GitHub (Phase 1 Monorepo Split Pushed & Verified)**:
  * **الحالة على المستودع البعيد**: الفرع `master` على `https://github.com/Kerollosmm/church-site` متزامن ومحدَّث بسلسلة الالتزامات العشرة (`48c743b..7cd5a20`).
  * **سلسلة الالتزامات العشرة (The 10 Conventional Commits)**:
    1. `a83b139` `refactor(web): move app into apps/web`
    2. `2597889` `chore(packages): extract domain`
    3. `d53a234` `chore(packages): extract data-access`
    4. `79bd13c` `chore(packages): extract ui`
    5. `fdd4bdc` `feat(admin): scaffold admin app`
    6. `ccf26ab` `refactor(web): remove admin surface`
    7. `1bbd634` `chore: wire env and build configs`
    8. `d717230` `ci: build and test web + admin`
    9. `f8b9d20` `docs: record admin split decision and deployment`
    10. `7cd5a20` `docs: add reviewer checklist and verification guide`
  * **محاسبة المسارات (Route Accounting & Invariance Proof)**:
    - الأساس القديم (Monolith): 51 صفحة ثابتة مولَّدة مسبقاً (50 صفحة عامة + صفحة `/admin/login` الثابتة) بالإضافة لـ 11 مساراً إدارياً ديناميكياً.
    - موقع الويب الجديد (`apps/web`): يولد بالضبط **50/50 صفحة ثابتة** (كافة المسارات العامة)، ولا يحوي أي مسار إداري.
    - تطبيق الإدارة الجديد (`apps/admin`): يحوي **12 مساراً إدارياً** بالكامل (`/`, `/audit`, `/bookings`, `/events`, `/events/[id]/edit`, `/events/new`, `/events/series/[id]`, `/events/series/new`, `/login`, `/masses`, `/media`, `/subscribers`).
    - الإثبات: 50 مساراً عاماً + 12 مساراً إدارياً = 100% حفظ لكافة المسارات بدون فقدان أي مسار.
  * **إفصاح محرك فحص الكتابة الإدارية (G6 Disclosure)**:
    - فحص الكتابة وعزل الأعطال G6 نُفِّذ واختُبِر على محرك مخزن الملفات (`driver: 'json'`) في `apps/admin/.data/church-store.json` بنجاح كامل وسجل تدقيق موثَّق. الاختبار على قاعدة Supabase الحية معلَّق لحين توفير بيانات الاعتماد في بيئة النشر.
  * **أدلة الفحص الخام (Raw Grep Outputs)**:
    - `g9-rg-web.txt`: مخرجات خام لـ `git grep -n admin -- apps/web/src` تثبت خلو تطبيق الويب من أي مسار أو إجراء إداري.
    - `g9-imports-admin.txt`: مخرجات خام لـ `git grep -n '@church-site' -- apps/admin/src` تثبت استهلاك البيانات عبر الحزم فقط، و`@supabase` يعيد 0 مطابقة.
    - ملفات الأساس `00-baseline-{build,lint,test,typecheck}.txt` مؤكَّدة ومحفوظة بالكامل على القرص.
  * **إعادة تشغيل البوابات الصلبة مباشرة (Direct Verification with Timestamps)**:
    - G1: فحص الأنواع لكلا التطبيقين `pnpm --filter web typecheck` و`admin typecheck` = 0 أخطاء (2026-09-17 18:11-18:12).
    - G2: فحص الأسلوب `pnpm run lint` = 0 أخطاء (2026-09-17 18:12).
    - G3: اختبارات الوحدات `pnpm test` = 12 ملفاً، **274/274 فحصاً ناجحاً بنسبة 100%** (2026-09-17 18:13).
    - G4: بناء الويب بصفر متغيرات بيئة `pnpm --filter web build` = **50/50 مساراً نظيفاً** (2026-09-17 18:15).
    - G5: بناء الإدارة `pnpm --filter admin build` = نظيف (2026-09-17 18:17).
  * **الخطوة التالية الفورية (Next Immediate Step)**:
    - تسليم المراجعة الخارجية عبر `REVIEW.md` و`.scratch/phase1-gates/`.
    - بدء التجهيز للمرحلة الثانية (Phase 2): تجهيز حاويات Supabase Storage ورفع الوسائط الحقيقية للمعرض والفعاليات والكهنة عبر `@church-site/data-access`.
- **اكتملت (Phase 1 — Step 4c)**: استخراج حزمة واجهات المستخدم **`@church-site/ui` (packages/ui)** بنجاح كامل:
  * نقل وتوحيد مكونات واجهة المستخدم والأدوات المساعدة ومكتبة التدويل: `Badge.tsx` و`Button.tsx` و`Card.tsx` و`FontSizeSwitcher.tsx` و`Skeleton.tsx`، ومساعد `cn` في `lib/utils.ts`، ومكتبة i18n (`locales.ts` و`localized.ts` و`messages.ts` و`dom.ts` و`server.ts`).
  * إنشاء حزمة مساحة العمل `@church-site/ui` بتبعياتها المحددة ودعم مسارات TypeScript وحزم `next` المرجعية.
  * تحديث `apps/web/package.json` وإضافة التبعية `"@church-site/ui": "workspace:*"` وتحديث `apps/web/next.config.ts` و`apps/web/tsconfig.json`.
  * توفير إعادة تصدير دقيقة من `@church-site/ui` داخل `apps/web/src/components/ui/` و`apps/web/src/lib/utils.ts` و`apps/web/src/lib/i18n/` لضمان استمرار عمل كافة المسارات والاختبارات الحالية بانسيابية.
  * بوابات التحقق الكاملة (All Gates Green):
    - فحص الأنواع لحزمة ui: `pnpm --filter @church-site/ui typecheck` = 0 أخطاء (Exit 0).
    - فحص الأنواع لمساحة العمل بالكامل: `pnpm typecheck` = 0 أخطاء (packages/domain, packages/data-access, packages/ui, apps/web).
    - فحص الأسلوب: `pnpm lint` = 0 أخطاء (Exit 0).
    - اختبارات الوحدات: `pnpm test` (Vitest) = 12 ملفاً، **274/274 فحصاً ناجحاً بنسبة 100%** (Exit 0).
    - حفظ المخرجات في `.scratch/phase1-gates/01-ui-{typecheck,lint,test}.txt`.
  * الالتزام: `chore(packages): extract ui`.
- **اكتملت (Phase 1 — Step 4b)**: استخراج حزمة الوصول إلى البيانات **`@church-site/data-access` (packages/data-access)** بنجاح كامل:
  * نقل وتوحيد طبقة الوصول إلى البيانات: `store/` و`supabase/` و`queries.ts` و`tags.ts` و`env.ts` و`notify/` و`events/` و`data/seed-data.ts` و`utils/` و`validations/event-schemas.ts`.
  * إنشاء حزمة مساحة العمل `@church-site/data-access` بتبعياتها المحددة ودعم مسارات TypeScript وحزمة `next` بدون تسريب شفرة الخادم إلى مكونات العميل.
  * تحديث `apps/web/package.json` وإضافة التبعية `"@church-site/data-access": "workspace:*"` وتحديث `apps/web/next.config.ts` و`apps/web/tsconfig.json`.
  * توفير إعادة تصدير دقيقة وموجهة من مسارات `@church-site/data-access/*` داخل `apps/web/src/lib/` مع الحفاظ على عزل شفرة العميل والخادم.
  * بوابات التحقق الكاملة (All Gates Green):
    - فحص الأنواع لمساحة العمل بالكامل: `pnpm typecheck` = 0 أخطاء (packages/domain, packages/data-access, apps/web).
    - فحص الأسلوب: `pnpm lint` = 0 أخطاء.
    - اختبارات الوحدات: `pnpm test` (Vitest) = 12 ملفاً، **274/274 فحصاً ناجحاً بنسبة 100%**.
    - بناء الإنتاج بدون متغيرات بيئة: `pnpm --filter web build` = **51/51 مساراً بنجاح كامل**.
    - حفظ المخرجات في `.scratch/phase1-gates/01-data-access-{typecheck,lint,test}.txt`.
  * الالتزام: `49445da chore(packages): extract data-access`.
- **اكتملت (Phase 1 — Step 4a)**: استخراج حزمة النطاق **`@church-site/domain` (packages/domain)** بنجاح كامل (Commit `2597889`).
- **اكتملت**: تسليم **حزمة اختبارات واجهات المستخدم وإجراءات الخادم الشاملة (UI & Action Testing Deliverable)**:
  * 12 ملف اختبار، و**274 فحصاً ناجحاً بنسبة 100% (100% green)** باستخدام Vitest + `@testing-library/react` + `jsdom`.
  * **أجنحة اختبارات مكونات واجهة المستخدم (UI Component Test Suites)**:
    - `src/components/home/__tests__/NewVisitorWelcome.test.tsx` (4 فحوص): التحقق من عناوين الترحيب، شارة الزوار الجدد، نص المزمور (مزمور 5: 7)، روابط القداسات والتواصل والكهنة والشفعاء، ودليل إرشادات ووقار الحضور الكنسي.
    - `src/components/home/__tests__/PatronSaintsSection.test.tsx` (4 فحوص): التحقق من عرض القديسين مكسيموس ودوماديوس وعيد 17 طوبة، والشهيد الأنبا موسى الأسود وعيد 24 بؤونة، والأقوال والفضائل وشارات التدشين وروابط السير.
    - `src/components/home/__tests__/SanctuaryAltarsShowcase.test.tsx` (5 فحوص): التحقق من عرض المذابح الثلاثة المدشنة بالميرون (الأوسط، البحري، القبلي)، وشارات التدشين، وبطاقة شرح القانون الطقسي لعدم تكرار الذبيحة على المذبح في اليوم نفسه.
    - `src/components/ui/__tests__/Skeleton.test.tsx` (7 فحوص): التحقق من معيار INV-FEEDBACK-ANIMATION، وإمكانية الوصول (`role="status"`, `aria-label="جاري التحميل..."`)، ومطابقة الأبعاد لهياكل بطاقة القداس والفعالية والجدول.
  * **أجنحة اختبارات إجراءات الخادم والأمان**:
    - `src/actions/__tests__/admin-mass-actions.test.ts` (13 فحصاً): التحقق الصارم من مخطط Zod (`WeeklyMassInputSchema`) والفحص الأمني المزدوج للصلاحيات (`requireStaff()` + `can()`).
    - `src/lib/domain/__tests__/capabilities.test.ts` (120 فحصاً): التحقق الشامل من مصفوفة الصلاحيات لكافة الأدوار وإضافة قدرات القداسات `mass:*`.
  * **بوابات التحقق الكاملة (Full Verification Gates)**:
    - فحص الأنواع: `tsc --noEmit` = 0 أخطاء (Exit 0).
    - اختبارات الوحدات: `pnpm test` (Vitest) = 12 ملفاً، 274/274 فحصاً ناجحاً بنسبة 100% (Exit 0).
    - بناء الإنتاج: `pnpm run build` = 51/51 مساراً بنجاح نظيف (Exit 0).
- **اكتملت**: تفعيل **إدارة القداسات الإلهية ومواعيدها بصلاحيات أمنية كاملة (Divine Liturgies & Masses Management)**:
  * تحديث `src/lib/domain/capabilities.ts` و`src/lib/domain/types.ts`: إضافة قدرات القداسات (`mass:read`, `mass:create`, `mass:update`, `mass:delete`, `mass:toggle`) وتصنيف كيان التدقيق `mass`، وحصر الحذف على دور المالك `owner` فقط والسماح بالتحرير للسكرتارية `editor` والقراءة لـ `viewer`.
  * إنشاء `src/actions/admin-mass-actions.ts`: إجراءات خادمية مؤمنة (`createMassAction`, `updateMassAction`, `toggleMassStatusAction`, `deleteMassAction`) تطبق الفحص الأمني المزدوج `requireStaff()` و`can()`، ومخطط التحقق Zod (`WeeklyMassInputSchema`)، والتعامل الآمن مع عميل Supabase وإعادة التحقق `revalidateTag(REVALIDATION_TAGS.masses)`.
  * إنشاء `src/app/admin/(protected)/masses/AdminMassModal.tsx`: نافذة منبثقة تفاعلية للإنشاء والتعديل بكافة الحقول (اليوم، المذبح، العنوان، التوقيت، الفئة، الملاحظات، شارة التفعيل) ومؤشر الحفظ والتنبيهات.
  * تحديث `src/app/admin/(protected)/masses/AdminMassesTable.tsx`: إزالة لافتة العرض فقط، وإضافة زر «إضافة قداس جديد»، وعمود الإجراءات (تعديل وحذف مع تأكيد)، وتبديل الحالة التفاعلي، والتحديثات التفاؤلية والتنبيهات الناجحة.
  * إنشاء `src/actions/__tests__/admin-mass-actions.test.ts` وتحديث `capabilities.test.ts`: اختبارات شاملة للمخطط والصلاحيات (253 اختباراً ناجحاً بنسبة 100%).
  * التحقق الكامل: `tsc --noEmit` = 0 أخطاء، `pnpm test` = 8 ملفات و253 فحصاً ناجحاً، و`pnpm run build` توليد 51/51 صفحة بنجاح.
- **اكتملت**: تفعيل **هياكل التحميل اللحظية والتحميل الانسيابي ومنع انزياح التخطيط (CLS < 0.05 & Streaming Loading Skeletons)**:
  * إنشاء `src/components/ui/Skeleton.tsx`: المكون الأساسي مع `role="status"` و`aria-label`، بالإضافة للمكونات المركبة (`MassCardSkeleton`, `EventCardSkeleton`, `TableSkeleton`).
  * إنشاء `src/app/loading.tsx`: هيكل الصفحة الرئيسية الانسيابي المتطابق في الأبعاد مع الهيرو وبطاقة العد التنازلي وخدمات الوصول السريع.
  * إنشاء `src/app/masses/loading.tsx`: هيكل جدول القداسات (رأس الصفحة، تبويبات الأيام الـ 7، مدخلات الفلترة، و3 بطاقات قداس).
  * إنشاء `src/app/events/loading.tsx`: هيكل الفعاليات (رأس الصفحة، شرائح التصنيفات، و4 بطاقات فعاليات في شبكة متجاوبة).
  * إنشاء `src/app/about/loading.tsx`: هيكل صفحات عن الكنيسة (الهيرو، شريط التبويبات، ومحتوى بطاقات التعريف والأرقام).
  * إنشاء `src/app/bible/loading.tsx`: هيكل قارئ الكتاب المقدس (فهرس الأسفار، محدد الأصحاحات، ونصوص الآيات).
  * إنشاء `src/app/admin/(protected)/loading.tsx`: هيكل لوحة الإدارة المحمية (الترويسة، 4 بطاقات إحصائيات، أزرار الإجراءات، وهيكل الجدول).
  * التحقق الكامل: `tsc --noEmit` خروج 0، `pnpm test` بنسبة 226/226 فحصاً ناجحاً، و`pnpm run build` بنجاح وتوليد 51/51 صفحة.
- **اكتملت**: تفعيل **هوية الترحيب الرعوية والمذابح والشفعاء وميكرو-الأنيميشن (INV-IDENTITY-WARMTH & INV-FEEDBACK-ANIMATION)**:
  * إنشاء `src/components/home/NewVisitorWelcome.tsx`: ترحيب بالزوار الجدد («أول مرة تزور كنيستنا؟» ومزمور 5: 7) و4 بطاقات بصرية للقداسات والوصول والرعاية الكنسية والشفعاء + دليل إرشادات لحضور الصلوات بخشوع وسلام.
  * إنشاء `src/components/home/PatronSaintsSection.tsx`: قسم روحي منير لشفعاء الكنيسة الأطهار (القديسان مكسيموس ودوماديوس، والشهيد القوي الأنبا موسى الأسود) بتأملاتهم الروحية وشاراتهم الذهبية وروابط السيرة والتدشين.
  * إنشاء `src/components/home/SanctuaryAltarsShowcase.tsx`: عرض وقور للمذابح الثلاثة المدشنة بالميرون (الأوسط: العذراء ومكسيموس ودوماديوس، البحري: مارجرجس، القبلي: الأنبا موسى) مع شرح الاستخدام الطقسي.
  * دمج المكونات الثلاثة بسلاسة في تدفق الصفحة الرئيسية `src/app/page.tsx`.
  * تحديث `tailwind.config.ts` و`src/app/globals.css` بإضافة حركات `animate-fade-in` و`animate-slide-up` و`animate-gold-glow` مع تعطيل كامل للحركات والانتقالات عند تفعيل `@media (prefers-reduced-motion: reduce)`.
- **اكتملت**: تهيئة وتفعيل **مشروع Supabase البعيد (`mlprvcgbwwihnjyvyawm`)** — ربط المشروع عبر Supabase CLI، وتطبيق كامل ملفات الهجرة الـ 11 بنجاح، وتأكيد إنشاء الـ 29 جدولاً و56 سياسة أمنية و15 نوعاً مخصصاً وتفعيل RLS بنسبة 100%، وضبط ملف `.env.local` وملف القالب `.env.example`، واستبعاد `supabase/.temp/` في `.gitignore` — §14 أدناه.
- **اكتملت**: حزمة **اختبارات Vitest وبوابة CI الصلبة (Commit `9aa0be9`)** — 7 ملفات اختبارات و226 فحصاً ناجحاً بنسبة 100% (تكرار 23، قدرات 105، مستودع ملفي 23، فلاتر 26، iCal 19، مشتركون 17، تاريخ قبطي 13) وإضافة `pnpm test` كبوابة صلبة ثالثة في `.github/workflows/ci.yml` — §12 أدناه.
- **اكتملت**: إدماج **تسليم الوكيل المساعد (`auto-coder`) واعتماد موجز الهدف المجمد Goal Brief v1.0** ومطابقة معايير القبول الـ 16 (6 محققة، 5 جزئية، 5 فجوات مفتوحة مع افتراضات آمنة) وحل التناقضات السابقة وتشغيل سكربت التحقق `goal-brief-church-site-verify.ps1` بنجاح كامل (`RESULT: PASS`) — §13 أدناه.
- **اكتملت**: تمريرة **إغلاق فجوات الصفحات العامة** — أربع صفحات كانت ناقصة في قائمة متطلبات الهدف: `/about` (فهرس «عن الكنيسة» الذي كان 404) و`/gallery` (المعرض بحالة نائبة موسومة قابلة للاستبدال) و`/sermons` (مصادر الكلمة + حالة فارغة صريحة بلا اختراع عظات) و`/privacy` (سياسة خصوصية وشروط مختصرة بلغتين مطابقة لما يخزّنه التطبيق فعلاً) — مع وصلها بالتنقل والتذييل و`sitemap.ts` — §11 أدناه.
- **اكتملت**: تمريرة **STEP 4 — الاشتراكات/التنبيهات + حزمة التسليم التشغيلي** (مشتركو التنبيهات في المستودع بمحرّكين + هجرتا 10/11 + محوّل بريد no-op موثّق + استمارة `/subscribe` ثنائية اللغة + شاشة `/admin/subscribers` + راية إطفاء الميزة، **وثائق `docs/` الخمس** وعلى رأسها اختبار نسخ/استعادة مخزن الملفات فعلياً) — §10 أدناه.
- **اكتملت**: تمريرة **STEP 3 — سطح إدارة الفعاليات** (فهرس + محرر بكل حقول النطاق + محرر السلاسل المتكررة مع إلغاء/نقل موعد واحد + سجل التدقيق + مكتبة وسائط وصفية)، فوق الطبقة القائمة بلا إعادة بنائها وبلا أي اعتمادية جديدة — §9 أدناه.
- **اكتملت**: تمريرة **الطبقة الأساسية لنظام الفعاليات/التصنيفات/i18n (الخطوة 1 من ميزة أكبر)** — نموذج نطاق + محرك تكرار + مستودع بمحرّكين (ملف/Supabase) + إجراءات خادمية موثوقة + نواة i18n + هجرتان جديدتان، بلا أي اعتماديات جديدة وبلا متغيرات بيئة — §8 أدناه.
- **اكتملت**: تمريرات المراحل السابقة (P1 إلى P4): الفشل المغلق وTurnstile وتوحيد البيانات والرؤوس الأمنية وحذف الكود الميت وتوحيد رمز الحجز `COND-XXXXXX`.
- **الحالة الراهنة وبوابات التحقق [PROVEN]**:
  - المستودع مربوط بالفرع البعيد `origin/master` على `https://github.com/Kerollosmm/church-site`، وقاعدة بيانات Supabase مربوطة ومجهزة على `https://mlprvcgbwwihnjyvyawm.supabase.co`.
  - بوابات التحقق الصلبة كلها خضراء محلياً (Exit 0):
    1. فحص الأنواع: `pnpm exec tsc --noEmit` = 0 أخطاء (Exit 0).
    2. فحص الأسلوب: `pnpm run lint` = 0 أخطاء و0 تحذيرات (Exit 0).
    3. اختبارات الوحدات: `pnpm test` (Vitest) = 21 ملف اختبار، **362/362 فحصاً ناجحاً بنسبة 100% (100% green)** (Exit 0).
    4. بناء الإنتاج والربط: `pnpm run build` = Exit 0، وتوليد **53/53 مسار ويب ثابت وكافة مسارات الإدارة الديناميكية** بنجاح كامل بدون أي أخطاء.
    5. تدقيق الاعتماديات: `pnpm audit --prod` = 0 ثغرات أمنية (Exit 0).
    6. هجرات قاعدة البيانات: **12/13 ملف هجرة مُطبَّقة على المشروع البعيد `mlprvcgbwwihnjyvyawm`** (الهجرة 13 `content_types` بانتظار التطبيق عبر `supabase db push` أو محرر SQL).
    7. بوابة التحقق الحي G6:
       * المرحلة الثانية: اختبار التخزين الحي (رفع/حذف/تجزئة SHA-256) على الحاوية `media` بمشروع `mlprvcgbwwihnjyvyawm` ناجح 100% (PASS).
       * المرحلة الثالثة: تم فحص بيانات الاعتماد الحية لمشروع Supabase، ودالة `hasSupabaseAdminEnv()` أعادت `true`. كشف الفحص عدم تطبيق الهجرة 13 حياً بعد (جداول `content_types`، `content_fields`، `content_entries` غير موجودة - PostgREST 404 PGRST205). التزاماً بقواعد الصدق والأمانة توقف الفحص بصدق وأنشأ 0 سجل في قاعدة البيانات، مع توثيق كامل في `.scratch/phase3-gates/live/` (`live-env.txt`، `live-flow.txt`، `live-cleanup.txt`، `live-conclusion.txt`). بانتظار تطبيق الهجرة 13 لتشغيل `.scratch/phase3-gates/live-content-smoke.ps1` واجتياز الفحص حياً.


### 1. إصلاح أخطاء الأنواع (STEP 1) — الجذر الحقيقي [PROVEN]
- **الجذر الفعلي ليس شكل `Database` وحده**: `@supabase/ssr@0.5.2` تُصرِّح بعائد `SupabaseClient<Database, SchemaName, Schema>`، بينما `@supabase/supabase-js@2.116.0` أعاد تعريف `SupabaseClient` بحيث صار المعامل الثالث **اسم المخطط** (نص) لا نوعه، وحُذف مسار `dist/module/lib/types` الذي تستورده `@supabase/ssr`. النتيجة: يقع كائن المخطط في خانة «اسم المخطط» و`Schema` تصبح `never`، فتُحلّ كل استعلامات `.from(...).select(...)` إلى صفوف `never` — وهذا هو السبب الذي جعل كل ملفات الإجراءات تكتب `as any`. (خطأ القيد يُسكت عنه بـ `skipLibCheck: true`.)
- **الإصلاح**: (أ) `src/types/database.types.ts` — أُضيفت `Relationships` لكل جدول من الجداول الـ21 (علاقات المفاتيح الأجنبية الفعلية بحسب BACKEND §3 بأسماء `{table}_{column}_fkey`)، لأن `GenericTable` في postgrest-js الحالي يشترطها ويشتقّ منها `Relationships` للاستعلام؛ (ب) `src/lib/supabase/server.ts` و`client.ts` — يُنشأ العميل **بلا وسائط نوعية** ويُصرَّح بنوعه المقصود على توقيع الدالة (`Promise<SupabaseClient<Database>>`)، بلا أي `as any` جديد. بعد الإصلاح: `.select("role, is_active")` يحلّ إلى `{ role: StaffRoleEnum; is_active: boolean } | null`.
- **أُزيلت 6 تحويلات `as any`** صارت زائدة عن الحاجة: `condolence_bookings` و`contact_messages` (في `contact-actions` و`clinic-actions`) و`program_applications` و`job_applications` ونداء `rpc("track_condolence_booking")`. لم يبقَ أي `as any` في `src/`. إزالة تحويل `rpc` كشفت نقصاً حقيقياً في `ReservationTrackingCard` (الحالة `cancelled` من `booking_status_enum` لم تكن معالجة) فصار نوع الحالة مُشتقاً من الإجراء نفسه `Awaited<ReturnType<typeof trackBooking>>` مع شارة عربية «تم إلغاء الحجز» لتلك الحالة.
- **1a**: أُضيف `NEXT_PUBLIC_TURNSTILE_SITE_KEY` إلى اتحاد `ServerEnvVar` في `src/lib/env.ts` (موثّق أصلاً في BACKEND §9.1)، والوصول للبيئة بقي كسولاً بالكامل (لا شيء يعمل عند الاستيراد).

### 2. مهام المرحلة الأولى المتبقية (P1.6 → P1.10)
- **P1.6 التقويم القبطي**: `copticEpoch` صار `1825030` (1 توت 1 ش.م = 29 أغسطس 284 م Julian) بدلاً من `1824665` الذي كان أقل بسنة قبطية كاملة فيزيح كل السنوات +1. التحقق العددي للدوال النقية: 2026-09-11 → 1 توت 1743؛ 2026-01-07 → 29 كيهك 1742؛ 2025-09-11 → 1 توت 1742؛ 2026-01-19 → 11 طوبة 1742. لم يُضف أي إطار اختبار.
- **P1.7 سلَج التسجيل**: حُذف التغيير الصامت إلى `deacon-school` من `EducationEnrollmentForm`. المصدر الوحيد للأسلاج المؤهلة صار `SEED_PROGRAM_SLUGS` في `src/lib/data/seed-data.ts` (ويشمل `adult-bible`)، وصارت صفوف `SEED_SCHOOLS` مُقيَّدة بهذا الاتحاد (فلا يمكن إضافة برنامج للبذرة دون تأهيله للتسجيل)، و`PROGRAM_SLUGS` في مخطط zod صار مشتقاً منه، وأُضيف حارس وقت التشغيل `isProgramSlug`. صفحة `education/[slug]` ترجع `notFound()` لأي سلَج غير مؤهل (يمنع تسجيل المتقدم في برنامج آخر)، وواجهة الاستمارة تستقبل `programSlug: ProgramSlug` بلا تخمين.
- **P1.8 `/live`**: تُستبعد المؤرشفة (`is_archived`) من «المباشر» ومن «القادم»؛ والقادم هو ما حالته `scheduled` فعلاً ولم ينتهِ وقته، مرتَّباً تصاعدياً؛ والحالة تُعرض بالعربية من `STREAM_STATUS_LABELS_AR` (لا القيمة الإنجليزية الخام)؛ والأوقات تُنسَّق في `Africa/Cairo` عبر `formatCairoDateTime` بدل قصّ نص UTC. أُضيفت حالة «لا توجد بثوث مجدولة» بدل قائمة صامتة فارغة.
- **P1.9 إزالة البيانات الملفقة**: حُذف سجل `COND-DEMO01` (حجز معتمد ملفق) من `src/app/admin/(protected)/bookings/page.tsx` — ولم يبقَ أي `COND-DEMO` في `src/` أو في مخرجات البناء. و`NextMassCountdown` لم يعد عدّاداً وهمياً: صار مكوّناً خادمياً يقرأ الجدول الحقيقي عبر `getWeeklyMasses()` ويشتق القداس القادم بـ `getNextMass` (يوم/مذبح/عنوان/توقيت حقيقي)، ويعيد `null` إن لم يوجد أي قداس مُفعَّل بدل اختراع موعد، ومكوّن عميل `MassCountdownTicker` يعدّ تنازلياً نحو لحظة مطلقة ثم يطلب التحديث من الخادم عند بدء القداس.
- **P1.10 استمارة التواصل**: قيمة الخيار `urgent` صارت `spiritual_urgent` لتطابق `contact_urgency_enum` في مخطط zod.

### 3. عيب حُجب اكتُشف وأُصلح أثناء التحقق (مهم) [PROVEN]
- في أول بناء بلا بيئة، كانت صفحات `/admin/{,bookings,clinics,masses}` تُبنى **ثابتة**، أي أن `requireStaff()` (التي تفشل مغلقة عند غياب البيئة) تسببت في **ترسيب تحويلة 307 ثابتة إلى `/admin/login`** في مخرجات البناء (`.next/server/app/admin.meta` = `{"status":307,"location":"/admin/login","x-nextjs-prerender":"1"}`). في نشر ببيئة مضبوطة كان عضو الطاقم المُسجَّل سيُرَدّ إلى صفحة الدخول إلى ما لا نهاية.
- **الإصلاح**: `export const dynamic = "force-dynamic"` على `src/app/admin/(protected)/layout.tsx` (فحص الجلسة يجب أن يُعاد تقييمه في كل طلب). بعد الإصلاح: المسارات الأربعة صارت `ƒ` ديناميكية، ولم تبقَ أي `admin.meta` ثابتة، وبقيت `/admin/login` ثابتة `○` (يجب أن تظل متاحة).

### 4. إغلاق فجوتَي P1.2 وP1.3 (Turnstile الفعلي + الفشل المغلق في المستوصف)
- **P1.3 — واجهة Turnstile**: أُنشئ `src/components/security/TurnstileWidget.tsx` (مكوّن عميل وحيد، 3 استمارات تستخدمه). يقرأ المفتاح العام بعبارة عضو حرفية `process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY` (لِيُستبدَل في حزمة المتصفح وقت البناء)، ويُرسم **لا شيء** عند غياب المفتاح (بناء بلا بيئة + تطوير محلي)، ويحمّل سكربت Cloudflare مرة واحدة لكل مستند عبر وعد مُخزَّن على مستوى الوحدة (`?render=explicit`)، ويسلّم الرمز عبر `onVerify(token)` ويعيد `""` عند الانتهاء/الخطأ مع `onExpire` اختياري، و`resetSignal` تصاعدي لطلب رمز جديد.
- **الاستمارات الثلاث** (`contact/ContactForm`, `condolence/CondolenceBookingForm`, `education/[slug]/EducationEnrollmentForm`): حُذف الإدخال المخفي `mock-bypass-token` وقيمة `defaultValues` المزيفة، وصار الرمز يُغذّى بـ `setValue("turnstileToken", token)`، وبعد كل إرسال (نجاحاً أو فشلاً) يُزاد `resetSignal` لأن رموز Turnstile أحادية الاستخدام. لم يُمسّ مخطط zod (الرمز مطلوب فقط عند وجود مفتاح عام) ولا `verifyTurnstile()` (يبقى فاشلاً مغلقاً).
- **P1.2 — استفسار المستوصف**: `submitClinicInquiry` صار على نفس عقد بقية الإجراءات العامة: تحديد معدل بمفتاح `clinic:${ip}` (5/دقيقة)، ورفض الفشل المغلق عند `error` أو الاستثناء بلا أي إقرار زائف، والتحقق من Turnstile عبر `verifyTurnstile(token, ip)`، وأُضيف `turnstileToken` إلى `ClinicInquirySchema` للاتساق. **الإجراء ميت فعلياً**: لا تستورده أي صفحة أو مكوّن (`/clinics` و`/clinics/specialties` مرجعيان بلا استمارة، و`src/components/clinics/` فارغ) — فلم تُخترع استمارة، وأُبقي الإجراء مؤمَّناً لأن أي استمارة تُضاف لاحقاً تصبح خلف بوابة الأمان مباشرة.
- **تنظيف اختياري**: توحيد مصدر تسميات أيام الأسبوع — `DayTabFilter` صار يشتق `DAYS_OF_WEEK` من `DAY_OF_WEEK_LABELS_AR`/`DAY_OF_WEEK_INDEX` (وعليه صار «الإثنين» في تبويبات الفلترة هو نفس ما يرسمه الجدول)، وحُذفت الخريطة المحلية المكررة في `src/app/admin/(protected)/masses/page.tsx` لصالح المصدر الواحد. لا يوجد الآن أي خريطة أيام محلية في `src/`.
- **الجدولة/التنسيق**: الواجهة داخل إطار موحّد `rounded-2xl border-copticGold-300 bg-copticGold-50/50` بعنوان عربي «التحقق الأمني (Cloudflare Turnstile)» فوق زر الإرسال في الاستمارات الثلاث (RTL كما هو).

## 5. تمريرة المرحلة الثانية (P2.1 → P2.6) — توحيد البيانات والإدارة الموثوقة

### P2.2 — تراجع مُعلَن + عميل عام بلا كوكيز (الأصل قبل الفرع)
- `src/lib/supabase/public.ts` جديد: `createPublicSupabaseClient()` — عميل anon **بلا جلسة وبلا `cookies()`** (`persistSession:false`)، لأن `unstable_cache` يعمل خارج نطاق الطلب. هذا هو العيب المُرشَّح الذي أُصلح فعلاً: `createSupabaseServerClient()` كان يبدأ بـ `await cookies()` داخل كل دالة مخزَّنة، فيرمي استثناءً يُبتلع في `catch` العام ويُخزَّن البديل (البذرة) في الكاش — أي أن الكاش لم يحمل بيانات القاعدة قط والخطأ كان غير مرئي.
- `src/lib/queries.ts` أُعيد بناؤه حول `readOrSeed(queryName, seed, read)`: بيئة غائبة → تسجيل مرة لكل عملية؛ `error` → `console.error` ببنية `{ query, served:'seed-data', reason:'query_error', code, message }`؛ نتيجة فارغة → `console.warn` بسبب `empty_result`؛ استثناء غير متوقع → `unexpected_error`. الأسباب محصورة في اتحاد مغلق والاسم `query` حاضر دائماً. البذرة تُعاد **كائتلاف نسخة** حتى لا يُعدَّل الثابت المُصدَّر.
- القراءات الخاصة (`getCondolenceBookings`) أُضيفت **بلا كاش** لأنها تعتمد الجلسة، ولا بذرة بديلة لها (لا حجوزات ملفقة)؛ وتُرجع `{ bookings, errorMessageAr }` لتمييز «لا بيانات» من «تعذّر الجلب».

### P2.1 — تحويل الصفحات إلى طبقة البيانات (غلاف خادمي + طفل عميل)
- `src/app/masses/page.tsx`: صار خادمياً يقرأ `getWeeklyMasses()` و`getAltars()`، والتفاعل (فلتر اليوم/المذبح/الفترة + الطباعة) في `MassesExplorer.tsx`. المصدر الوحيد لتسميات الأيام و`DAY_OF_WEEK_INDEX` بقي `mass-schedule.ts`.
- `src/app/donations/page.tsx`: خادمي + `DonationAccountsList.tsx` (نسخ IBAN/الحساب/السويفت كما هو) مع حالة فارغة صريحة عند غياب الحسابات.
- `src/app/admin/(protected)/masses/page.tsx`: خادمي + `AdminMassesTable.tsx`؛ صارت الأعمدة من الأعمدة الفعلية (`altar.name_ar`، `target_group_ar`، `notes_ar`، `is_active`) بدل حقول شبحية (`altar_name_ar`/`target_audience_ar`)، مع لوحة صريحة «هذه الشاشة للعرض فقط» (التحرير والاستثناءات الموسمية لم تُنفَّذ).
- `src/app/admin/(protected)/clinics/page.tsx`: خادمي + `AdminClinicsGrid.tsx` يقرأ `getClinicSpecialties()` بدل استيراد البذرة.
- `src/app/admin/(protected)/page.tsx`: صار `async` ويقرأ العدّادات الخمسة الحقيقية عبر طبقة البيانات، وبطاقة حجوزات العزاء تعرض **عدد الطلبات قيد المراجعة الفعلي** (لا كلمة «نشط»)، مع بطاقة «وحدات إدارية لم تُنفَّذ بعد» تسرد صراحةً: رسائل التواصل، طلبات التسجيل، طلبات التوظيف، شريط التنبيهات، جدولة البث، تحرير القداسات.

### P2.6 — مصدر واحد لأسفار الكتاب المقدس
- `SEED_BIBLE_BOOKS` صار الكانون الكامل (73 سفراً: 46 عهد قديم + 27 جديد) بدل أربعة صفوف، والمعرّفات تُشتق بـ `bibleBookId(canonicalOrder)`، وكذلك `book_id` في `SEED_BIBLE_VERSES` (يوحنا = 50، المزامير = 21) فلا يمكن للقائمة والمراجع أن تفترقا.
- `src/app/bible/page.tsx` صار خادمياً يستدعي `getBibleBooks()` (الذي كان غير مستخدم) ويمرّر الأسفار إلى `BibleReaderClient.tsx`؛ وكل العدّادات (73/46/27) و`englishTitle` والوصف مشتقة من طول المصفوفة، والحقل `is_deutero` استُبدل بـ `is_deuterocanonical` القانوني، والافتراضي بقي إنجيل متى (بالسلَج لا بالفهرس).
- **متبقٍ (خارج النطاق)**: نص الأسفار الكامل لم يُضف، والمقتطف المعروض في نافذة القراءة لا يزال مثالاً ثابتاً (يوحنا ١: ١-٥) لا يتبع السفر/الأصحاح المحدد — لم أغيّره حفاظاً على عدم اختراع نص، وهو بند نشر مستقل (BACKEND §9.3 بند 4).

### P2.4 — إزالة محتوى البث البديل
- `SEED_STREAM_EVENTS`: حُذف معرّف الفيديو الهزلي `dQw4w9WgXcQ` واسم القناة الوهمي `SAMPLE_CHURCH_CHANNEL`؛ صار `stream_url` فارغاً في الصفّين مع تعليق يمنع بذر أي بديل، ويضبطهما السكرتير عند الجدولة.
- `src/lib/env.ts`: أُضيف `getYoutubeChannelUrl()` (`NEXT_PUBLIC_YOUTUBE_CHANNEL_URL`، اختياري) إلى اتحاد `ServerEnvVar`، والوصول كسول كالعادة.
- `/live`: لا يُضمَّن بث إلا إذا كان `live` + غير مؤرشف + `stream_url` غير فارغ؛ وعند غياب القناة تُرسم حالة «لم تُضبط قناة البث الرسمية على هذا الموقع بعد» بدل زر معطوب — ولا يوجد أي `https://youtube.com` صلب في الصفحة (0 مطابقة في HTML المولَّد).
- `src/components/live/LiveStreamPlayer.tsx` **محذوف**: مكوّن ميت (لا يستورده أي ملف) يحمل رابط يوتيوب صلباً وموعداً مُخترعاً («الأحد القادم ٦:٣٠ ص») — حذفه نظير حذف مكوّني التنقل الميتين سابقاً. (قابل للاسترجاع من git.)

### P2.3 — الإدارة الموثوقة لحجوزات العزاء (منفّذة بالكامل لهذه الشاشة)
- `src/actions/admin-booking-actions.ts` جديد: `approveCondolenceBooking(id)` و`rejectCondolenceBooking(id, reason)` — كلاهما يبدأ بـ `requireStaff()` (فشل مغلق/تحويل لصفحة الدخول)، ثم zod (`uuid` + سبب 5–500 حرف)، ثم كتابة **بعميل الجلسة** لتكون سياسة `is_staff()` حداً ثانياً، ثم `.eq("status","pending").select("id, status").maybeSingle()` فلا نجاح بلا صف مُتأثّر، ثم `revalidateTag(condolenceBookings)` عند النجاح فقط. انتهاك `uq_condolence_active_date` يُترجم إلى رسالة تعارض تاريخ، وتعذّر الصف إلى «تغيّرت الحالة من جهاز آخر». `approved_by_priest_id` تُرك `null` (يشير إلى `clergy` لا إلى مستخدم الطاقم) ولم يُخترع ربط.
- `src/app/admin/(protected)/bookings/page.tsx` صار خادمياً يقرأ `getCondolenceBookings()` (استعلام جديد) ويمرّرها إلى `BookingsManager.tsx` (عميل): بحث + تصفية بالحالة (بما فيها `cancelled` بتسمية عربية)، نموذج سبب الاعتذار، شريط نتيجة للعملية، حالة فارغة صريحة، وبطاقة خطأ حمراء عند تعذّر القراءة. **حُذفت الصفوف الملفقة الثلاث** (سمير عوض حنا / مريم جورج يوسف) ولم يبقَ أي `useState` يحاكي الاعتماد.
- الشاشات الإدارية الأخرى (رسائل التواصل، طلبات التسجيل، طلبات التوظيف، شريط التنبيهات، جدولة البث) **لم تُنفَّذ** وَعُلِّمت صراحةً في لوحة التحكم.

### P2.5 — هجرات Supabase مُصدَّرة (SQL فقط)
- `supabase/migrations/` سبعة ملفات مرقّمة زمنياً + `supabase/README.md`: الامتدادات والأنواع (9 enums) → `profiles` + `handle_new_user` + `is_staff`/`is_admin` + `normalize_arabic` → 12 جدول محتوى عام → 8 جداول v1.1 (بينها `bible_verses.text_normalized` عمود مولَّد) → دالتا `SECURITY DEFINER` (`track_condolence_booking`, `search_bible`) بمسار بحث مثبَّت ومنح التنفيذ → 12 فهرساً (بينها `uq_condolence_active_date`) → تفعيل RLS على 21 جدولاً و**40 سياسة** بأسماء المواصفة نفسها.
- أسماء القيود التي يعتمدها الكود مؤكَّدة في SQL: `condolence_bookings_booking_reference_code_key` (من `UNIQUE` المضمَّنة) و`uq_condolence_active_date`، وكل المفاتيح الأجنبية مضمَّنة لتُسمّى `{table}_{column}_fkey` كما في `database.types.ts`.
- فرقان مقصودان موثّقان: كل عمود له `DEFAULT` في §3 صار `NOT NULL` (مطابقةً لعقد الأنواع)، و`normalize_arabic()` تُنشأ قبل `bible_verses` (يستحيل غير ذلك مع عمود مولَّد)، مع حُرّاس إعادة تطبيق. **لا بيانات بذر في أي ملف** (0 `INSERT INTO` خارج جسم `handle_new_user`).
- **لم تُطبَّق على قاعدة حيّة** (لا قاعدة ولا Supabase CLI في هذه التمريرة): التحقق نحوي/بنائي ومطابقة اسمية فقط.

## 6. تمريرة المرحلة الثالثة (3.1 → 3.5) — التقوية والتشغيل

### 3.1 — رؤوس أمنية (CSP + HSTS + Permissions-Policy) [PROVEN]
- `next.config.ts` صار يبني سياسة CSP **مُنفَّذة فعلاً** (لا Report-Only) في `contentSecurityPolicy()`، وتُحقن مع بقية الرؤوس على `/:path*`. كل سماح فيها مُعلَّل بتعليق مرتبط بدليل من مخرجات البناء:
  - `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com` — `'unsafe-inline'` **ضروري**: Next يرسم 22 سكربتاً مضمَّناً (`self.__next_f.push`) في كل صفحة (قيس في `contact.html`). الأقواس غير المستخدمة (nonce) كانت ستُجبر كل الصفحات على أن تصير ديناميكية، وهو ما يهدم نموذج static-first.
  - `style-src 'self' 'unsafe-inline'` لأن البناء يحمل 4 سمات `style="..."` مضمَّنة.
  - `img-src 'self' data: blob:` / `font-src 'self' data:` — لا صور ولا خطوط خارجية إطلاقاً (0 وسم `<img>`، 0 `url()` في CSS المولَّد؛ الخطوط أسماء محلية في `globals.css`).
  - `connect-src` يسمح `https://*.supabase.co` و`wss://*.supabase.co` لأن أصل مشروع Supabase لا يُعرف إلا وقت النشر (`NEXT_PUBLIC_SUPABASE_URL`)، و`challenges.cloudflare.com`.
  - `frame-src` = Turnstile + مضيفو البث المعتمدون **مشتقّون من `TRUSTED_EMBED_HOSTS`** (مصدر واحد مع فحص وقت التشغيل في `/live`).
  - `object-src 'none'`، `base-uri 'self'`، `form-action 'self'`، `frame-ancestors 'self'` (مطابق لـ `X-Frame-Options: SAMEORIGIN`)، `worker-src 'self' blob:`، `manifest-src 'self'`.
  - فرعان بحسب البيئة: في التطوير فقط يُضاف `'unsafe-eval'` و`ws:`/`wss:` (React Refresh وHMR)، وفي الإنتاج فقط يُضاف `upgrade-insecure-requests` (لا يُضاف في التطوير لأن خادم التطوير HTTP على localhost).
- `Strict-Transport-Security: max-age=15552000; includeSubDomains` (180 يوماً) — لا أثر له على HTTP المحلي.
- `Permissions-Policy`: تعطيل `camera, microphone, geolocation, payment, usb, midi, magnetometer, serial` فقط، **مع ترك `autoplay`/`encrypted-media`/`fullscreen`/`picture-in-picture` بلا تقييد** لأن إطارَي YouTube/Facebook يطلبانها فعلاً (تقييدها كان سيُعطّل التشغيل).

### 3.2 — تضييق قائمتي الصور والإطار
- `images.remotePatterns`: حُذف البديل الشبكي `hostname: "**"` (كان يحوّل `/_next/image` إلى وسيط صور مفتوح لكل أصل HTTPS) وصارت القائمة **فارغة صراحةً** — مُبرَّر بأنه لا وجود لأي `next/image` في `src/`، ولا مجلد `public/`، و0 وسم `<img>` في المخرجات. الدليل من البناء: `routes-manifest.json` لا يحمل `images.remotePatterns` أصلاً (لا مضيف مسموح).
- `src/lib/security/trusted-embeds.ts` **جديد**: مصدر واحد لقوائم المضيفين الموثوقين + `getTrustedEmbedUrl(raw)` الذي يقبل فقط `https` على مضيف معتمد ويعيد الرابط المُطبَّع أو `null`. **لا اعتماد على قيمة القاعدة**: `src/app/live/page.tsx` صار يمرّر `stream_url` عبره ولا يرسم الإطار إلا بالناتج.
- عند رفض الرابط تُعرض حالة صريحة عربية «رابط البث الحالي غير معتمد» (بدل إسقاط الحالة إلى «غير نشط» وهو غير صحيح)، مع إبقاء حالة «البث المباشر غير نشط حالياً» لما قبل بدء البث.

### 3.3 — نظافة الاعتماديات (4 ثغرات → 0)
- **جذر الثغرات لم يكن devDependency**: الثغرات الأربع (2 high + 2 moderate) في `postcss` عبر المسار `.>next>postcss`، لأن `next@15.5.25` **يثبّت** `postcss: 8.4.31` بلا علامة نطاق. لذلك رفع `postcss` في devDependencies وحده لا يصلح شيئاً.
- **الإصلاح**: `next` (^15.1.7 → ^15.5.25، وهو **أحدث إصدار 15.x** فلا قفزة major)، و`postcss` (^8.4.49 → ^8.5.28)، وأُضيف `pnpm.overrides.postcss = "^8.5.28"` ليفرض الإصدار المُصلَح على نسخة next المثبَّتة. النتيجة: `postcss@8.4.31` اختفى من الشجرة وكل الحزم (بينها `next`) تربط `8.5.28`.
- **دليل عدم الانحدار**: ملف CSS المولَّد مطابق للأصل حرفياً — نفس التجزئة `5de250c8da5558e9.css` ونفس الحجم 45151 بايت قبل وبعد الرفع.

### 3.4 — ESLint
- أُضيف `eslint@9.39.5` + `eslint-config-next@15.5.25` (مطابق لإصدار Next المثبَّت) + `@eslint/eslintrc@3.3.7`، مع `eslint.config.mjs` (flat config) يبني `next/core-web-vitals` عبر `FlatCompat` لأن `eslint-config-next@15.5.x` ما زال بصيغة eslintrc. سكربت `lint` صار `eslint .` (لا `next lint` المهجور الذي كان سيطلب تهيئة تفاعلية في CI).
- **النتيجة**: 100 ملف مفحوص (31 `.ts` + 66 `.tsx`) = **0 أخطاء و0 تحذيرات**، ولا حاجة لأي إصلاح كود. أُصلح التحذير الوحيد الذي ظهر أول مرة وكان في ملف الإعداد الجديد نفسه (`import/no-anonymous-default-export`) بتسمية المصفوفة قبل تصديرها.
- **إثبات أن القواعد فعّالة لا صامتة**: ملف تحقّق مؤقت انتهك ثلاث قواعد فأطلق خطأً وتحذيرين فعلاً (`react-hooks/rules-of-hooks` خطأ، `@next/next/no-img-element` و`jsx-a11y/alt-text` تحذيران) ثم حُذف.

### 3.5 — سير عمل CI
- `.github/workflows/ci.yml`: على كل `push` و`pull_request` — checkout@v7 → pnpm/action-setup@v6 (pnpm 10) → setup-node@v7 (Node 22، cache pnpm) → `pnpm install --frozen-lockfile`، ثم خطوة تفشل إن وُجد أي متغير بيئة من `NEXT_PUBLIC_*`/`SUPABASE_*`/`TURNSTILE_*`/`YOUTUBE_*` (حماية ثابت «البناء بلا بيئة»)، ثم **البوابتان الصلبتان**: `pnpm exec tsc --noEmit` و`pnpm run build`؛ وبعدهما `pnpm audit --prod` و`pnpm run lint` **بـ `continue-on-error: true`** (إعلاميان لا يعطّلان المهمة).
- التحقق: YAML يُحلَّل بنجاح (9 خطوات، البوابتان بلا `continue-on-error`)، وسكربت الحارس اختُبر محلياً: يمر ببيئة نظيفة ويفشل بخروج 1 عند تسرّب `NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`.

## 7. تمريرة المرحلة الرابعة (4.1 → 4.3) — القابلية للصيانة وجاهزية النشر

### 4.1 — حذف الكود الميت (بإثبات مسبق لا بالحدس)
- **قاعدة الإثبات**: لكل ملف مُرشَّح شُغِّل `git grep` **على شجرة `HEAD` قبل الحذف** (لا على شجرة العمل بعده، لأن الحذف يجعل النتيجة صفراً بالضرورة) مع التقاط رمز الخروج (`1` = لا مطابقة)، بالإضافة إلى فحص على مستوى الرمز بـ `git grep -nw`. **تحذير منهجي مُكتشف**: `grep` في هذه الصدفة دالة (wrapper) تُفسد `-E` مع `-n`/`-i`/`-c` وتُرجع صفراً كاذباً؛ لذلك كل الإثباتات نُفِّذت بـ `git grep` مباشرة أو بـ `command grep`.
- **حُذف 6 ملفات، كلها بصفر مستورد مؤكَّد**: `src/components/condolence/CondolenceBookingForm.tsx` و`ReservationTrackingCard.tsx` (لكل منهما توأم حيّ داخل `src/app/condolence/**` هو المستخدَم فعلاً)، `src/components/bible/BibleReader.tsx` (و`BIBLE_BOOKS` المصدَّر منه صفر مستهلكين من خارجه)، `src/components/ui/Modal.tsx`، `src/components/layout/Breadcrumb.tsx` (`BreadcrumbItem` في `PageHero` تعريف محلي مستقل وليس استيراداً)، و`src/components/ui/CopticDivider.tsx` **الذي صار ميتاً نتيجة هذا الحذف نفسه** (كان `Breadcrumb` مستهلكه الوحيد).
- **يتيم غير متوقع من نفس الحذف**: `CardHeader` و`CardTitle` و`CardContent` و`CardDescription` و`CardFooter` في `src/components/ui/Card.tsx` فقدت آخر مستهلكيها (كانت المكوّنات المحذوفة تستوردها)، فقُلِّمت لتُبقي `Card` وحده (المستخدم في 4 مواضع) مع تعليق يشرح سبب غياب الأجزاء وأنها في تاريخ git.
- **تصديرات/وسوم/مخططات يتيمة لم تُترك**: الـ13 وسماً في `REVALIDATION_TAGS` كلها لها مستهلك واحد على الأقل (فُحص حقلاً حقلاً)، وكل مخططات zod لها مستهلك، والملفات المحذوفة لم تكن تستورد أي مخطط تحقق.
- **مُرشَّحون لم يُحذفوا عن قصد** (ميتون لكنهم خارج نطاق هذه التمريرة، ومسجَّلون هنا لاكتشاف لاحق): `refreshStreamData` في `src/actions/stream-actions.ts` (بلا منادٍ حتى الآن)، `submitJobApplication`، `getSiteAlerts`، `getStaffSession`، `createSupabaseBrowserClient`، `getTurnstileSiteKey`، `resetRateLimits` — كلها سطح واجهات لشاشات إدارية/ميزات لم تُنفَّذ بعد ومُعلَّمة كذلك في لوحة التحكم.

### 4.2 — صقل الأنواع: صفر `as any` + وحدة رمز الحجز
- **صفر `as any` في `src/`** (المطابقة الوحيدة سطر تعليق توضيحي في `src/lib/supabase/server.ts`)، فلا عمل مطلوباً هنا.
- **جديد**: `src/lib/domain/booking-reference.ts` — مصدر واحد لرمز الحجز العام: `BOOKING_REFERENCE_PREFIX = "COND"`، `BOOKING_REFERENCE_BODY_LENGTH = 6`، `BOOKING_REFERENCE_PLACEHOLDER` **مشتق** منهما (فلا يمكن أن يخالف الشكل)، نوع موسوم `BookingReference = string & { readonly [brand]: true }`، و`makeBookingReference(shortId)` (يُصدِّر الرمز موسوماً ويُبقي العشوائية عند المنادي فيبقى الملف بلا اعتماديات)، و`normalizeBookingReference(value)` (تشذيب + رفع حالة).
- **التبنّي بلا انحراف سلوكي**: `src/actions/condolence-actions.ts` يولّد بـ `makeBookingReference(nanoid(BOOKING_REFERENCE_BODY_LENGTH))` — **نفس الشكل `COND-XXXXXX` حرفياً** — ويوحّد إدخال التتبع بـ `normalizeBookingReference` بدل `trim()` المتفرقة؛ و`ReservationTrackingCard` و`src/app/condolence/track/page.tsx` أخذتا الـ placeholder/البادئة من الوحدة بدل تكرار النص.
- **قرار مقصود**: الدالة **لا ترفض** رمزاً غير مطابق للشكل (لو رفضت لَما أمكن تتبع أي صف أُدرج يدوياً في القاعدة)، فالتطابق يبقى عند الاستعلام. والنوع الموسوم يُطبَّق عند حدود التوليد/التوحيد فقط لأن `database.types.ts` المولَّد يُصرِّح بالعمود `string` — ولم يُلمس المولَّد.

### 4.3 — جاهزية النشر وتزامن الذاكرة
- **جديد**: `docs/release-readiness.md` — البوابات الخمس بالأوامر ونتائجها، ونصيب CI منها، وحارس «البناء بلا بيئة» منقولاً حرفياً من `ci.yml`، وجدول متغيرات §9.1 مع المستهلك الفعلي لكل متغير والسلوك عند غيابه، وخطوات القاعدة واستعلامات التحقق بعد التطبيق (21 جدولاً/40 سياسة/21 RLS/9 enums + أسماء القيدين)، وقائمة الفحوص البشرية (الحسابات البنكية، الهواتف، الواتساب، الأسماء، جدول القداسات، الرسم، مفاتيح Turnstile، قناة البث، نص الكتاب المقدس، CSP في متصفح، CI على GitHub)، والفجوات المقبولة، وأوامر إعادة التحقق.
- **اكتشافات دقيقة أُثبتت أثناء كتابة الوثيقة**: `NEXT_PUBLIC_SITE_URL` و`YOUTUBE_API_KEY` **لا يستهلكهما أي كود** (`git grep` = 0)، و`src/app/sitemap.ts`/`robots.ts` غير موجودين، أي أن بند §9.3 رقم 7 (sitemap/robots المولَّدة + Search Console) **غير مستوفى** — سُجِّل صراحةً في الوثيقة بدل الادعاء باستيفائه. وكل قداسات البذرة صباحية (05:30–08:30) ففلتر «مسائي» يعرض الحالة الفارغة.



## 8. الطبقة الأساسية لنظام الفعاليات/التصنيفات/i18n (الخطوة 1) — النموذج + المحرك + المستودع

### 8.1 نموذج النطاق `src/lib/domain/`
- `types.ts`: المVocabulary المغلق والأنواع: `EventRecord` (بحقول `titleAr/titleEn`، `startsAt/endsAt` بوصفهما لحظتين ISO، `timezone` افتراضاً `Africa/Cairo`، `status`، `seriesId`، `occurrenceDate`، `isExceptionOf`، `documents[]`)، و`EventSeriesRecord` (قاعدة `RecurrenceRule` أسبوعية/شهرية صريحة + `startTime` و`durationMinutes` — أُضيفا لأن الموعد المتكرر لا معنى له بلا وقت)، و`EventExceptionRecord` (إلغاء/نقل موعد واحد بسبب)، و`TaxonomyTermRecord` بستة أبعاد (`event_type | ministry | audience | language | venue | tag`)، و`EventTermLink`، و`MediaRecord`، و`AuditLogEntry`.
- **دوران لصف واحد في `events` موثّقان في مكان واحد**: فعالية مستقلة (`seriesId === null`) أو تجاوز موعد في سلسلة (`seriesId` + `occurrenceDate` + `isExceptionOf`). **المواعيد المتكررة لا تُخزَّن صفاً صفاً** بل تُشتق عند القراءة.
- `capabilities.ts`: `owner | editor | viewer` فوق الأدوار القائمة بلا أي مساس بها (`adminRoleFromStaffRole`: admin→owner، secretary→editor)، و`can(role, capability)` دالة نقية من جدول قرار واحد `ROLE_CAPABILITIES`، و`CAPABILITY_DENIED_MESSAGE_AR`. الحذف و`users:manage` للمالك وحده.
- `recurrence.ts`: محرك التكرار — `expandSeries(series, exceptions, range, options?)` نقية بلا اعتماديات. أسبوعي (بمحاذاة الأسابيع من أسبوع `startDate` والفاصل `interval`) وشهري (`byMonthDay`؛ والشهر الذي لا يحمل اليوم 31 **يُتخطى ولا يُلصق بيوم آخر**)، وكل الحساب بمنطقة السلسلة، والمواعيد الملغاة تُحذف افتراضاً والمنقولة تظهر بتاريخها الجديد (`includeCancelled`/`includeMovedFrom` يُظهران الانحراف نفسه)، والنافذة محدودة بـ `MAX_EXPANSION_WINDOW_DAYS = 731` وإلا `RangeError` بدل قصّ صامت.
- **عيب حقيقي اكتُشف أثناء التحقق وأُصلح**: كان الموعد المنقول والموعد الأصلي المُخلّى يتقاسمان مفتاح التاريخ نفسه في خريطة النتائج، فكان `includeMovedFrom: true` يبتلع الموعد الأصلي. الحل: مفتاحان (`<date>` و`<date>@origin`).

### 8.2 المستودع `src/lib/store/` — واجهة واحدة ومحرّكان
- `repository.ts`: `EventRepository` (قراءات/كتابات الفعاليات والسلاسل والاستثناءات والمصطلحات وبيانات الوسائط وسجل التدقيق + `republish()` خطّاف لا يفعل شيئاً) و`StoreError` بأربعة أكواد مغلقة (`not_found | conflict | invalid | unavailable`) لتترجم الإجراءات الخطأ إلى عربية بلا مطابقة أنماط.
- **قاعدة عقدية**: كل تعديل يستقبل `Actor` ويُلحق **سطر تدقيق واحداً** بالحالة قبل وبعد — لا يوجد مسار كتابة يتخطى التدقيق (`audit.ts` يبني السطر وملخّصه العربي).
- `json-store.ts` (المحرّك الافتراضي): **كتابة ذرّية** (ملف مؤقت في المجلد نفسه ثم `rename` مع إعادة محاولة على Windows وبلا أي مسار كتابة غير ذرّي)، و**تسلسل التعديلات** بطابور داخل العملية، والتهيئة من البذرة عند أول استخدام. مجلد البيانات `CHURCH_DATA_DIR` أو `<repo>/.data` افتراضاً (مُضاف إلى `.gitignore`). **مستند واحد = كتابة واحدة**، فلا يمكن أن يُحفظ تعديل بلا سطر تدقيقه. ملف تالف/بمخطط غير مدعوم **يرفع خطأً ولا يُستبدل بالبذرة صامتاً** (تجنّباً لضياع محتوى الكنيسة بصمت). حدّ مصرَّح به: الطابور لكل عملية، فالتزامن بين عمليات متعددة غير منسَّق (المحرك الإنتاجي هو Supabase).
- `json-driver.ts`: تنفيذ كامل للعقد فوق المستند (تحقّق من وجود المراجع، منع تكرار السلَج في الفعاليات ومنع تكرار `(dimension, slug)` في المصطلحات، رفض حذف مصطلح مستخدم ويقترح `isActive: false` بدلاً منه، و`duplicateEvent` يُنتج **مسودة مستقلة** دائماً ويرفض وراثة `seriesId`).
- `supabase-driver.ts`: تنفيذ العقد نفسه على الجداول الجديدة، بتحويل صريح صف↔نموذج (`toEventRecord/toSeriesRecord/...`) و`toEventDocuments` التي تُسقط أي عنصر JSONB بلا `filename`/`url`، وبمبدأ «لا نجاح بلا صف مُتأثر» (`.select().single()`). **العميل المفضّل جلسة الطاقم** لتبقى سياسة `is_staff()` حداً ثانياً، ويُستخدم عميل service-role فقط عند تعذّر بناء عميل الجلسة (خارج نطاق الطلب) **مع تسجيل ذلك في كل مرة**. فرق موثّق: التدقيق في Supabase **بذل وسع** لا معاملة (نداءان عبر PostgREST) ويفشل بصوت عالٍ بدل التراجع عن تغيير نُفِّذ فعلاً.
- `seed.ts`: تحويل محتوى البذرة الحقيقي — 5 قداسات + 11 اجتماعاً → **16 سلسلة أسبوعية**، صفّا `SEED_STREAM_EVENTS` → **فعاليتان**، و**37 مصطلحاً** (المذابح الثلاثة أماكنَ، والاجتماعات والأنشطة خدماتٍ، واللغات والفئات والوسوم). الأسماء العربية تُقرأ من صفوف البذرة نفسها (`name_ar`، `category`) لا تُنسخ يدوياً. **الوسائط تبدأ فارغة عن قصد**: البذرة تحمل `image_url` مثل `/assets/altar-main.jpg` ولا وجود لهذا الملف (لا `public/`)، وبذرُ صف وسائط كان سيعِد بملف لا يُخدَم. والأنشطة/المدارس لا تصبح فعاليات لأن جداولها نص حر (تحويلها إلى لحظات سيكون اختراعاً).
- `index.ts`: المصنع الواحد — `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` معاً ⇒ `supabase`، وإلا ⇒ `json` (والمحرك الملفي هو الوضع المدعوم بلا بيئة لا وضع منقوص). و`revalidate.ts` منفصل عن المحرّكات عن قصد لأنه يستورد `next/cache` فلا يجب أن يجرّه سكربت عادي.

### 8.3 الإجراءات الخادمية `src/actions/event-actions.ts`
- كل إجراء يمر بأربع خطوات بالترتيب: `requireStaff()` → `can(role, capability)` → zod → المستودع، وبعد نجاح المستودع فقط تُبطَل الوسوم (`revalidateEventSurfaces`). المرفوض لا يُبطل شيئاً.
- السطح: إنشاء/تعديل/نشر/إلغاء نشر/أرشفة/إلغاء فعالية/نسخ/حذف(owner) + CRUD السلاسل + إلغاء سلسلة كاملة + إلغاء موعد واحد + نقل موعد واحد + مسح استثناء + مصطلحات التصنيف + بيانات الوسائط + **`republishEventsAction`** (مسح يدوي للكاش يُعيد `lastUpdatedAt` واسم المحرك) + `getStoreStatusAction` للقراءة.
- النتائج نوع مميَّز `{ success: true; message; data } | { success: false; message }`، ورسائلها عربية لأن منطقة الطاقم عربية (مطابقة لإجراءات الحجوزات القائمة) — بينما نصوص الموقع العامة تُترجم عبر `src/lib/i18n/messages.ts`.
- **وسوم الإبطال من السجل**: إضافة `events`/`event-taxonomy`/`event-media` إلى `src/lib/tags.ts` (لا اسم وسم حر).

### 8.4 نواة i18n `src/lib/i18n/`
- `locales.ts`: `ar` (افتراضي، RTL) و`en` (LTR)، و`LOCALE_FLAGS` (إيموجي + وسم + حقل `svg` فارغ اليوم)، و`serializeLocaleCookie` مصدر واحد لكتابة الكوكي (`SameSite=Lax`، سنة كاملة) يستخدمه المبدّل في المتصفح.
- `localized.ts`: `localized({ar, en}, locale)` يرجع الترجمة أو **العربية متبوعة بعلامة ظاهرة** `⟦ترجمة مفقودة⟧` (و`markMissing: false` لمن يعرض الفجوة بطريقته)، فلا فراغ صامت ولا عربية تُتنكّر بوصفها إنجليزية.
- `messages.ts`: قاموس واجهة فقط (النصوص الكنسية تُترجم من الصف لا من القاموس)، والإنجليزية **مقيَّدة نوعياً** لتغطية كل مفتاح، و`t()` يرجع المفتاح إذا غاب بدل سلسلة فارغة.
- `server.ts` (`getLocale()` من الكوكي) وحّده تحذير صريح: قراءة الكوكي تُحوّل المسار إلى ديناميكي، فالصفحة التي لا تحتاج إلا اللغة الافتراضية تستعمل `DEFAULT_LOCALE` وتبقى ثابتة.
- `src/components/i18n/LocaleSwitcher.tsx` (عميل) يكتب الكوكي ويستدعي `router.refresh()`. **غير مُركَّب في أي مكان بعد عن قصد** (الشريحة التالية هي التي تركّبه) — وهو جزء من التسليم لا كود ميت.

### 8.5 الهجرات والأنواع
- `supabase/migrations/20260916090700_events_taxonomy_media_audit.sql`: 5 أنواع جديدة + 7 جداول (`taxonomy_terms`، `event_series`، `events`، `event_exceptions`، `event_terms`، `media`، `audit_log`) + فهارسها، بقواعد `IF NOT EXISTS` وقيود مسمّاة (`uq_taxonomy_term_dimension_slug`، `uq_event_exception_occurrence`) وقيود CHECK تمنع تجاوزاً بلا سلسلة أو نقلاً بلا تاريخ أو انتهاءً قبل البدء.
- `supabase/migrations/20260916090800_events_rls_policies.sql`: RLS على الجداول السبعة — قراءة عامة للمنشور/النشط فقط، وكل كتابة `is_staff()`، و`audit_log` **إضافة فقط** (بلا سياسة UPDATE/DELETE إطلاقاً). **لم تُطبَّق على قاعدة حيّة** (لا قاعدة في هذه البيئة).
- `src/types/database.types.ts`: 5 enums + 7 جداول بـ `Relationships` كاملة، مطابقة عموداً بعمود للهجرتين (مرآة DDL كما تقتضي القاعدة 9).

## 9. سطح إدارة الفعاليات (STEP 3) — الفهرس + المحرر + السلاسل + التدقيق + الوسائط

### 9.1 ما بُني فوق الطبقة القائمة (بلا مساس بها)
- **`src/lib/events/admin.ts` (جديد، خادمي)**: قارئ الإدارة فوق المستودع — `listAdminEvents` (كل الصفوف بكل الحالات، مع التصنيفات والمكان القادم)، `listAdminSeries` (المعادلة + الموعد القادم + عدد الاستثناءات)، `getAdminEvent`, `getAdminSeriesDetail` (توسيع المحرك مع إظهار الانحرافات والاستثناءات)، `getAdminTaxonomy` (المصطلحات كلها بما فيها المتوقفة)، `listAdminMedia`, `listAdminAudit`, `getAdminStoreStatus`. **مستقل عن `feed.ts` عن قصد**: الفهرس العام يعرض المنشور فقط، وفهرس الإدارة يجب أن يعرض المسودات وإلا كان مضلِّلاً. اختلال قاعدة سلسلة واحدة يُبلَّغ عنه (`ruleProblemAr`) بدل إسقاط الشاشة.
- **`src/lib/events/admin-form.ts` (جديد، نقي وعامل في المتصفح والخادم)**: تحويل «الساعة الجدارية بالقاهرة ⇄ `datetime-local`» (`instantToWallInput`/`wallInputToInstant`/`defaultStartWallInput`)، وحالتا النموذج (فعالية/سلسلة) ومعها `eventFormToPayload`/`seriesFormToPayload`، و`eventFormFieldErrors`/`seriesFormFieldErrors`/`mediaFormFieldErrors` التي تستدعي **نفس مخططات zod** التي يتحقق بها الإجراء الخادمي، و`formatBytes`/`megabytesToBytes`. تحويل السلسلة إلى شهري **يُفرِّغ `byWeekday` من الحمولة** (والعكس) فلا تبقى قيمة غير مرئية تمنع الحفظ.
- **`src/lib/events/audit-view.ts` (جديد، نقي)**: `summarizeAuditEntry` تحوّل لقطة `before/after` إلى أسطر عربية («الحالة: مسودة ← منشورة») مع ترجمة القيم المحدودة عبر خرائط النصوص المشتركة، ولا تُخفي تغييراً: `changedCount` يعدّ كل الحقول و`changes` يحمل أول 6 («و{n} حقلاً آخر»).
- **`src/components/admin/*` (جديد)**: `admin-ui.ts` (سلاسل الفئات المشتركة وحلقة التركيز الواحدة)، `AdminPageHeader` (العنوان + الدور + لافتة «عرض فقط»)، `AdminForbiddenNotice` (شاشة رفض تسمّي القدرة والدور)، `AdminFeedback` (`role=alert` للفشل و`role=status` للنجاح، ولا تعرض إلا الرسالة العربية التي أعادها الإجراء)، `AdminStatusBadge` (تسميات الحالات بالعربية)، `AdminFields` (حقول مع ربط `aria-invalid`/`aria-describedby` ورسالة تحت الحقل)، `TermMultiSelect` (بُعد تصنيف واحد كـ`fieldset` من مربّعات اختيار حقيقية، والمصطلح المتوقف يظهر معلَّماً)، `RepublishControl` (زر مسح الذاكرة + «آخر تعديل على المحتوى» + اسم المحرك).
- **الصفحات**: `src/app/admin/(protected)/events/{page,EventsManager}.tsx` (فهرس الفعاليات والسلاسل مع بحث/تصفية/ترتيب وأزرار صف: تعديل، نشر/إلغاء نشر، نقل الموعد، نسخ، أرشفة، إلغاء بسبب، حذف بتأكيد)، `events/new`، `events/[id]/edit` + `_components/EventEditorForm` (كل حقول النطاق بالعربية والإنجليزية + المرفقات)، `events/series/new` و`events/series/[id]` + `_components/{SeriesEditorForm,SeriesOccurrencesPanel}` (إلغاء/نقل موعد واحد والتراجع عن الاستثناء)، `audit/page.tsx` (بمرشّحات في الرابط)، `media/{page,MediaManager}.tsx`.

### 9.2 توسيعات صغيرة على الطبقة القائمة (لا إعادة بناء)
- **`denied` قيمة تدقيقية جديدة** في `AuditAction`/`AUDIT_ACTION_LABELS_AR` (+ `AuditActionEnum` و`audit_action_enum` مع `ALTER TYPE … ADD VALUE IF NOT EXISTS`)، لأن الرفض يجب أن يكون قابلاً للتدقيق ولا يجوز تمويهه كتعديل لم يحدث. **عيب حقيقي في موضع آخر**: لا وجود لأي طريق يسجّل رفضاً.
- **`EventRepository.recordAuditNote()`** (و`AuditNoteInput`): إلحاق سطر تدقيق **بلا أي تغيير** (`before/after = null` دائماً)، منفَّذ في المحرّكين (الملف: نفس الكتابة الذرّية؛ Supabase: نفس `appendAudit` بذل الوسع)، وعقده «بذل وسع» صراحةً.
- **`authorize()` في `src/actions/event-actions.ts`** يسجّل سطر `denied` قبل إعادة الرفض، والكتابة محاطة بـ try/catch: تعذّر التسجيل يُسجَّل في السجلات **ولا يُحوَّل إلى خطأ** يواجه المستخدم.
- **`capabilities.ts`**: `ADMIN_ROLE_LABELS_AR`, `CAPABILITY_LABELS_AR`, `CAPABILITY_AUDIT_ENTITY`, `describeRefusal(capability, role)` (نقية)، `resolveAdminCapabilities(role)` و`isReadOnlyRole()` — كلها مشتقة من جدول `can()` نفسه.
- **`event-schemas.ts`**: `MAX_MEDIA_SIZE_BYTES` (50 ميجابايت) مصدراً واحداً يستخدمه المخطط **ورسالة الشاشة** (`MAX_MEDIA_SIZE_LABEL`) فلا يفترق المُعلَن عن المُنفَّذ.
- **الغلاف والجلسة**: `src/app/admin/(protected)/layout.tsx` صار يقرأ الكوكي (`getLocale`) ويطبّق `dir/lang` على منطقة الإدارة ويركّب `LocaleSwitcher` في الشريط الجانبي مع عرض دور الفعاليات؛ و`src/middleware.ts` يحمل الآن `?reason=session|role`، و`signOut` يحمل `?reason=signed-out`، والصفحة الثابتة `/admin/login` تعرضها عبر `SignInNotice` (مكوّن عميل داخل `Suspense` — لأن `useSearchParams()` لا يجوز أن تُنادى في التوليد الثابت). لوحة التحكم أُضيفت لها بطاقة الفعاليات الحقيقية (منشورة/مسودة/سلاسل) وروابط سريعة للشاشات الجديدة.
- **`docs/admin-events-surface.md` (جديد)**: المسارات، مصفوفة الأدوار، تسجيل الرفض، جدول الحالات، محدودية الوسائط (بيانات وصفية فقط) وما لم يُنفَّذ.

### 9.3 قرارات صريحة في هذه التمريرة
- **الوسائط بيانات وصفية فقط**: لا رفع بايتات ولا مخزن ملفات؛ الربط بفعالية يتم بضبط `imageUrl` عبر `updateEventAction` (تحديث حقيقي له سطر تدقيق)، والربط بصفحة **غير ممكن في النموذج الحالي** فقيل ذلك صراحةً في الشاشة بدل اختراع عمود.
- **`EVENT_SURFACE_PATHS` لم تُمسّ**: مسارات الإدارة ديناميكية (`force-dynamic`) ولا تخزّن شيئاً، فالقائمة تبقى للمسارات العامة المخزَّنة فقط (توصية الخطوة 2 كانت للمسارات العامة الجديدة).
- **شرائح `Timeline` (لا)** لم تُضف إلى الطبقة القائمة، ولم يُضف أي اعتماد npm ولم يُعدَّل أي ملف من `src/lib/store/{json-store,seed,index,revalidate}.ts`.


## أدلة التحقق [PROVEN]

### أدلة تمريرة سطح الإدارة (STEP 3) للفعاليات
- `./node_modules/.bin/tsc --noEmit` على الشجرة النهائية: **خروج 0، صفر مخرجات** (طُبِّق بعد كل تعديلات المصدر).
- `pnpm run lint` (`eslint .`): **خروج 0** بلا أي مخرجات (0 أخطاء و0 تحذيرات).
- `pnpm run build` بلا أي متغير بيئة (تحقق مسبق: `compgen -e` على `NEXT_PUBLIC|SUPABASE|TURNSTILE|YOUTUBE|CHURCH_DATA_DIR` = **0**، و0 ملف `.env*`): **خروج 0**، «✓ Compiled successfully»، «✓ Generating static pages (53/53)»، `ƒ Middleware 93.8 kB`.
- **المسارات الإدارية الجديدة كلها `ƒ` ديناميكية** من جدول البناء: `/admin/events` (7.29 kB)، `/admin/events/new`، `/admin/events/[id]/edit`، `/admin/events/series/new`، `/admin/events/series/[id]`، `/admin/audit`، `/admin/media` (5.97 kB) — بينما بقي `/admin/login` **`○` ثابتاً** كما كان (شرط الوصول عند غياب البيئة).
- **حارس الإجراءات في الخادم** (`git grep -n "require-staff\|can(" -- src/actions/event-actions.ts`): السطر 23 `import { requireStaff, type StaffSession } from "@/lib/auth/require-staff";` والسطر 75 `if (role === null || !can(role, capability))` داخل `authorize()` التي تمر بها **كل** عمليات التعديل عبر `mutate()`.
- **التحقق التفاعلي بالتشغيل** (`next start` على منفذ مؤقت ثم إيقافه): `HEAD /admin/events` و`HEAD /admin` ⇒ **307** إلى `location: /admin/login?reason=session` (الفشل المغلق صار يحمل سبب إعادة التوجيه)، و`/admin/login` و`/admin/login?reason=session` ⇒ **200** (الصفحة الثابتة متاحة بلا بيئة)، و`/events` العام ⇒ **200** (لم يُمسّ)، والرؤوس الستة حاضرة في كل استجابة.
- **سكربت تحقق مؤقت** (`.scratch/admin-verify/`: محمّل أسماء `@/` + سدادة `next/headers`، شُغِّل بـ `node --experimental-strip-types` ثم **حُذف**): **31 فحصاً كلها ناجحة، خروج 0**:
  - **الرفض يُسجَّل**: `recordAuditNote({action:'denied'})` أضاف سطراً واحداً، `before/after = null`، باسم الفاعل، و`entityType = event`، والملخص «رُفض إجراء «حذف فعالية» — الدور الحالي (محرر (سكرتارية الكنيسة)) لا يملك هذه الصلاحية.» — و**لم يتغيّر أي محتوى** (مقارنة قائمة الفعاليات قبل وبعد).
  - **جدول الأدوار**: `can("editor","event:delete") = false`، `can("editor","event:publish") = true`، `can("owner","event:delete") = true`، `resolveAdminCapabilities("viewer")` كلها قراءة فقط، `can(null, …) = false`.
  - **حد الوسائط**: `MediaSchema` يرفض `MAX_MEDIA_SIZE_BYTES + 1` برسالة عربية تذكر الحد، ورسالة النموذج: «الحجم المُدخل (120 ميجابايت) يتجاوز الحد الأقصى المسموح (50 ميجابايت).»
  - **توقيت القاهرة**: `wallInputToInstant("2026-10-04T07:00") = "2026-10-04T04:00:00.000Z"` (07:00 ص بتوقيت القاهرة في EEST)، وحقل بداية فارغ يُرفض inline، والعنوان العربي القصير يُرفض inline.
  - **قاعدة التكرار**: سلسلة أسبوعية صحيحة تمر بلا أخطاء، وفارغة أيام ⇒ خطأ inline، وفاصل 0 ⇒ خطأ inline، ونهاية قبل البداية ⇒ «تاريخ نهاية السلسلة يسبق تاريخ بدايتها.» على مستوى القاعدة، والتحويل إلى شهري يُفرِّغ `byWeekday` من الحمولة ويرفض يوماً خارج 1–31.
  - **ملخص التدقيق**: نشر يُقرأ «الحالة: مسودة ← منشورة» بالأسماء العربية، والرفض له نوعه الخاص «رفض صلاحية».
  - **عدم انحدار المحرك**: سلسلة أسبوعية أُُنشئت عبر المستودع ⇒ 4 مواعيد، ثم إلغاء موعد واحد ونقل آخر ⇒ المجموعة الفعّالة `2026-10-04, 2026-10-18, 2026-10-25` وبقية السلسلة سليمة، وسجل التدقيق = 4 أسطر (الرفض + السلسلة + استثناءان).
- **تنظيف**: `.scratch/admin-verify/` (السكربت + المحمّل + السدادة + سجل الخادم المؤقت) محذوف بالكامل بعد التشغيل؛ ولم يُعمل أي commit.


### أدلة تمريرة الطبقة الأساسية للفعاليات (الخطوة 1)
- `rm -rf .next && ./node_modules/.bin/tsc --noEmit` على الشجرة النهائية المجمّدة: **خروج 0، صفر مخرجات**.
- `pnpm run build` بلا أي متغير بيئة (تحقق مسبق: 0 متغير من `NEXT_PUBLIC_*|SUPABASE_*|TURNSTILE_*|YOUTUBE_*|CHURCH_DATA_DIR` و0 ملف `.env*`): **خروج 0**، «✓ Compiled successfully in 33.2s»، «✓ Generating static pages (52/52)»، `ƒ Middleware 93.7 kB`، ولا سطر تحذير. المسارات الديناميكية الأربعة `/admin*` باقية `ƒ` كما كانت (لا انحدار في جدول المسارات).
- `pnpm run lint`: **خروج 0** بلا أي مخرجات (0 أخطاء و0 تحذيرات).
- **سكربت تحقق مؤقت** (كُتب في `.scratch/events-core/`، شُغِّل، ثم حُذف — `.scratch/` مُهمَلة):
  - سلسلة أسبوعية أُنشئت عبر المستودع: توسيع أكتوبر 2026 ⇒ **4 مواعيد** `2026-10-04/11/18/25` كلها **07:00 بتوقيت القاهرة** ومدة 90 دقيقة.
  - إلغاء موعد واحد (11 أكتوبر) ⇒ المجموعة الفعّالة `04/18/25` (وبقية السلسلة سليمة)، و`includeCancelled` يُظهره بحالة `cancelled`.
  - نقل موعد واحد (18 ⇒ 21 أكتوبر) ⇒ المجموعة الفعّالة `2026-10-04, 2026-10-21, 2026-10-25` (ثلاثة مواعيد بلا تكرار) والموعد المنقول يحمل `movedToDate = 2026-10-21`، و`includeMovedFrom` يُظهر الموعد الأصلي المُخلّى بحالة `moved`.
  - سلسلة شهرية (`byMonthDay = 15`) ⇒ موعد واحد `2026-10-15 18:30` بالقاهرة، وإلغاء السلسلة كاملة ⇒ صفر مواعيد.
  - فعالية أُنشئت عبر المستودع ثم قُرئت بالمعرّف وبالسلَج، واستُرجعت روابط التصنيفات والمكان، والحالة الأولى `draft`؛ ونشرها أنتج سطر تدقيق `publish` يحمل `before.status = draft` و`after.status = published`، و`duplicate` أنتج مسودة مستقلة بسلَج جديد؛ وسجل التدقيق = **8 أسطر بالضبط** (سطر واحد لكل تعديل، بالترتيب المتوقع تنازلياً) وكلها بملخّص عربي.
  - البذرة عند أول استخدام: **16 سلسلة + 37 مصطلحاً + فعاليتان**، وقداس الجمعة 07:00 تحوّل إلى سلسلة تُوسَّع إلى «الجمعة 2026-09-18 07:00 القاهرة».
  - مرشّحات القراءة: بالحالة، وبالنافذة الزمنية، وبمصطلح تصنيف — كلها صحيحة، **ونافذة بإزاحة غير UTC (`+03:00`) تعطي النتيجة نفسها** (بعد إصلاح المقارنة إلى مقارنة لحظات لا نصوص).
  - نظافة الكتابة: مجلد البيانات لا يحمل إلا `church-store.json` (لا ملفات `.tmp` بعد كل هذه الكتابات).
  - إعادة تشغيل التحقق كاملاً بعد تقليم سطح التصدير وتعديل المقارنة: **كل الفحوص ناجحة (خروج 0)**.
- `.data/`: أُنشئ فعلاً في وقت التشغيل (`C:\Church-Site\.data\church-store.json`، 37343 بايت كبذرة نظيفة بعد المحو وإعادة التهيئة)، و`git check-ignore -v .data` ⇒ `.gitignore:36:/.data/`، و`git status` لا يعرضه. و`CHURCH_DATA_DIR` يعمل: تشغيل بمجلد بديل أنشأ البذرة فيه. والبناء لا يلمس `.data/` (طابع زمني الملف 15:19:49 مقابل انتهاء البناء 15:22:12).


### أدلة تمريرة المرحلة الرابعة (4.1 → 4.3)
- **إثبات الحذف (على `HEAD` قبل الحذف، `git grep` مع رمز الخروج)**: لكلٍّ من `components/condolence/CondolenceBookingForm` و`components/condolence/ReservationTrackingCard` و`components/bible/BibleReader` و`components/ui/Modal` و`components/layout/Breadcrumb` → **0 مطابقة، رمز خروج 1**. وعلى مستوى الرمز (`git grep -nw`): `Modal` = 1 (تعريفه هو)، `Breadcrumb` = 2 (تعريفه + تعليق JSX في `PageHero`)، `BibleReader` = 1 (تعريفه)، `LiveStreamPlayer` = 1 (تعريفه في الملف المحذوف سابقاً)، `BIBLE_BOOKS` = 5 كلها داخل `BibleReader.tsx` نفسه.
- **يتيم ما بعد الحذف**: `CopticCrossIcon` و`CopticDivider` = 2 مطابقتان كلتاهما داخل `CopticDivider.tsx` (→ حُذف الملف)، و`CardHeader/CardTitle/CardContent/CardDescription/CardFooter` = كلها داخل `Card.tsx` وحده (→ قُلِّمت)، بينما `Card` نفسه = 6 مطابقات في 4 ملفات حيّة (→ بقي).
- `pnpm exec tsc --noEmit` بعد الحذف والتقليم: **خروج 0، صفر مخرجات**.
- `pnpm run build` بلا أي متغير بيئة (تحقق مسبق: `printenv` على `NEXT_PUBLIC|SUPABASE|TURNSTILE|YOUTUBE` = **0**، و0 ملف `.env*`): **خروج 0**، «✓ Compiled successfully in 34.7s»، «✓ Generating static pages (52/52)»، `ƒ Middleware 93.7 kB`. التحذيران الوحيدان في السجل هما إشعارا `webpack PackFileCacheStrategy` بشأن سلاسل كبيرة، ولا علاقة لهما بالكود.
- `pnpm run lint`: **خروج 0** بتقرير JSON: **96 ملفاً مفحوصاً** (91 منها تحت `src/`) و**0 أخطاء و0 تحذيرات**.
- **إحصاء الشجرة بعد التمريرة**: 61 ملف `.tsx` + 30 ملف `.ts` تحت `src/` = 91 ملفاً مصدرياً (مطابق لعدد ملفات `src/` التي فحصها ESLint).
- **صفر `as any`**: `git grep -n "as any" -- src/` = سطر واحد، وهو تعليق توثيقي في `src/lib/supabase/server.ts:16`.

### أدلة تمريرة المرحلة الثالثة (3.1 → 3.5)

- `rm -rf .next && ./node_modules/.bin/tsc --noEmit`: **خروج 0، صفر أسطر مخرجات** (شمل ملف `trusted-embeds.ts` الجديد وتعديل `/live`).
- `pnpm run build` بلا أي متغير بيئة (تحقق مسبق بسكربت `compgen -e` على `NEXT_PUBLIC_*|SUPABASE_*|TURNSTILE_*|YOUTUBE_*` = **0** متغير، و**0** ملف `.env*`): **خروج 0**، «✓ Compiled successfully in 10.2s»، «✓ Generating static pages (52/52)»، «ƒ Middleware 93.7 kB»، ولا سطر تحذير واحد في سجل البناء.
- **الرؤوس في مخرجات البناء**: `.next/routes-manifest.json` يحمل **6** رؤوس على القاعدة `/:path*` (HSTS، CSP، Permissions-Policy، X-Frame-Options، X-Content-Type-Options، Referrer-Policy)، وقيمة CSP المنفوذة هي نسخة الإنتاج بنهايتها `upgrade-insecure-requests` وبلا `'unsafe-eval'`. و`images.remotePatterns` **غير موجود** في المانيفست (قائمة فارغة = لا مضيف مرفوع).
- **الرؤوس مُخدَمة فعلاً**: `next start` ثم `curl -D -` على `/` و`/live` و`/masses` → الرؤوس الستة حاضرة في استجابة كل صفحة ثابتة (200)، أي أن `headers()` يعمل مع الصفحات المُسبَقة الرسم لا مع المسارات الديناميكية فقط.
- **قائمة البث الموثوقة مُثبَتة بعدد حالات**: `node --experimental-strip-types` على `getTrustedEmbedUrl` — يقبل `https://www.youtube.com/embed/…` و`https://www.youtube-nocookie.com/embed/…?autoplay=1` و`https://web.facebook.com/plugins/video.php?…`، ويرفض `http://www.youtube.com/…` و`javascript:alert(1)` و`data:text/html,…` و`https://evil.example.com/…` و`https://www.youtube.com.evil.example.com/…` (لاحقة منتحلة) و`//www.youtube.com/…` والفارغ و`null`.
- `live.html` من البناء بلا بيئة: **0** `<iframe>` و**0** مطابقة لـ `youtube`، وتظهر حالة «البث المباشر غير نشط حالياً» (لأن `stream_url` مُبذَّر فارغاً) — أي أن الحالة الجديدة «رابط غير معتمد» لا تُعرض بلا سبب.
- **`pnpm audit --prod`: قبل = 4 ثغرات (2 high + 2 moderate، كلها `postcss` عبر `.>next>postcss`)، بعد = «No known vulnerabilities found» (خروج 0)**. ودليل الإصلاح البنيوي: لا يوجد في الشجرة إلا `postcss@8.5.28` وكل الحزم تربطه (بينها `next@15.5.25`)، وملف CSS المولَّد **مطابق حرفياً** للأصل: `5de250c8da5558e9.css` بحجم 45151 بايت قبل وبعد.
- **`pnpm run lint`: خروج 0، صفر أخطاء وصفر تحذيرات** على 100 ملف (31 `.ts` + 66 `.tsx`). ودليل الفاعلية: ملف تحقّق مؤقت أنتج `react-hooks/rules-of-hooks` (خطأ) و`@next/next/no-img-element` و`jsx-a11y/alt-text` (تحذيران) ثم حُذف.
- **سير العمل**: `.github/workflows/ci.yml` يُحلَّل YAML بنجاح (9 خطوات: 4 منها صلبة بعد التثبيت، واثنتان بـ `continue-on-error`)، وسكربت حارس البيئة اختُبر محلياً في الحالتين.

### أدلة تمريرة المرحلة الثانية (P2.1 → P2.6)
- `rm -rf .next && ./node_modules/.bin/tsc --noEmit`: **خروج 0، صفر أسطر مخرجات**.
- `pnpm run build` بلا أي متغير بيئة (تحقق مسبق بـ `printenv | awk` على `SUPABASE|TURNSTILE|YOUTUBE|NEXT_PUBLIC` = صفر أسطر، ولا `.env*` في المستودع): **خروج 0**، «✓ Compiled successfully in 34.3s»، «✓ Generating static pages (52/52)»، `ƒ Middleware 93.7 kB`. الصفحات المحوَّلة بقيت ثابتة `○` (`/masses` 6.05 kB، `/donations` 4.28 kB، `/bible` 3.9 kB، `/live`) والمسارات الإدارية الأربعة بقيت `ƒ`.
- **دليل التراجع المُعلَن** (من سجل البناء بلا بيئة): ثلاث أسطر منسَّقة `[queries] database read skipped { query: 'getChurchMeetings' | 'getWeeklyMasses' | 'getAltars', served: 'seed-data', reason: 'environment_not_configured' }` — سطر لكل عملية عاملة (worker) لأن الإعلان مرة واحدة لكل عملية، بدل الصمت الكامل السابق.
- **دليل P2.1 من HTML المولَّد**: `masses.html` يحوي معرّف القداس `m0000000-…-000000000004` وعنوان «قداس الجمعة الرئيسي الشامل» و«المذبح القبلي» و«القمص مكسيموس وصفي» (أي أن البيانات تمر فعلاً من طبقة الاستعلام، لا من استيراد مباشر)؛ و`donations.html` يحوي `EG3800010030704982310100018` و`NBEGEGCXXXX`؛ وتبويبات `/masses` (كافة الفترات/قداسات مسائية) وتسمية اليوم «الإثنين» سليمة.
- **دليل P2.6 من HTML المولَّد**: `bible.html` يحوي التبويبات بعدّادات مشتقة (`>73<`، `>46<`، `>27<`) و«المكابيين الثاني» و«أستير وتتمتها» و«سفر الرؤيا» وشارة «قانوني ثان».
- **دليل P2.4**: `live.html` يحوي **0** مطابقة لـ `youtube` و**1** لـ «لم تُضبط قناة البث الرسمية»، ولا أثر لـ `dQw4w9WgXcQ` أو `SAMPLE_CHURCH_CHANNEL` في أي ملف.
- **دليل P2.2**: في `src/lib/queries.ts` لا يُستدعى `createSupabaseServerClient` إلا مرة واحدة (داخل `getCondolenceBookings` غير المخزَّنة)، وكل ظهورات `cookies()` فيه تعليقات شرح فقط.
- **فحوص سالبة**: `git grep` لـ `dQw4w9WgXcQ` / `SAMPLE_CHURCH_CHANNEL` / `LiveStreamPlayer` / `mock-bypass-token` في `src/` = **0**؛ `as any` = سطر واحد هو تعليق توثيقي؛ استيراد `lib/data/seed-data` المباشر في الصفحات الأربع المحوَّلة + منطقة الإدارة = **0**.

### أدلة المرحلة الأولى (تمريرة إكمال + إغلاق P1.2/P1.3)
- `./node_modules/.bin/tsc --noEmit` بعد حذف `.next`: **خروج 0، صفر أسطر مخرجات** (شمل التشغيل الأخير ملفات `.next/types/**` المولَّدة حديثاً أيضاً).
- `pnpm run build` بلا أي متغير بيئة (لا `.env*` في المستودع ولا متغيرات Supabase/Turnstile في الصدَفة): **خروج 0**، «✓ Compiled successfully»، «✓ Generating static pages (56/56)» في البناء الأول ثم **(52/52)** بعد جعل منطقة الإدارة ديناميكية، مع `ƒ Middleware 93.7 kB`.
- صحة العدّاد من مخرجات البناء: عند لحظة البناء (2026-09-16T12:28Z = 15:28 بتوقيت القاهرة EEST) رسم `/` العدّاد: «القداس القادم — الجمعة، المذبح القبلي — قداس الجمعة الرئيسي الشامل (07:00 ص)»، وقيمة `startsAtIso` في حمولة RSC = `2026-09-18T04:00:00.000Z`، أي 07:00 بتوقيت القاهرة بفرق +3 ساعات (توقيت صيفي) — دليل على أن التحويل يحترم DST فعلاً لا إزاحة ثابتة.
- `/live`: يظهر «بث مجدول» بالعربية مرة واحدة للبث المجدول، ولا يظهر «بث منتهٍ» ولا عنوان البث المؤرشف، والتوقيت المعروض «الأحد، 20 سبتمبر 2026 في 09:00 ص» (المخزون UTC: 2026-09-20T06:00Z ⇒ 09:00 بالقاهرة)، ولا يوجد أي نص ISO خام في HTML.
- `/education/adult-bible`: حقل `name="programSlug" value="adult-bible"` في HTML المولَّد (كان سابقاً يُحوَّل صامتاً إلى `deacon-school`).
- `contact.html`: الخيارات `normal` / `spiritual_urgent` / `emergency` فقط، ولا وجود لـ `urgent`.
- `/masses`: تسميات الأيام العربية ما زالت تُرسم بعد توحيد مصدرها (الأحد/الثلاثاء/الأربعاء/الخميس/الجمعة/السبت).
- `git grep -n "as any" -- src/` = سطر واحد فقط، وهو تعليق توثيقي في `src/lib/supabase/server.ts`.
- `git grep -rn "COND-DEMO" -- src/` = 0 أسطر.

### أدلة إغلاق P1.2 + P1.3 (تمريرة إضافية)
- `rm -rf .next && ./node_modules/.bin/tsc --noEmit`: **خروج 0، صفر أسطر مخرجات** (شمل الملفات الجديدة الثلاثة المعدَّلة والواجهة).
- `pnpm run build` بلا أي متغير بيئة (تحقق مسبق: لا `.env*` في المستودع ولا متغير `SUPABASE_*`/`TURNSTILE_*`/`NEXT_PUBLIC_*` في الصدَفة): **خروج 0**، «✓ Compiled successfully»، «✓ Generating static pages (52/52)»، `ƒ Middleware 93.7 kB`.
- `git grep -n "mock-bypass-token" -- src/` = **0 أسطر (خروج 1)**، و`git grep -in "mock" -- src/` = 0 أسطر.
- **HTML البناء بلا بيئة**: صفر أثر لـ `Cloudflare Turnstile` أو `turnstileToken` في `contact.html` و`condolence.html` و`education/adult-bible.html` — الواجهة لا ترسم شيئاً عند غياب المفتاح كما هو مطلوب.
- **بناء تحقّقي بمفتاح وهمي** (`NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAFAKETESTKEY1234567890`): خروج 0، وظهرت حاوية الواجهة (نصها «Cloudflare Turnstile») **مرة واحدة** في كل من ملفات HTML الثلاثة، وظهر المفتاح مُستبدَلاً حرفياً في **3 حِزم عميل** فقط (`static/chunks/app/{contact,condolence,education/[slug]}/page-*.js`) — دليل على أن `process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY` يُستبدَل فعلاً في حزمة المتصفح. ثم أُعيد البناء بلا متغيرات بيئة: **0 أثر** للمفتاح الوهمي في الحِزم، وأُعيد التحقق من 52/52 (خروج 0).
- `curl -L "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"` = **200** (رابط السكربت سليم؛ المصدر يوجّه إلى نسخة مُرقَّمة).
- `/masses` HTML: **0** «الاثنين» مقابل **1** «الإثنين» — التسميتان الآن من مصدر واحد.

## 10. STEP 4 — الاشتراكات/التنبيهات + حزمة التسليم التشغيلي

### 10.1 المشتركون في المستودع (عقد واحد ومحرّكان)
- `SubscriberRecord` في `src/lib/domain/types.ts`: `id, email, name(اختياري), locale, topics[], createdAt, confirmedAt, isActive`. و`AuditAction` اكتسبت `notify` و`AuditEntityType` اكتسبت `subscriber` (مع تسميتيهما العربية: «إشعار بريدي (لم يُرسل)» و«مشترك في التنبيهات») — الرفض والتنبيه كلاهما أثر تدقيقي لا حركة على صف.
- `src/lib/domain/subscribers.ts` (جديد، نقي): `normalizeSubscriberEmail` (تشذيب + خفض حالة، **بلا** حذف النقاط أو `+tags` لأن دمج بريدَي شخصين أسوأ من صف مكرر) — وهي المصدر الواحد الذي يجعل قيد `UNIQUE(email)` يعني ما يبدو أنه يعنيه؛ و`normalizeSubscriberTopics`، و`SUBSCRIBER_TOPIC_DIMENSIONS = ["event_type","ministry"]`، و`resolveSubscriberTopics` (يُسقط السلاجات المجهولة أو الخارجة عن البُعدين **ويعيدها في `unknown`** بدل عرضها كوسم كاذب).
- المستودع: `listSubscribers` (يشمل الموقوف عند الطلب) + `subscribe` **عديم التكرار بعقد** (البريد موجود ⇒ تحديث الصف نفسه وتنشيطه إن كان موقوفاً و`created: false`، ولا صف ثانٍ أبداً) + `setSubscriberActive` (**بلا حذف**: الإيقاف يحفظ البريد والسجل فيبقى القرار قابلاً للتراجع). كل ذلك في **كتابة ذرّية واحدة** مع سطر التدقيق في المحرك الملفي.
- محرك Supabase: `subscribers` + `locale_enum` في `database.types.ts`، و`subscribe()` يستعمل **عميل الخدمة** (لا عميل الجلسة) لأن الزائر بلا جلسة أصلاً، مع التقاط `23505` إن سبقه تسجيل آخر بالبريد نفسه فيحدّث الصف الفائز بدل أن يفشل الزائر. البريد لا يقرأه ولا يكتبه مفتاح anon إطلاقاً.
- هجرتان جديدتان (10 و11): `locale_enum` + جدول `subscribers` (بريد فريد + CHECK للطول والحد الأقصى للتصنيفات) + فهارسه + `ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'notify'`، ثم RLS: **لا قراءة عامة ولا إدراج عام**، وقراءة/تعديل للطاقم عبر `is_staff()`، **وبلا سياسة DELETE إطلاقاً**.

### 10.2 محوّل البريد: no-op موثّق (لا يُرسل شيء)
- `src/lib/notify/mailer.ts`: واجهة `Mailer` + `MailMessage` + `MailSendResult`، و`getMailer()` يقرأ `MAIL_PROVIDER` (افتراضاً `noop`)؛ أي اسم غير مسجَّل **يُسجَّل خطأ صريحاً ويعود إلى no-op** ولا يدّعي إرسالاً. مكان إضافة مزوّد حقيقي معلَّم بثلاث خطوات في رأس الملف (`MAILER_FACTORIES`).
- `src/lib/notify/noop-mailer.ts`: `deliverEmails: false` دائماً، ويُسجّل `[notify] would-send — NO EMAIL IS SENT`، و`recordWouldSendNote()` تُلحق سطر تدقيق `notify` على المشترك نفسه (بذل وسع: فشل التسجيل لا يُحوَّل إلى خطأ يواجه الزائر).
- `src/lib/notify/index.ts`: `notifyNewSubscription()` نقطة الدخول الواحدة، و`buildSubscriptionWelcomeMessage` تكتب النص بالعربية أو الإنجليزية حسب لغة الزائر — والنص نفسه يقول إن الرسالة **لم تُرسل**.

### 10.3 السطح العام: `/subscribe` + الاستمارة + الراية
- `src/lib/validations/church-schemas.ts`: مخطط `EventSubscriptionSchema` (بريد مُتحقَّق + اسم اختياري + تصنيفات بشكل سلَج + `turnstileToken` بنفس العقد المشترك للاستمارات العامة).
- `src/actions/subscription-actions.ts` (جديد): الراية (`isEventSubscriptionsEnabled`) → تحديد المعدل `subscribe:${ip}` → zod → Turnstile → **المستودع** (لا عميل Supabase) → `notifyNewSubscription`. يعيد **رمز نتيجة** (`subscribed|updated|disabled|rate-limited|invalid|verification-failed|store-error`) مع رسالة عربية، فتترجمه الواجهة من قاموس i18n — وهذه أول استمارة عامة تعمل فعلياً على المحرّك الملفي (بقية الاستمارات تحتاج Supabase).
- `src/app/subscribe/page.tsx` + `SubscribeForm.tsx`: صفحة خادمية ديناميكية (كوكي اللغة + قراءة التصنيفات الحية عبر `getFeedTaxonomy`) + استمارة عميل بثلاث لغات عرض (RHF بنفس مخطط الخادم)، مع حالة «الميزة معطّلة» وحالة فشل قراءة التصنيفات، ونص **«إرسال البريد غير مفعّل على هذا الموقع بعد»** ظاهراً **قبل الإرسال** (لافتة ثابتة فوق الاستمارة، `data-subscribe-delivery="off"`) ومكرَّراً بعد كل نجاح — فلا يوعد الزائر برسالة لن تصله. أُضيفت دعوة للاشتراك في `/events` بشرط الراية (`data-events-region="subscribe"`).
- الراية `EVENTS_SUBSCRIPTIONS_ENABLED` في `src/lib/env.ts` (تُقرأ عند النداء؛ `0|false|off|no` تعطّل): تعطّل الاستمارة + ترفض الإجراء + تجعل شاشة الإدارة للقراءة فقط. **الفشل مغلق على الخادم لا بإخفاء زر**.
- `src/lib/events/subscribers.ts` (نقي): `groupSubscribableTopics` (بُعدا `event_type`/`ministry` فقط، بلا أقسام فارغة).

### 10.4 سطح الإدارة `/admin/subscribers`
- `listAdminSubscribers()` في `src/lib/events/admin.ts`: يقرأ **الموقوف أيضاً** (سجل من طلب أن يُخاطَب) ويحلّ التصنيفات المخزَّنة إلى مصطلحات حية عبر `resolveSubscriberTopics`.
- الصفحة + `SubscribersManager`: جدول (البريد، الاسم، اللغة، التصنيفات، تاريخ التسجيل بتوقيت القاهرة، الحالة، زر إيقاف/إعادة تنشيط)، ولافتة صريحة **«لا يُرسل أي بريد إلكتروني»**، وربط `subscribersRead/Write` بالقدرات: `subscribers:read` لكل الأدوار و`subscribers:write` للمحرر والمالك (الإيقاف ليس حذفاً). ولا زر حذف (لا قدرة حذف للمشتركين أصلاً).
- تكامل: بند تنقّل جديد في غلاف الإدارة، ورابط سريع في لوحة التحكم، و`notify`/`subscriber` في مرشّحات سجل التدقيق.

### 10.5 نسخ/استعادة مخزن الملفات — **مُختبَر فعلياً**
- الاختبار الكامل (نسخ ← تعديل ← استعادة ← تحقق) نُفِّذ على مخزن المستودع الحقيقي: البصمة `230ca458…` قبل وبعد (مطابقة بايت ببايت)، والموقف العام عاد إلى `{"events":2,"subscribers":0,"audit":0,"publicItems":84}`، واختُبر أيضاً عبر **بناء يعمل** (`next start`) فظهرت الفعالية المؤقتة في HTML `/events` ثم اختفت بعد الاستعادة. المخرجات منقولة حرفياً في `docs/backup-restore.md` §1.5.
- أُثبتت في الطريق ترقية المستند من 1 إلى 2 (`[store] upgraded the file-backed store document { from: 1, to: 2 }`)، وعُديم التكرار (تسجيل #2 أعاد `created:false` ونفس الصف)، وسطر التنبيه `notify`، والإيقاف/التنشيط.
- **لا نسخ احتياطي لـ Supabase لم يُختبر** (لا قاعدة في هذه البيئة) — مذكور صراحةً في §3 من الوثيقة.

### 10.6 وثائق التسليم (`docs/`)
- `docs/runbook.md`: البيئات الثلاث، جدول متغيرات §9.1 بمستهلك كل متغير وسلوكه عند الغياب، **قاعدة اختيار المحرك** (والفرق المهم: مسار القراءة العامة يحتاج مفتاح anon بينما المحرك يحتاج service-role)، أوامر البناء والتشغيل، ترتيب تطبيق الهجرات، **كيف يعمل النشر الفوري** (`revalidateTag` + `EVENT_SURFACE_PATHS` + زر إعادة النشر + سبب استثناء `/admin/**` و`/subscribe` من القائمة)، مكان `.data/` ونسخه، وخطوط السجل المفيدة، وفحوص الصحة بالأوامر.
- `docs/backup-restore.md`: الإجراءان بالتفصيل مع أوامرهما، و**دليل التنفيذ الفعلي** لمخزن الملفات، وجدول «ما اختُبر وما لم يُختبر»، وجدول عمل دوري جاهز.
- `docs/rollback.md`: مصفوفة «العرَض ← السبب ← القسم»، والتراجع بالكود (`git revert` + البوابات) وبالنشر (promote/rollback أو مبدّل symlink) وبالبيانات (وتكلفته: ما بعد النسخة يُفقد — مع استعلام يعدّه قبل التنفيذ)، وسياسة الهجرات (forward-only)، ومفاتيح إطفاء الميزات، وقسم صريح لما لم يُختبر.
- `docs/credential-handover.md`: جدول 12 مفتاحاً (من أين، أين يُستهلك، عام أم سري، دورية التدوير)، وخريطة «المتغير ← الملف المستهلك»، وخطوات تدوير كل مفتاح وأثر كل تدوير، وفحص تحقق من خمس دقائق بعد التسليم.
- `docs/admin-guide.md`: دليل عربي غير تقني ببنود التنقل الفعلية (منشور، مسودة، نسخ، أرشفة، إلغاء بسبب، نقل/إلغاء موعد واحد، ترجمة، وسائط بيانات وصفية، سجل تدقيق، زر إعادة النشر، المشتركون)، **مع 10 عناصر نائبة للصور** بترتيب أسمائها في `docs/images/admin/` وبيان صريح أنه **لا يمكن التقاط أي صورة في هذه البيئة** وأنها تُلتقط من لوحة الإدارة الحقيقية، وقاعدة عدم نشر بيانات أشخاص حقيقيين في الصور.
- تحديثان لملفين قائمين: `docs/release-readiness.md` (متغيرا `EVENTS_SUBSCRIPTIONS_ENABLED` و`MAIL_PROVIDER`، «إحدى عشرة هجرة»، تصحيح عدّادات التحقق إلى 29 جدولاً/56 سياسة/29 RLS/15 نوعاً بعد أن كانت متخلّفة عن طبقة الفعاليات، وإضافة فجوتين: لا بريد يُرسل ولا صور شاشة) و`supabase/README.md` (الملفان 10 و11، وحد `subscribers_email_key`، وسياسة `subscribers` الخالية من أي وصول عام).

### أدلة تحقق STEP 4 [PROVEN]
- `./node_modules/.bin/tsc --noEmit`: **خروج 0** على الشجرة النهائية (بعد كل تعديلات المصدر، وبعد حذف `getSubscriberByEmail` الزائد من العقد ليبقى السطح بقدر ما له مستهلك).
- `pnpm run lint`: **خروج 0** بلا أي مخرجات.
- `pnpm run build` بلا أي متغير بيئة (تحقق مسبق: 0 متغير من `NEXT_PUBLIC_|SUPABASE_|TURNSTILE_|YOUTUBE_|CHURCH_DATA_DIR|EVENTS_|MAIL_` و0 ملف `.env*`): **خروج 0**، «✓ Compiled successfully in 18.1s»، «✓ Generating static pages (53/53)»، `ƒ Middleware 93.8 kB`، والمساران الجديدان `ƒ /subscribe` (3.33 kB) و`ƒ /admin/subscribers` (4.97 kB).
- **تشغيل حقيقي** (`next start` على منفذ 3111 ثم إيقافه): `GET /subscribe` = **200**، `GET /admin/subscribers` = **307** إلى `/admin/login?reason=session` (الفشل المغلق سليم على مسار الإدارة الجديد)، و`/events` = 200، وظهرت الفعالية المؤقتة في HTML `/events` أثناء التعديل ثم اختفت بعد الاستعادة.
- **سبعة فحوص وحدة** (سكربت مؤقت حُذف): رفض البريد غير الصالح، قبول الصالح، تطبيع البريد والتصنيفات، إسقاط السلاجات المجهولة/غير القابلة للاشتراك، الراية مفعّلة افتراضاً و`EVENTS_SUBSCRIPTIONS_ENABLED=0` يعطّل، وأن المجموعات المعروضة من بُعدَي `event_type`/`ministry` فقط — **7/7 ناجحة**.
- **دورة النسخ/الاستعادة**: أُعيد تشغيلها بعد كل تعديل على المحرك، وكل مرة: تسجيل #1 `created: true` و#2 `created: false` بنفس الصف، `notification: {"provider":"noop","delivered":false,"notificationLogged":true}`، وسجل التدقيق ستة أسطر `create event/publish/ create subscriber/update/notify/update` بالترتيب، ثم استعادة ببصمة مطابقة وعودة `{"events":2,"subscribers":0,"audit":0}`.
- **تنظيف**: `.scratch/` (المحمّل + السدادة + السكربت + سجلات التشغيل) محذوف بالكامل، ومجلد `.backups/` (نسخة البصمة) مُضاف إلى `.gitignore`، ولم يُعمل أي commit.

## 11. تمريرة إغلاق فجوات الصفحات العامة (`/about` + `/gallery` + `/sermons` + `/privacy`)

### 11.1 ما بُني (أربع صفحات عامة، بلغتين، بلا أي اعتمادية جديدة)
- **`/about` (جديد)**: فهرس قسم «عن الكنيسة» الذي كان 404. العنوان والوصف من القاموس، ومقدمة الكنيسة كنصّ Parish مكتوب بالعربية والإنجليزية في الصفحة، و**كل رقم فيه محسوب من بيانات الكنيسة نفسها** (`getAltars().length`، `getClergy().length`، `getClinicSpecialties().length`، `getChurchMeetings().length`، `getActivities().length`، `getSchoolsAcademies().length`) — لا رقم مكتوب يدوياً، والبطاقة التي قيمتها صفر تُحذف بدل عرض «0». العنوان من `PARISH_ADDRESS_AR` والإيبارشية من القاموس، وبطاقات واضحة للصفحات الثلاث (history/altars/clergy) + قائمة للصفحتين الجديدتين (`gallery`/`sermons`).
- **`/gallery` (جديد)**: يقرأ **الوسائط العامة فقط** عبر قارئ عام جديد `getPublicGalleryMedia()` في `src/lib/events/feed.ts` (يفلتر `publicOnly` **في الاستعلام**، ويعيد نموذجاً عاماً أضيق من `MediaRecord` يُسقط `uploadedBy`/`sizeBytes`/`isPublic` فلا يصل معرّف حساب طاقم إلى صفحة عامة). ثلاث حالات موسومة: `placeholder` (لا وسائط) و`registered` (شبكة بطاقات) و`load-failed` (لوحة كهرمانية بنفس نص فشل الفعاليات).
- **الحالة النائبة القابلة للاستبدال**: إطار متقطّع + شارة «حالة مؤقتة قابلة للاستبدال» + عنوان «الصور ستُضاف قريبًا» **ومعه السطر نفسه بالإنجليزية** (تسمية مزدوجة اللغة للحالة)، ونصّ يشرح أن الصور ستُعرض تلقائياً عند تسجيلها، وسطر «لا تُعرض صور بديلة أو تجريبية». لا صورة واحدة مُختلَقة.
- **لماذا بطاقة لا صورة (ثلاثة أسباب مقيسة، لا تفضيل)**: (1) المشروع يخزّن **بيانات وصفية فقط** بلا مخزن ملفات فلا وجود لملف يُخدَم؛ (2) `img-src 'self' data: blob:` في CSP تمنع أي ملف من مضيف خارجي أصلاً؛ (3) لا `<img>` ولا `next/image` في المشروع كله و`images.remotePatterns` فارغة وقاعدة ESLint تُحذّر على `<img>` — فإدخال وسم صورة لملف غير موجود يبادل ثابتاً حقيقياً بمعاينة لا تظهر أبداً. لذلك النص البديل المسجَّل يُعرض **كنص الصورة البديل** (caption) + اسم الملف + رابط مُتحقَّق منه.
- **تحقّق الرابط قبل الرسم**: `openableMediaUrl()` (محلي غير مُصدَّر — صفحة Next لا يجوز أن تُصدّر إلا سطح الإطار) يقبل `https:` أو مساراً نسبياً فقط، ويرفض `javascript:`/`data:`/`//host`، ويعرض «الرابط المسجَّل غير قابل للفتح» بدل إخفاء الصف.
- **بلا تجميع حسب ألبوم/وسم**: `MediaRecord` لا يحمل عمود ألبوم أو وسماً، وتصنيف ملفات الكنيسة بالتخمين مرفوض — فالشبكة مسطّحة، والسبب مكتوب في رأس الملف.
- **`/sermons` (جديد)**: حالة فارغة **صريحة وموسومة** («لا يوجد أرشيف عظات منشور بعد»، وسببها مكتوب: لا عظة معتمدة ولا تسجيل ولا صف وسائط) مع التسمية بالإنجليزية تحتها، ثم «مصادر الكلمة المتاحة الآن»: `/live` و`/bible` و`/masses` و`/events` (كلها مسارات قائمة)، ثم شرائح **`FlagBadge` على مصطلحات `event_type` الحية** من `getFeedTaxonomy()` كل واحدة رابط إلى `buildEventsHref` المفلتر بنوعها — فلا يمكن أن تُعرض صفة نوع لا تُصنّف بها الكنيسة مواعيدها. **لا عظة واحدة مُختلَقة**.
- **`/privacy` (جديد)**: ثمانية أقسام بلغتين، وكل جملة فيها قابلة للتحقق من الكود الذي يكتب البيانات: جدول `contact_messages` (رسائل التواصل)، `condolence_bookings` (حجز قاعة العزاء)، `program_applications` (طلبات الالتحاق)، `job_applications` (طلبات التوظيف)، `subscribers` (الاشتراك في التنبيهات) — وكل نوع يحمل اسم جدوله في الوسم `data-privacy-table` ليتتبعه أي مدقّق، وبحقوله الفعلية كما تُجمعها الاستمارات (لا الرقم القومي في حجز العزاء مثلاً، فهو عمود موجود ولا تجمعه الاستمارة العامة). ويشرح: سجل التدقيق الداخلي (من/ماذا/متى + الحالة قبل وبعد، والرفض يُسجَّل، والكتابة العامة الوحيدة فيه هي الاشتراك حاملةً البريد)، وما **لا** يُجمع إطلاقاً (لا اعترافات ولا سجلات مالية أو اجتماعية داخلية ولا بيانات دفع ولا تحليلات أو تتبّع — غياب البنية نفسه هو الضمانة، INV-01)، وملف تعريف الارتباط الواحد (كوكي اللغة سنة، ومعه Turnstile في الاستمارات)، وتقليل البيانات والاحتفاظ (والاشتراك لا يُحذف بل يُوقف)، والتواصل بشأن البيانات، وشروط مختصرة (أولوية الإعلان الرسمي للكنيسة، الحسابات البنكية الرسمية، الروابط الخارجية).
- **`src/lib/i18n/messages.ts`**: نحو 70 مفتاحاً جديداً (عناوين ونصوص تعريفية وتسميات حالات وأزرار) بالعربية والإنجليزية — والإنجليزية مقيَّدة نوعياً فتغطيتها مضمونة بالبناء. أما **نصوص المحتوى الطويلة** (مقدمة الكنيسة، أقسام السياسة) فمكتوبة في الصفحات كأزواج `{ ar, en }` بنوع محلي **يُلزم الحقلين** فغياب الترجمة صار خطأ بناء لا فراغاً في الصفحة، وتُعرض عبر `localized()` نفسه (مسارات الترجمة لم تتفرّع).

### 11.2 التنقل والتذييل والخريطة (كل الصفحات صارت موصولة)
- **`Header.tsx`**: أُضيف `/about` **أول عنصر** في قائمة «عن الكنيسة» المنسدلة، وأُضيفت مصفوفة `secondaryNavLinks` (`/gallery`، `/sermons`، `/privacy`) تُرسم في **الدرج الجوّال** (وعلى الحاسوب من التذييل). **قرار صريح**: لم تُضَف الثلاثة إلى صف الحاسوب — الصف يحمل خمسة عشر بنداً بالفعل على `xl`، وبندان إضافيان يدفعانه خارج عرضه؛ **والوصول هو المطلوب**، وكل هذه المسارات موصولة من التذييل في كل المقاسات. **لم يُضف هيكل تنقّل ثانٍ** (مصدر التنقل بقي ملفاً واحداً، وقاعدة منع مكوّنات التنقل البديلة لم تُخترق).
- **`Footer.tsx`**: رابط «العظات والتسجيلات الروحية» (`/sermons`) و«معرض صور الكنيسة والمناسبات» (`/gallery`) في عمود «الصلوات والمقدسات»، ورابط «نبذة عن الكنيسة ورسالتها وخدمتها» (`/about`) في عمود هوية الكنيسة، و«سياسة الخصوصية» (`/privacy`) في الشريط السفلي؛ ورابط الشريط السفلي «عن الكنيسة» الذي كان يشير إلى `/about/history` صار يشير إلى `/about` (الصفحة الأم صارت موجودة)، وأُضيف `flex-wrap` لذلك الشريط فلا يفيض على الشاشات الضيقة.
- **`sitemap.ts`**: أربعة مسارات ثابتة جديدة (`/about` بأولوية 0.7، `/sermons` و`/gallery` أسبوعية 0.6، `/privacy` سنوية 0.3) — والملف صار 23 مدخلاً ثابتاً.
- **تصحيح مسار التصفح**: صفحات `about/{history,altars,clergy}` كانت تشير في مسار التصفح إلى `/about/history` بعنوان «عن الكنيسة» (أي إلى الصفحة نفسها في حالة التاريخ)؛ صارت تشير إلى `/about` بعد وجوده.
- **`EVENT_SURFACE_PATHS` لم تُمسّ (قرار صريح)**: الصفحات الأربع **ديناميكية بلا كاش** (`force-dynamic` + كوكي اللغة)، والقائمة للمسارات العامة **المخزَّنة** فقط — نفس سبب إبقاء `/subscribe` خارجها سابقاً. وأي مسار عام جديد **يُخزَّن** فعاليات يجب أن يُضاف إليها كما تقول القاعدة.

### 11.3 أدلة التحقق [PROVEN]
- `./node_modules/.bin/tsc --noEmit` على الشجرة المجمّدة: **خروج 0** (وأثناء التطوير أمسك الفحص انحداراً حقيقياً: مصفوفة الإحصاءات وُسِّعت `key` إلى `string` قبل الفلترة فأُصلحت بنوع صريح على المصفوفة).
- `pnpm run lint` (`eslint .`): **خروج 0** بلا أي مخرجات (0 أخطاء و0 تحذيرات — لم يُدخل `<img>` ولا `next/image`).
- `pnpm run build` بلا أي متغير بيئة (تحقق مسبق: 0 متغير من `NEXT_PUBLIC_|SUPABASE_|TURNSTILE_|YOUTUBE_|CHURCH_DATA_DIR|EVENTS_|MAIL_` و0 ملف `.env*`): **خروج 0**، «✓ Compiled successfully in 42s»، «✓ Generating static pages (53/53)» (العدد الثابت لم يتغيّر لأن الأربعة ديناميكية)، و**0 تحذير/خطأ** في السجل، والمسارات الأربعة في جدول البناء: `ƒ /about` و`ƒ /gallery` و`ƒ /privacy` و`ƒ /sermons`.
- **فحص الروابط الداخلية آلياً** (43 ملف مسار على القرص مقابل 23 رابطاً داخلياً مختلفاً في الملفات السبعة المعدَّلة/المضافة): **0 رابط غير مُحَل**، وكذلك كل المسارات الـ23 في `STATIC_ROUTES` لها ملف مسار على القرص.
- **تشغيل حقيقي** (`next start` على منفذ 3123 ثم إيقافه): `/about` و`/gallery` و`/sermons` و`/privacy` = **200** لكلٍّ، و`/about/history` و`/events` و`/ministries` = **200** (لا انحدار)، وظهرت العلامات المتوقعة في HTML: `data-gallery-state="placeholder"` مع «الصور ستُضاف قريبًا»، و`data-sermons-state="empty"` مع «لا يوجد أرشيف عظات منشور بعد»، والوسوم الخمسة `data-privacy-table="…"` (contact_messages، condolence_bookings، program_applications، job_applications، subscribers)، وروابط الصفحات الثلاث في `/about`.
- **دورة وسائط كاملة على المخزن الحقيقي** (أُجريت ثم أُعيدت): حُفظ ملف المخزن (بصمة `230ca458…` — وهي نفسها البصمة المسجَّلة في §10.5)، ثم أُدرجت ثلاثة صفوف وسائط (عامان + صف داخلي `isPublic:false`)، فصار `/gallery` = **200** بحالة `registered` وببطاقتين فقط لصفَّي العام (الصف الداخلي **0 مطابقة** — الفلتر يعمل في الاستعلام لا في العرض)، وظهر الوصف العربي المترجم واسم الملف ورابط `https` ورابط نسبي وملاحظة «لم يُسجَّل وصف نصي» للملف بلا alt. ثم أُعيد الملف من النسخة **ببصمة مطابقة (`sha256sum -c` = OK)** وعدد صفوف الوسائط عاد إلى 0، و`/gallery` عاد إلى `placeholder`. مجلد `.scratch-gallery/` (النسخة + اللقطة + التحقق) حُذف بالكامل، ولم يُعمل أي commit.


## 12. حزمة اختبارات Vitest وبوابة CI الصلبة (Commit `9aa0be9`) [PROVEN]

### 12.1 ما أُنجز في الشفرة والاختبارات
- **إضافة إطار Vitest 5.0.1**: تم ضبط `vitest.config.ts` لدعم استيراد المسارات `@/*` واستخدام بيئة معزولة (`isolate: true`) تضمن تشغيل كل ملف اختبار في عامل (worker) مستقل.
- **7 ملفات اختبارات و226 فحصاً ناجحاً بنسبة 100% (خروج 0 في 2.92 ثانية)**:
  1. `src/lib/domain/__tests__/capabilities.test.ts` (105 اختبارات): مصفوفة القدرات الكاملة للأدوار (`owner`, `editor`, `viewer`)، واختبار دالة `can()` النقية، واشتقاق الأدوار من أدوار الطاقم، ورسائل رفض الصلاحية والوصف التدقيقي.
  2. `src/lib/domain/__tests__/recurrence.test.ts` (23 اختباراً): التوسيع الأسبوعي والشهري للسلاسل المتكررة، وحسابات التوقيت بمنطقة `Africa/Cairo`، وإلغاء موعد فردي، ونقل موعد مع إخلاء التاريخ الأصلي وعدم ابتلاع المواعيد، ورفض النوافذ الزمنية المتجاوزة 731 يوماً بـ `RangeError`.
  3. `src/lib/store/__tests__/json-driver.test.ts` (23 اختباراً): المستودع الملفي الذري، التهيئة التلقائية من البذرة عند أول استخدام في مجلد مؤقت بنظام التشغيل، تسلسل التعديلات، عدمية تكرار السلَج، منع حذف المصطلحات المرتبطة، وإنتاج مسودات مستقلة عند التكرار، وتسجيل سطر تدقيق لكل تعديل.
  4. `src/lib/events/__tests__/filters.test.ts` (26 اختباراً): تصفية الفعاليات حسب الحالة، الأبعاد الستة للتصنيفات، النافذة الزمنية، السلاجات، ومطابقة التواريخ.
  5. `src/lib/events/__tests__/ics.test.ts` (19 اختباراً): توليد ملفات تقويم iCalendar (.ics) مطابقة لمعايير RFC 5545 مع دعم أحداث اليوم الكامل، والمناطق الزمنية، والتكرار، وحقول الوصف والتنظيم.
  6. `src/lib/domain/__tests__/subscribers.test.ts` (17 اختباراً): تطبيع البريد الإلكتروني بحفظ النقاط، تطبيع التصنيفات، حصر أبعاد الاشتراك بـ `event_type` و`ministry`، إسقاط السلاجات المجهولة، وعدمية تكرار المشتركين.
  7. `src/lib/utils/__tests__/coptic-date.test.ts` (13 اختباراً): التحقق الحسابي من عهد التقويم القبطي (1825030) وتحويلات التواريخ للأعياد والمواسم القبطية (1 توت 1743، 29 كيهك 1742، إلخ).
- **عزل بيانات الاختبار**: اختبارات المستودع توجّه `CHURCH_DATA_DIR` إلى مجلد مؤقت مستقل لكل اختبار وتُطهّره بعد الانتهاء، فلا تلمس مخزن الإنتاج أو التطوير `.data/church-store.json`.

### 12.2 ترقية سير عمل التكامل المستمر (CI Gate)
- في `.github/workflows/ci.yml`: أُضيفت خطوة `pnpm test` كبوابة صلبة إجبارية تلي فحص الأنواع `pnpm exec tsc --noEmit` وتسبق البناء `pnpm run build`، وكلاهما تحت حارس التحقق الصارم من عدم تسرب أي متغيرات بيئة تطبيقية (`NEXT_PUBLIC_*`, `SUPABASE_*`, `TURNSTILE_*`, `YOUTUBE_*`).

---

## 13. إدماج تسليم الوكيل وموجز الهدف المجمد v1.0 (Goal Brief v1.0 Integration)

### 13.1 ملخص التسليم وحزمة الوثائق
- تم استلام وفحص حزمة تسليم الوكيل المساعد (`auto-coder`) المودعة في `C:\Users\KimoStore\.openclaw-autoclaw\agents\auto-coder\workspace\delivery\`:
  1. `goal-brief-church-site-2026-09-16.md`: وثيقة موجز الهدف المجمدة (Goal Brief v1.0) — تحدد الهدف بجملة واحدة، وسجل الافتراضات الـ12، وسجل المخاطر الـ12 مع مسارات التراجع، ومصفوفة التتبع، وقائمة التدقيق من 12 خطوة.
  2. `goal-brief-church-site-2026-09-16.json`: التوأم الآلي المتطابق حقلاً بحقل للمقارنة البرمجية.
  3. `goal-brief-church-site-2026-09-16-summary.html`: ملخص تنفيذي مستقل بصفحة واحدة (تصميم 11 Build - Luxury Minimalism) بلا أي ارتباطات خارجية.
  4. `goal-brief-church-site-verify.ps1`: سكربت التحقق الآلي — شُغِّل وأكد نجاح 100% من الفحوصات (`RESULT: PASS (all checks green)`).

### 13.2 حالة معايير القبول الـ 16 (Acceptance Criteria Status)
تم تصنيف المعايير الـ 16 وفق معجم الحالة المعتمد:
- **6 معايير محققة ومثبتة بالدليل (met)**:
  1. `originality-structure-only`: الأصالة والاستقلالية؛ لا نصوص أو وسائط مقتبسة من الموقع المرجعي، والاستعارة محصورة في هيكل المعلومات وموثقة في `docs/reference-analysis.md`.
  2. `no-env-gates-green`: اجتياز البوابات الأربع بلا بيئة (`tsc`=0، `lint`=0، `test`=226/226، `build`=53/53).
  3. `recurrence-engine-correctness`: صحة محرك التكرار والاستثناءات وتاريخ الأقباط (23+13 اختباراً ناجحاً).
  4. `no-regressions-and-deps-justified`: عدم حدوث أي انحدار في المسارات القائمة وخلو قفل الحزم من أي تبعات تشغيلية غير مبررة.
  5. `brief-quality-criteria`: استيفاء معايير الجودة الـ 12 الذاتية لوثيقة الهدف نفسها.
  6. `format-parity-no-placeholders`: خلو وثائق التسليم من أي علامات نائبة أو قيم فارغة في JSON.
- **5 معايير جزئية (partial)**:
  1. `public-surface-live`: الصفحات العامة الـ 26 تعمل بنجاح (200)؛ مثبتة بتقرير تشغيل سابق، ولم تُعد زيارة كل المسارات في هذه التمريرة الفاحصة.
  2. `admin-access-control`: حظر الوصول غير المصرح وتحويل 307 إلى صفحة الدخول مثبتان، لكن لم يُختبر رفض دور `viewer` بجلسة Supabase حقيقية على المتصفح.
  3. `realtime-publish-no-rebuild`: النشر اللحظي بلا إعادة بناء مثبت بتقارير الجلسة السابقة (84 ← 85 ← 84).
  4. `taxonomy-flags-and-filters`: فلاتر التصنيفات ذات الأبعاد الستة مغطاة بـ 26 اختباراً، والعد التراكمي المباشر مسجل ذاتياً.
  5. `locale-rtl-ltr-switching` و `storage-and-audit-trail`: التبديل اللغوي مثبت بالكوكيز وتراجع الترجمة؛ ومطابقة التخزين واستعادة النسخة الاحتياطية مثبتة ببصمة الهاش (`230ca458…`).
- **5 فجوات مفتوحة (Open Gaps) مع افتراضات آمنة (Safe Defaults)**:
  1. `binary-media-upload` (رفع الوسائط الثنائية): النظام يسجل بيانات وصفية فقط. *الافتراض الآمن*: الاستمرار على البيانات الوصفية حتى توفير وتوصيل خدمة تخزين ملفات (Supabase Storage / S3).
  2. `mailer-real-or-documented` (محول إرسال البريد): حالياً محول `noop` موثق يسجل الإشعار في التدقيق ولا يدّعي الإرسال. *الافتراض الآمن*: بقاء الـ no-op مع بقاء النصوص العامة صريحة بأن البريد لا يُرسل حتى توفير مزود (Resend / SMTP).
  3. `accessibility-performance-evidence` (أدلة الوصولية والأداء في المتصفح): لا يتوفر متصفح في بيئة التطوير الحالية. *الافتراض الآمن*: صيانة المعايير الهيكلية (h1 وحيد، تباين WCAG AA، تسميات النماذج، أمان 320px) مع توثيق الفحوص البصرية كغير متحقق منها حالياً.
  4. `handover-pack-current` (لقطات شاشات الإدارة): دليل الإدارة `docs/admin-guide.md` يحمل 10 عناصر نائبة موسومة. *الافتراض الآمن*: بقاء العناصر النائبة بالأسماء الموثقة حتى التقاطها من لوحة إدارة حقيقية مأهولة.
  5. `user-supplied-inputs-applied` (البنية التحتية والمحتوى من الكنيسة): هجرات Supabase، النطاق الرسمي، شهادة SSL، واعتماد الكنيسة للبيانات الرسمية (الحسابات البنكية، الكهنة، المواعيد). *الافتراض الآمن*: بقاء القيم التمثيلية موسومة بوضوح والاستمرار على المحرك الملفي المدعوم.
  *(بالإضافة إلى `ci-green-on-release-commit`: لم يُشغَّل سير العمل عن بُعد على GitHub بعد لحين اعتماد commit الإصدار).*

### 13.3 تصحيح التناقضات السابقة في الوثائق (Doc Discrepancies Resolution)
تم رصد وتصحيح 6 تناقضات كانت عالقة في وثائق التسليم السابقة:
1. **حالة اختبارات Vitest**: كانت وثيقة التسليم القديمة تدعي أن الاختبارات غير محفوظة (uncommitted) بسبب أخطاء 503 في النموذج؛ الواقع: الاختبارات مثبتة في المستودع بـ commit `9aa0be9` وناجحة بالكامل (226/226).
2. **أعداد الصفحات والهجرات في `docs/release-readiness.md`**: كانت تذكر 52 صفحة و9 هجرات وعدم وجود sitemap/robots؛ الواقع: 53 صفحة ثابتة، 11 ملف هجرة، و`sitemap.ts` و`robots.ts` موجودان ويُبنيان.
3. **غياب `pnpm test` من وصفة التحقق في `release-readiness.md`**: تم إدراج فحص الاختبارات كبوابة رئيسية في وصفات التحقق وخطوات CI.
4. **نظافة شجرة العمل ومجلد `goal-container/`**: تم توضيح أن الشجرة نظيفة واستبعاد المجلد المذكور في `.gitignore`.
5. **مستوى إلزامية ESLint**: تم توضيح أن البوابات المحلية تفرض خروج 0 بصرامة تامة قبل الالتزام، رغم أن CI يحمل `continue-on-error` للإعلام.
6. **معرّفات الأهداف السابقة**: تم اعتماد `goal-brief-church-site-2026-09-16` كمرجع وحيد مجمد (v1.0) وإلغاء أي معرفات سابقة.

---

## الخطوة التالية الفورية
0. **إغلاق الفجوات المفتوحة الخمس (بحسب أولويات Goal Brief v1.0 وأسئلة §10)**:
   - **(أ) رفع الوسائط الثنائية**: تصميم وربط مسار رفع الملفات الحقيقية (بايتات) وربطها بالمعرض ومحرر الفعاليات عند توفير مخزن ملفات (Supabase Storage / S3)، أو الاستمرار على البيانات الوصفية كافتراض آمن.
   - **(ب) محول البريد الإلكتروني**: ربط مزود بريد حقيقي (Resend / SMTP) في `src/lib/notify/mailer.ts` وضبط `MAIL_PROVIDER`، أو تثبيت إبقاء الـ no-op مع بقاء النصوص العامة الصريحة.
   - **(ج) أدلة إمكانية الوصول والأداء**: إجراء فحص متصفح حقيقي (Lighthouse + تباين + قارئات الشاشة) وتوثيق النتائج.
   - **(د) صور دليل الإدارة**: التقاط لقطات الشاشة العشر من لوحة إدارة مأهولة وتخزينها في `docs/images/admin/` واستبدال العناصر النائبة في `docs/admin-guide.md`.
   - **(هـ) مدخلات وبنية الكنيسة**: تزويد مشروع Supabase (URL + anon + service-role) لتطبيق الهجرات الـ 11 والتحقق من RLS والجلسات، وتزويد النطاق والاستضافة، ومراجعة وتأكيد بيانات الكنيسة (الحسابات، الكهنة، الهواتف، المواعيد).
1. **تحديث `docs/release-readiness.md`**: مزامنة الوثيقة مع الواقع المحقق (53 صفحة ثابتة، 11 هجرة، بوابة `pnpm test`، وتحديث جداول التحقق).
2. **التحقق من سير عمل CI على GitHub**: متابعة تشغيل `.github/workflows/ci.yml` على الفرع البعيد والتأكد من خضار البوابات الثلاث (`tsc`, `test`, `build`).
3. **تطبيق هجرات Supabase الـ 11 على مشروع تجريبي/إنتاجي** ومطابقة القيود وسياسات RLS ودوال `SECURITY DEFINER`.
4. **محرر مصطلحات التصنيف في لوحة الإدارة**: إضافة واجهة إدارة لمصطلحات الأبعاد الستة وتفعيل/إيقاف المصطلحات.
5. **تحميل نص الكتاب المقدس الكامل** في جدول `bible_verses` وربطه بالواجهة التفاعلية لقارئ الكتاب المقدس.
6. [طريقة عمل] عند إثبات حذف أي كود: استخدام `git grep` أو `command grep`، وتأكيد خلو المستودع من التبعات قبل الالتزام.

## قرارات معتمدة
- البوابة الرقمية لن تنشر أبداً أسماء الأطباء الفردية أو جداولهم الشخصية، منعاً للإرباك وتضارب الاعذارات وللحيادية الرعوية.
- دليل العيادات التخصصي: 14 تخصصاً طبياً مع أرقام الغرف والتسعيرة الرمزية للكشف (30-35 ج.م) وهاتف استقبال العيادات (03-5500002) والاتصال المباشر دون نشر أطباء أو أشرطة اعتذار.
- INV-01: بنية منفصلة تماماً بدون تسجيل دخول للخدمات العامة، حجز العزاء بنظام تتبع علني مشفر (COND-XXXXXX).
- INV-03: عدم عرض شارات توفر أو غياب غير دقيقة أو وهمية — ويُضاف إليها: لا يُعرض أي عنوان أو موعد أو حالة غير مشتقة من بيانات البذرة/القاعدة (لا عدّاد وهمي، ولا حجز معتمد ملفق، ولا حالة بث بالإنجليزية الخام).
- ألوان وهوية قبطية ملكية: كحلي قبطي، ذهبي معتم للنصوص لضمان تباين WCAG 2.1 AA، وخطوط عربية كوفية وأميري.
- الحقول القانونية: الالتزام الصارم بحقول البذرة ومخطط DDL دون ابتداع حقول غير مأهولة.
- توقيت الكنيسة الرسمي للعرض هو `Africa/Cairo` حصراً (`PARISH_TIME_ZONE`)، ويُمنع عرض الأوقات بقصّ نص UTC أو بمنطقة المضيف/المتصفح.
- عقد الكتابة العامة واحد لكل إجراء عام: تحديد المعدل (`${action}:${ip}`) → zod → Turnstile → كتابة بعميل service-role → **الفشل المغلق**. نصفه العميل الوحيد هو `TurnstileWidget`، ولا يُعتمد عليه في الأمان (الخادم يتحقق دائماً)، ولا يُشترط وجوده عند غياب المفتاح العام.
- رمز الحجز المرجعي مصدره الوحيد `src/lib/domain/booking-reference.ts` (البادئة + طول الجسم + العنصر النائب المشتق + النوع الموسوم `BookingReference`) — يُمنع تكرار نص `COND-` أو إعادة حساب شكل الرمز أو ضبط حالة الأحرف في أي ملف آخر.
- **المستودع هو المسار الوحيد لبيانات الفعاليات**: لا تخاطب أي صفحة أو إجراء مخزنَ البيانات مباشرة؛ الاختيار بين `json` و`supabase` يقع في `src/lib/store/index.ts` وحده، والسلوك (بما فيه الفشل) واحد في الحالتين. والواجهة الخادمية لا تعرف أي محرك يعمل.
- **لا تعديل بلا سطر تدقيق**: كل تعديل يمر بـ `mutateStoreDocument` (ملف) أو يقرن بنداء تدقيق (Supabase)، ويحمل الحالة قبل وبعد. لا تُضاف طريقة كتابة تتخطى التدقيق ولا يُحذف سطر تدقيق.
- **المحرك الملفي وضع مدعوم لا منقوص**: `.data/` هو مخزن التطوير/العرض الرسمي، و`CHURCH_DATA_DIR` هو المفتاح الوحيد لتغيير مكانه، والكتابة ذرّية دائماً (بلا مسار كتابة مباشر غير ذرّي كبديل).
- **المواعيد المتكررة تُشتق ولا تُخزَّن**: يُمنع "توليد" صفوف فعاليات لكل موعد أسبوعي؛ التوسيع في `expandSeries` هو الطريق الوحيد، وتعديل موعد واحد يكون باستثناء (`cancelled`/`moved`) لا بحذف السلسلة.
- **التصنيف بستة أبعاد فقط** (`event_type | ministry | audience | language | venue | tag`): يُمنع فتح بُعد سابع أو استخدام بُعد لأمر غير تصنيفي، ويُمنع حذف مصطلح مستخدم (يُسحب بـ `isActive: false`).
- **الترجمة تُوسَم ولا تُخفى**: أي نص محتوى ناقص الترجمة يظهر بالعربية **مع علامة `⟦ترجمة مفقودة⟧`** بدل فراغ أو عربية مُتنكّرة بوصفها إنجليزية، ونصوص الواجهة وحدها من `src/lib/i18n/messages.ts`.
- **الرفض يُسجَّل (لا يُسكت عنه)**: كل محاولة يرفضها `can()` تُلحق سطر `denied` في سجل التدقيق قبل إعادة الرسالة، وبلا `before/after` لأنه ليس تعديلاً. التسجيل بذل وسع، ولا يجوز أن يتحول فشله إلى خطأ يواجه المستخدم.
- **الواجهة الإدارية تُبنى على القدرة لا على الدور المسمّى**: لا تُرسم أزرار لا يملكها الدور (عبر `resolveAdminCapabilities` على الخادم)، وهذا convenience لا أمان — الحد الفعلي في `authorize()` داخل كل إجراء.
- **الوسائط بيانات وصفية فقط**: لا رفع بايتات ولا مخزن ملفات في هذا المشروع؛ يُخزَّن اسم الملف ونوعه وحجمه ورابطه ونصه البديل، والربط بفعالية يتم بضبط `imageUrl` عبر `updateEventAction`. حد الحجم مصدره الواحد `MAX_MEDIA_SIZE_BYTES` (المخطط يفرضه والرسالة تُبنى منه). ونتيجة مباشرة: **`/gallery` لا يعرض صوراً بل بطاقات** (انظر قرار «لا صورة بلا ملف» أدناه) — والمعرض يمتلئ تلقائياً بمجرد تسجيل وسائط بعلامة «عام» بلا أي تعديل كود.
- **لا تخزين مؤقت في مسارات الإدارة**: `force-dynamic` على منطقة `/admin/(protected)` يعني قراءة المستودع مباشرة بلا `unstable_cache`، فلا حاجة لإضافة أي مسار إداري إلى `EVENT_SURFACE_PATHS` (تلك للمسارات العامة المخزَّنة).
- **البريد الإلكتروني: لا يُدَّعى إرسال لا يحدث**: لا مزوّد بريد في هذا النشر، والوحيد المُختار هو `noop` الذي **يُسجّل** ما كان سيُرسل (`notify` في سجل التدقيق) ويُرجع `delivered: false` دائماً؛ ولا يجوز لأي سطح أن يوحي بإرسال (نص الزائر يقول ذلك صراحةً). إضافة مزوّد حقيقي = ثلاث خطوات معلَّمة في `src/lib/notify/mailer.ts`، وأي اسم مزوّد غير مسجَّل يعود إلى no-op مع خطأ مسجَّل بدل ادّعاء الإرسال.
- **الاشتراك عديم التكرار بعقد**: البريد هو هوية الاشتراك، ويُطبَّع في `src/lib/domain/subscribers.ts` وحده (تشذيب + خفض حالة فقط، بلا دمج Gmail المدمِّر)، فقيد `UNIQUE(email)` يعني ما يبدو أنه يعنيه؛ وإعادة التسجيل **تحدّث الصف نفسه وتنشّطه إن كان موقوفاً** ولا تُنشئ صفاً ثانياً أبداً. ولا حذف للمشتركين: الإيقاف (`isActive: false`) هو الطريق فيبقى القرار قابلاً للتراجع.
- **الكتابة العامة تمر بالمستودع لا بعميل Supabase**: `subscribe()` هو التعديل العام الوحيد في عقد المستودع، ينفَّذ بعميل الخدمة على Supabase وبالكتابة الذرّية على المحرك الملفي — ولهذا تعمل استمارة `/subscribe` فعلاً بلا قاعدة، بخلاف بقية الاستمارات العامة.
- **الميزة تُطفأ على الخادم لا بإخفاء زر**: `EVENTS_SUBSCRIPTIONS_ENABLED` (تُقرأ عند النداء، والتعطيل بـ `0|false|off|no`) تعطّل الاستمارة وترفض الإجراء وتجعل شاشة الإدارة للقراءة فقط.
- **ترقية مستند المخزن بدل رفضه**: إضافة مجموعة جديدة (`subscribers` في الإصدار 2) تُقرأ وتُرقّى في الذاكرة مع سطر إعلان، وتُكتب بالإصدار الجديد عند أول تعديل — لأن رفض مستند قديم يعني ضياع كل فعاليات الكنيسة. أما أي إصدار غير معروف فيبقى يفشل بصوت عالٍ.
- **التوثيق التشغيلي يقول ما لم يُختبر**: أي إجراء في `docs/` لم يُنفَّذ فعلاً يُوسَم صراحةً «غير مختبَر» (مثل `pg_dump`/`pg_restore` و`vercel promote`)، وأي دليل تنفيذ يُنقل حرفياً من المخرجات (نسخ/استعادة مخزن الملفات). ولأن هذه البيئة لا متصفح فيها، فصور دليل الإدارة **عناصر نائبة** بأسماء ملفات موثّقة تُلتقط لاحقاً من اللوحة الحقيقية.
- حذف المكوّنات الميتة قاعدة مستمرة: قبل حذف أي ملف يُثبَت أولاً بصفر مستوردين بـ `git grep` على `HEAD` (لا على شجرة العمل بعد الحذف)، ويُفحص بعده هل صار أي تصدير يتيماً بسببه.
- **الحالة الفارغة تُقال، والحالة النائبة تُوسَم قابلة للاستبدال**: أي صفحة عامة بلا محتوى حقيقي تعرض حالة صريحة موسومة (`data-*-state`) تشرح **لماذا** هي فارغة ومتى تمتلئ، **ويُمنع عرض محتوى بديل أو تجريبي** (لا صورة، ولا عظة، ولا موعد). وحيث تكون الحالة نفسها رسالة للزائر تُكتب **بالعربية والإنجليزية معاً** في الحالة الواحدة (`/gallery`: «الصور ستُضاف قريبًا»، `/sermons`: «لا يوجد أرشيف عظات منشور بعد») فلا يعتمد فهمها على لغة الواجهة الحالية.
- **لا صورة بلا ملف، ولا وسم صورة في المشروع**: لا `<img>` ولا `next/image` في أي صفحة (و`img-src 'self' data: blob:` في CSP و`images.remotePatterns` فارغة)، لأن المشروع لا يستضيف ملفات صور. وبالتالي ما يُعرض من وسائط هو **بطاقة تحمل الوصف المسجَّل نصاً** (فهو alt الصورة) + اسم الملف + رابطاً **مُتحقَّقاً** (https أو مسار نسبي فقط؛ و`javascript:`/`data:`/`//host` تُرفض وتُعرض «الرابط غير قابل للفتح») — وأي عرض صور فعلي لاحقاً يستلزم قراراً مزدوجاً: مخزن ملفات + توسيع `img-src`.
- **القراءة العامة للوسائط قارئ عام واحد يفلتر في الاستعلام**: `getPublicGalleryMedia()` في `src/lib/events/feed.ts` هو الباب الوحيد للوسائط العامة، يمرّر `publicOnly: true` إلى المستودع (فلا يصل صف داخلي حتى لو نسي عرض لاحق الفلترة)، **ويعيد نموذجاً أضيق من `MediaRecord`** يُسقط `uploadedBy` و`sizeBytes` و`isPublic` — فلا يخرج معرّف حساب طاقم إلى صفحة عامة.
- **التنقل: لا توسيع لصف الحاسوب بلا داعٍ**: مصدر التنقل واحد (`Header.tsx`) ولا يُضاف هيكل تنقّل ثانٍ؛ والبنود الجديدة تُضاف إلى **الدرج الجوّال + التذييل** حين يكون صف `xl` ممتلئاً (خمسة عشر بنداً اليوم)، لأن المطلوب هو الوصول لا ازدحام الصف. ويبقى كل مسار عام موصولاً من التذييل في كل المقاسات.
