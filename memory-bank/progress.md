# Progress — سجل الإنجاز

## يعمل الآن (Phase 6 Final Documentation & Playwright E2E — 100% Complete & Verified)
- [x] **إتمام المرحلة السادسة بالكامل وخاتمة خارطة طريق الإصدار الثاني (All 6 Phases 100% Complete & Verified)**:
  * **سقالة Playwright واختبارات المتصفح E2E**:
    - تثبيت حزمة `@playwright/test@1.63.0` في جذر المستودع كـ devDependency.
    - إعداد `apps/web/playwright.config.ts` مستهدفاً متصفح Chromium في وضع headless وبأبعاد سطح المكتب الكاملة مع تشغيل خادم Next.js المحلي تلقائياً على المنفذ 3000.
    - إضافة سكربت `e2e:web` في جذر المستودع وحزمة الويب.
  * **الرحلات الأربع للمتصفح الحقيقي (100% Real Browser Journeys)**:
    - رحلة فهرس المحتوى الديناميكي `/content/article`: التحقق من اتجاه RTL، والترويسة، وبطاقة المقال المخصصة.
    - رحلة قراءة المقال التفصيلي `/content/article/orthodox-patristic-treasures`: التحقق من سلامة العرض والنص الغني والاتجاه.
    - رحلة الحالة الفارغة الصادقة `/content/sermon`: إثبات عرض رسالة الخلو التام بدون فبركة أو بيانات وهمية.
    - رحلة مرئيات الكنيسة في صفحة `/about`: التحقق من عنوان القسم ومضمن الفيديو الآمن (`youtube-nocookie.com`).
    - التقاط 4 لقطات شاشة كاملة (Full-page PNG) محفوظة في `.scratch/phase6-gates/g6-screenshots/`.
    - اجتياز كامل لـ 4/4 فحوصات في Playwright Chromium خلال 10.3 ثانية.
  * **إفصاح الأمانة المعمارية ومسار الكتابة الإدارية**:
    - توثيق اشتراط المصادقة الصارم `requireStaff()` في `apps/admin`، والفشل المغلق عند غياب الجلسة نحو صفحة الدخول `/login` التزاماً بثابت INV-01.
    - إثبات اكتمال دورة الكتابة 100% عبر أجنحة اختبارات التكامل وخادم الإجراءات ومحرك مخزن الملفات (9/9 فحوصات إجراءات المحتوى، واختبار E2E الشامل لإثبات دورة المحتوى، واختبار E2E الشامل لدورة الفيديوهات).
  * **التوثيق النهائي وجاهزية النشر**:
    - دليل شامل لاختبارات المتصفح وإجراءات الصيانة `docs/phase6-docs-e2e.md`.
    - تحديث مصفوفة الجاهزية `docs/release-readiness.md` بالبوابة السادسة وتحديث أدلة النشر والإدارة و`REVIEW.md` (القسم 19).
  * **إحصائيات الاختبارات وبوابات التحقق**:
    - 452/452 فحص وحدات وتكامل ناجحة 100% في Vitest عبر 32 ملفاً.
    - 4/4 رحلات E2E ناجحة في متصفح Playwright Chromium مع 4 لقطات شاشة.
    - اجتياز بوابات التحقق العشر كاملة G1 إلى G10 بنجاح 100% وتوثيقها في `.scratch/phase6-gates/`.

## يعمل الآن (Phase 5 Hardening — 100% Complete & Verified)
- [x] **إتمام مرحلة التقسية وتأمين بيئة الإنتاج والبريد الفعلي وسجل التدقيق (Phase 5 Hardening)**:
  - **البريد الإلكتروني الفعلي عبر Resend (بدون SDK)**:
    * تنفيذ `ResendMailer` عبر `fetch` المبني في Node 20+، مع الالتزام الصارم بدلالات التسليم الصادقة (Honest Delivery Semantics) دون وعود كاذبة.
    * تسجيل محاولة الإرسال بدقة في سجل التدقيق `audit_log` كملاحظة تدقيق على المشترك تحت الفاعل `"نظام إرسال البريد (Resend)"`.
    * دعم التفرع الصادق في واجهة ونصوص صفحة الاشتراك العامة `/subscribe` بناءً على تفعيل الخدمة الفعلي.
    * توحيد الواجهة البرمجية بحذف ملفات إعادة التصدير المكررة في `apps/web/src/lib/notify/`.
    * الالتزام: `1b29ec2 feat(data-access): resend mailer via built-in fetch`.
  - **صلابة قاعدة بيانات الإنتاج (`readOrSeed`)**:
    * قاعدة حاسمة تمنع تقديم بيانات seed الوهمية على الموقع الحي عند حدوث عطل في قاعدة البيانات أو خطأ في الاتصال.
    * رمي خطأ فوري وصريح في بيئة الإنتاج عند فشل الاستعلام أو فراغ النتائج غير المتوقع، مع الحفاظ على إمكانية بناء الموقع الساكن بدون متغيرات بيئة.
    * الالتزام: `19dcec5 fix(data-access): fail loudly instead of seeding in production`.
  - **تطوير تجربة سجل التدقيق وتصدير CSV (Deeper Audit Trail UX)**:
    * دعم تصفية السجل حسب المنفّذ (الفاعل) `actor` بالاسم والمعرّف عبر محرك الملفات ومحرك Supabase PostgreSQL.
    * تصدير السجل إلى ملف CSV متوافق مع معيار RFC-4180 ومسبوق بعلامة UTF-8 BOM (`\uFEFF`) لضمان فتح النصوص العربية بدقة في Excel.
    * مسار تنزيل مباشر `/api/audit/export` وإجراء خادمي `exportAuditCsvAction` محكمين بالصلاحيات الإدارية.
    * الالتزامات: `a71a1ce feat(data-access): audit actor filter and csv export`، و`e13f9de feat(admin): audit actor filter and csv download`.
  - **التوثيق وإرشادات الإدارة والنسخ الاحتياطي**:
    * اعتماد القرار المعماري ADR-0005 برفض وظائف cron داخل التطبيق السحابي وتحديد المسارين الرسميين (النسخ المدار PITR، والدليل اليدوي الخارجي).
    * تحديث وثائق `backup-restore.md` و`runbook.md` و`credential-handover.md`.
    * دليل إعداد البريد بالعربية `docs/email-setup-guide.md` وملخص المرحلة `docs/phase5-hardening.md`.
  - **أجنحة الاختبارات وبوابات التحقق**:
    * 32 ملف اختبار و**452/452 فحصاً ناجحاً بنسبة 100% (Green)** في Vitest (+44 فحصاً جديداً)، واجتياز كامل لبوابات التحقق G1 إلى G10 وسكربت الدخان الحي `live-email-smoke.sh`.

## يعمل الآن (Phase 4 Parish Videos — 100% Complete & Verified)
- [x] **إتمام إدارة وعرض فيديوهات الكنيسة عبر الروابط الخارجية الآمنة (Parish Videos)**:
  - **حزمة النطاق `@church-site/domain`**:
    * نماذج `ParishVideo` و`VideoProvider` و`CreateParishVideoInput` و`UpdateParishVideoInput` والنموذج العام المعزول `PublicParishVideo`.
    * الصلاحيات الإدارية: `videos:read` (لجميع الخدام)، `videos:write` (للسكرتارية والمشرفين)، `videos:delete` (حصراً للمشرف العام/Owner).
    * كيان التدقيق الجديد `video` في `AuditEntityType` مع التسميات العربية.
    * الالتزام: `0c79601 feat(domain): parish videos model and capability`.
  - **قاعدة البيانات وهجرات Supabase**:
    * إضافة الهجرة 14 `supabase/migrations/20260916140000_parish_videos.sql` لإنشاء جدول `parish_videos` ونوع `video_provider_enum`.
    * فهرس الفرز والعرض العام `idx_parish_videos_public_active` وسياسات RLS المحكمة.
    * تحديث توثيق جدول الهجرات في `supabase/README.md` (14 صفاً).
    * الالتزام: `2a7a385 chore(db): parish videos schema and rls`.
  - **حزمة الوصول للبيانات `@church-site/data-access`**:
    * محرك التحقق وتوحيد الروابط `normalizeVideoUrl()` المحمي ببوابة `TRUSTED_EMBED_HOSTS`.
    * عقد المستودع `ParishVideoRepository` ومحول مخزن الملفات `JsonParishVideoRepository` ومحول `SupabaseParishVideoRepository`.
    * ترقية مخزن الملفات إلى الإصدار 4 بإضافة مصفوفة `parishVideos`.
    * وسم إعادة التحقق `REVALIDATION_TAGS.parishVideos` ودالة `revalidateVideoSurfaces()`.
    * دالة القراءة العامة المعزولة `getPublicParishVideos()`.
    * الالتزام: `181d0e0 feat(data-access): parish videos repository and URL normalization`.
  - **تطبيق الإدارة `apps/admin`**:
    * صفحة الإدارة الرئيسية `/admin/videos`، وجدول الفيديوهات `AdminVideosTable` مع تبديل النشر والتفعيل الفوري.
    * نافذة الإضافة والتعديل `AdminVideoModal` مع فحص الروابط الحي ومعاينة المشغل المباشرة.
    * إجراءات الخادم `admin-video-actions.ts` مع فحص دقيق للصلاحيات والتسجيل في سجل التدقيق.
    * إضافة الرابط إلى القائمة الجانبية مع أيقونة الفيديو.
    * الالتزام: `4453e4a feat(admin): parish videos manager`.
  - **تطبيق الموقع العام `apps/web`**:
    * مكون قسم الفيديوهات `ChurchVideosSection.tsx` المحمي ببوابة `getTrustedEmbedUrl()`.
    * دمج القسم في صفحة "عن الكنيسة" `/about` مع المحافظة التامة على ثوابت INV-01 وبناء الويب بصفر متغيرات بيئة (53/53 مساراً ثابتاً).
    * معالجة أنيقة لحالة خلو الفيديوهات "لا توجد فيديوهات منشورة بعد".
    * الالتزام: `b2fb703 feat(web): church videos section`.
  - **أجنحة الاختبارات وبوابات التحقق**:
    * 26 ملف اختبار و**408/408 فحصاً ناجحاً بنسبة 100% (Green)** في Vitest (+46 فحصاً جديداً).
    * الالتزام: `c2447bd test: cover parish videos`.
    * اجتياز كامل لبوابات التحقق العشر G1–G10 وحفظ الأدلة في `.scratch/phase4-gates/`.

## يعمل الآن (Phase 3 Content Types Engine — 100% Complete & Verified)
- [x] **إتمام محرك أنواع المحتوى المخصص ونظام التوليد الديناميكي (CMS Engine)**:
  - **حزمة النطاق `@church-site/domain`**:
    * نماذج `ContentType` و`ContentField` و`ContentEntry` ونموذج القوالب `LayoutTemplate`.
    * محرك التحقق الديناميكي `validateContentEntryData(fields, data)`.
    * تحديث مصفوفة الصلاحيات بالقدرات الست: `content:read`، `content:create`، `content:update`، `content:delete`، `content:publish`، `content:manage`.
    * الالتزام: `563acf5 feat(domain): content types model and capabilities`.
  - **قاعدة البيانات وهجرات Supabase**:
    * إضافة الهجرة 13 `supabase/migrations/20260916130000_content_types.sql` لإنشاء جداول `content_types` و`content_fields` و`content_entries`.
    * فهارس GIN وفهارس المفاتيح الفريدة المركبة، وسياسات RLS للقراءة العامة والكتابة الإدارية.
    * الالتزام: `1905865 chore(db): content types schema and rls`.
  - **حزمة الوصول للبيانات `@church-site/data-access`**:
    * عقد المستودع `ContentTypeRepository` ومحول `JsonStoreContentTypeRepository` ومحول `SupabaseContentTypeRepository`.
    * ترقية مخزن الملفات `.data/church-store.json` إلى الإصدار 3 مع الحفاظ على التوافق الرجعي.
    * مطهر HTML الغني الآمن بقائمة السماح في `@church-site/data-access/client`.
    * الالتزامات: `8ef796e feat(data-access): content type repository and runtime schema`، و`ebb0e61 fix(data-access): export dynamic-validator from client entrypoint`.
  - **تطبيق الإدارة `apps/admin`**:
    * إدارة نماذج المحتوى `/content-types`، وتصميم الحقول المخصصة `/content-types/[id]/fields`.
    * تحرير وإدارة المشاركات `/content/[type]`، ومحرر النصوص الغني `RichTextEditor`، واستمارة الإدخال الديناميكية `DynamicEntryForm`.
    * إجراءات خادمية مؤمنة في `content-type-actions.ts` و`content-entry-actions.ts`.
    * الالتزامات: `4427e1f feat(admin): content types manager`، و`3f0ee20 feat(admin): dynamic content editor`، و`855478c test(admin): fix type narrowing in content actions test`.
  - **تطبيق الموقع العام `apps/web`**:
    * مسارات العرض العامة `/content/[type]` و`/content/[type]/[slug]` مع قوالب `default` و`article` و`index`.
    * تراجع ذكي في `generateStaticParams` لضمان البناء بصفر متغيرات بيئة (53/53 مساراً ثابتاً).
    * عزل كامل لثابت INV-01: صفر إجراءات كتابة أو استيرادات عملاء قاعدة بيانات في تطبيق الويب.
    * الالتزامات: `e316b56 feat(web): generic content routes and templates`، و`e897c98 fix(web): ensure INV-01 isolation regex passes`.
  - **أجنحة الاختبارات وبوابات التحقق**:
    * 21 ملف اختبار و**362/362 فحصاً ناجحاً بنسبة 100%** في Vitest (+44 فحصاً جديداً).
    * الالتزام: `620c1e0 test: cover content engine`.
    * **بوابة G6 للتحقق من محرك المحتوى (Gate G6 Live Verified — 100% PASS)**:
      - **محلياً (File Store)**: اختبار دورة كاملة للمحرك بنجاح 100% (إنشاء النوع، إضافة الحقول، التحقق من الصحة، نشر المشاركة، والاستعلام العام) موثق في `.scratch/phase3-gates/g6-content.txt` و`g6-label.txt`.
      - **حياً على Supabase (`mlprvcgbwwihnjyvyawm`)**:
        * تطبيق الهجرة 13 (`20260916130000_content_types.sql`) بنجاح عبر `supabase db push` وتجهيز جداول `content_types` و`content_fields` و`content_entries` وسياسات RLS.
        * تشغيل فحص الدخان الحي `live-content-smoke.ps1` واجتيازه بنجاح 100%: إنشاء نوع تجريبي (`g6-smoke-live`)، وإضافة 3 حقول ديناميكية، وإنشاء مسودة وتأكيد حجبها عن القارئ العام (INV-01 Zero-Leakage)، ونشر المشاركة وتأكيد قراءتها العامة بنجاح، وتحديث الحقول وتأكيد انعكاس التعديل، وحذف كامل للسجلات التجريبية وتأكيد خلو القاعدة التام منها.
        * حفظ كامل الأدلة الحية في `.scratch/phase3-gates/live/`: `live-conclusion.txt` (PASS)، `live-env.txt`، `live-flow.txt`، `live-cleanup.txt`.

## يعمل الآن (Phase 2 Media Upload & Supabase Storage — 100% Verified)
- [x] **إتمام منظومة رفع وتخزين الوسائط الرقمية والحفاظ على ثوابت عدم المصادقة**:
  - **حزمة النطاق `@church-site/domain`**:
    * إضافة حقلي `storage_path` و`checksum` لنموذج `MediaRecord`.
    * الالتزام: `c0e1c91 feat(domain): add storage fields to media model`.
  - **حزمة الوصول للبيانات `@church-site/data-access`**:
    * واجهة `MediaStorage` ومحول الإنتاج `SupabaseMediaStorage` ومحول الاختبارات والعمل دون إنترنت `FileMediaStorage` في `packages/data-access/src/storage/index.ts`.
    * حساب تجزئة SHA-256، وتوليد مسارات مقسمة بالعام/الشهر `YYYY/MM/<uuid>.<ext>`.
    * الالتزام: `a4458b8 feat(data-access): add MediaStorage adapter`.
  - **قاعدة البيانات وهجرات Supabase**:
    * إضافة الهجرة الثانية عشرة `supabase/migrations/20260916120000_media_storage.sql` لإنشاء الحاوية `media` وضبط سياسات RLS على `storage.objects` (قراءة عامة، وإضافة/تعديل/حذف للطاقم الإداري).
    * الالتزام: `a7ff1fb chore(db): add media storage bucket and policies`.
  - **تطبيق الإدارة `apps/admin`**:
    * إجراء خادمي مؤمن `uploadMediaAction` يفحص الصلاحيات ويدقق الأنواع والأحجام حتى 50MB.
    * واجهة تفاعلية `MediaUploader.tsx` تدعم السحب والإفلات ومعاينة الصور وشارات التخزين السحابي والخارجي.
    * الالتزام: `55152be feat(admin): real media upload action and uploader`.
  - **تطبيق الموقع العام `apps/web`**:
    * عرض الوسائط الحقيقية المرفوعة في `/gallery` باستخدام روابط HTTP العامة ومكون `<Image unoptimized />` دون أي اعتماديات تخزين داخل تطبيق الويب (INV-01).
    * الالتزام: `fc3d752 feat(web): render real uploaded media in gallery`.
  - **أجنحة الاختبارات وبوابات التحقق**:
    * 16 ملف اختبار و**318/318 فحصاً ناجحاً بنسبة 100%** في Vitest.
    * الالتزام: `5ffa1f3 test: cover media upload pipeline`.
    * نجاح كامل لجميع بوابات التحقق G1 إلى G9 وتوثيق الأدلة في `.scratch/phase2-gates/`.
    * **بوابة G6 الحية (Gate G6 Live Verified — 100% PASS)**:
      - اختبار حي شامل على مشروع Supabase الإنتاجي `mlprvcgbwwihnjyvyawm` باستخدام مفتاح الدور الخدمي والعميل الرسمي.
      - دفع الهجرة 12 (`20260916120000_media_storage.sql`) بنجاح وتجهيز حاوية `media` العامة وسياسات RLS للكتابة الإدارية.
      - دورة رفع حية ناجحة (HTTP 200) لملف تجريبي (68 بايت) مع تطابق تام لبصمة التجزئة SHA-256 (`63ef318d96b5d0d0ceba6e04a4e622b1158335cdc67c49e27839132c6f655058`).
      - دورة حذف حية ناجحة (HTTP 200) مع التحقق من نفي الوجود اللاحق واسترجاع HTTP 404 (NoSuchKey).
      - حفظ أدلة الإثبات الحية في `.scratch/phase2-gates/live/`:
        * `live-conclusion.txt`: إقرار النجاح النهائي (`G6 LIVE SMOKE: PASS`).
        * `live-upload.txt`: تفاصيل الرفع والتنزيل وتطابق SHA-256.
        * `live-delete.txt`: تفاصيل الحذف واستجابة 404 NoSuchKey.
        * `live-env.txt`: فحص سلامة المتغيرات البيئية وتطهير الأسرار.
    * **اعتماد واختتام المرحلة الثانية بالكامل (Phase 2 Fully Complete — 100% Sign-off)**.

## يعمل الآن (Phase 1 Monorepo Split — 100% Pushed & Verified)
- [x] **إتمام الفصل المعماري لـ Monorepo ورفع الالتزامات العشرة إلى GitHub (`origin/master`)**:
  - **التطبيقات المنفصلة**:
    * `apps/web`: بوابة المخدومين العامة، صفر مصادقة (INV-01)، ثابت أولاً، بناء بصفر متغيرات بيئة (50/50 مساراً نظيفاً)، تراجع تلقائي للبذرة ومخزن JSON.
    * `apps/admin`: لوحة تحكم السكرتارية والكهنة، منفذ 3001 محلياً / نطاق فرعي في الإنتاج، كوكيز جلسات مستقلة عبر `@supabase/ssr`، وعزل أعطال كامل عن الموقع العام (12 مساراً إدارياً).
  - **حزم مساحة العمل المشتركة**:
    * `packages/domain` (`@church-site/domain`): النماذج ومحرك التكرار وقواعد التحقق وأنواع Supabase.
    * `packages/data-access` (`@church-site/data-access`): طبقة الوصول للبيانات والعملاء ومحركا التخزين ونقطة دخول العميل الآمنة.
    * `packages/ui` (`@church-site/ui`): مكونات التصميم المشتركة وأدوات المساعدة ونظام التدويل.
  - **سلسلة الالتزامات العشرة المرفوعة (`48c743b..7cd5a20`)**:
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
  - **محاسبة المسارات (Route Accounting)**: 50 مساراً عاماً ثابتة في `apps/web` + 12 مساراً إدارياً في `apps/admin` = 100% حفظ لكافة المسارات بدون أي فقدان.
  - **بوابات التحقق الصلبة المعاد تشغيلها مباشرة (Direct G1–G9 Verification)**:
    * G1: فحص الأنواع لكلا التطبيقين `pnpm --filter web typecheck` و`admin typecheck` = 0 أخطاء (2026-09-17 18:11-18:12).
    * G2: فحص الأسلوب `pnpm run lint` = 0 أخطاء (2026-09-17 18:12).
    * G3: اختبارات الوحدات `pnpm test` = 12 ملفاً، **274/274 فحصاً ناجحاً بنسبة 100%** (2026-09-17 18:13).
    * G4: بناء الويب بصفر متغيرات بيئة `pnpm --filter web build` = **50/50 مساراً نظيفاً** (2026-09-17 18:15).
    * G5: بناء الإدارة `pnpm --filter admin build` = نظيف (2026-09-17 18:17).
    * G6: إثبات عزل الأعطال موثَّق على مخزن الملفات؛ Supabase الحية معلَّقة لحين توفير بيانات الاعتماد.
    * G7: تتبع تاريخ `git mv` مؤكد عبر `git log --follow`.
    * G8: ثبات هجرات قاعدة البيانات `supabase/migrations/` بنسبة 100% دون أي تعديل.
    * G9: صفر تسريب عبر مخرجات grep الخام في `g9-rg-web.txt` و`g9-imports-admin.txt`.
  - **التوثيق ودليل المراجعة**:
    * قائمة التحقق للمراجع الخارجي في `REVIEW.md`.
    * تسجيل القرار في `docs/adr/0002-monorepo-admin-split.md`.
    * دليل النشر في `docs/deployment-split.md`.
    * تحديث دليل الإدارة في `docs/admin-guide.md`.

## يعمل الآن (Phase 1 Monorepo Split — Step 4c: UI Extraction)
- [x] **استخراج حزمة واجهات المستخدم والتدويل `@church-site/ui` (packages/ui)**:
  - هيكلة الحزمة وتجهيز `package.json` و`tsconfig.json`.
  - نقل مكونات واجهة المستخدم الأساسية: `Badge.tsx`, `Button.tsx`, `Card.tsx`, `FontSizeSwitcher.tsx`, `Skeleton.tsx`.
  - نقل أدوات المساعدة `cn` في `lib/utils.ts` ومنظومة التدويل `lib/i18n/` (`locales.ts`, `localized.ts`, `messages.ts`, `dom.ts`, `server.ts`).
  - توفير إعادة تصدير دقيقة وموجهة داخل `apps/web/src/components/ui/` و`apps/web/src/lib/utils.ts` و`apps/web/src/lib/i18n/`.
  - نجاح بوابات التحقق: `pnpm --filter @church-site/ui typecheck` (0 errors), `pnpm typecheck` (0 errors), `pnpm lint` (0 errors), `pnpm test` (274/274 passed).
  - الالتزام: `chore(packages): extract ui`.

## يعمل الآن (Phase 1 Monorepo Split — Step 4b: Data Access Extraction)
- [x] **استخراج حزمة الوصول إلى البيانات `@church-site/data-access` (packages/data-access)**:
  - هيكلة الحزمة بالكامل وتجهيز `package.json` و`tsconfig.json`.
  - نقل طبقات البيانات: `store/` و`supabase/` و`queries.ts` و`tags.ts` و`env.ts` و`notify/` و`events/` وتوابعها.
  - إعداد إعادة التصدير المعزولة في `apps/web/src/lib/` لمنع تسريب شفرة الخادم إلى مكونات العميل.
  - نجاح بوابات التحقق: `pnpm typecheck` (0 errors), `pnpm lint` (0 errors), `pnpm test` (274/274 passed), `pnpm --filter web build` (51/51 routes clean).
  - الالتزام: `49445da chore(packages): extract data-access`.

## يعمل الآن (Phase 1 Monorepo Split — Step 4a: Domain Package Extraction)
- [x] **استخراج حزمة النطاق `@church-site/domain` (packages/domain)**:
  - الالتزام: `2597889 chore(packages): extract domain`.

## يعمل الآن (Comprehensive UI & Action Testing Deliverable — Vitest + RTL + JSDOM)
- [x] **جناح اختبارات واجهات المستخدم وإجراءات الخادم (12 ملف اختبار و274 فحصاً ناجحاً بنسبة 100% Green)**:
  - الاعتماد على Vitest + `@testing-library/react` + `jsdom`.
  - **أجنحة اختبارات مكونات الواجهة (UI Component Suites)**:
    - `src/components/home/__tests__/NewVisitorWelcome.test.tsx`: اختبارات الترحيب بالزوار، مزمور 5: 7، روابط القداسات والتواصل والكهنة والمذابح، وصندوق الإرشادات والوقار الطقسي.
    - `src/components/home/__tests__/PatronSaintsSection.test.tsx`: اختبارات شفعاء الكنيسة الأطهار (مكسيموس ودوماديوس، الأنبا موسى الأسود)، أعياد الاستشهاد والتنيح، الأقوال والفضائل، شارات التدشين وروابط السير.
    - `src/components/home/__tests__/SanctuaryAltarsShowcase.test.tsx`: اختبارات المذابح الثلاثة المدشنة (الأوسط، البحري، القبلي)، شارات التدشين بالميرون، وبطاقة شرح القانون الطقسي بعدم تكرار الذبيحة.
    - `src/components/ui/__tests__/Skeleton.test.tsx`: اختبارات الوصولية والهياكل الوميضية (INV-FEEDBACK-ANIMATION، `role="status"`، `aria-label="جاري التحميل..."`، وهياكل بطاقة القداس والفعالية والجدول).
  - **أجنحة اختبارات إجراءات الخادم والأمان (Server Actions & Domain Testing)**:
    - `src/actions/__tests__/admin-mass-actions.test.ts`: اختبارات إجراءات إدارة القداسات والتحقق من صحة المدخلات بمخطط Zod وضوابط الأمان والصلاحيات.
    - `src/lib/domain/__tests__/capabilities.test.ts`: توسيع اختبارات مصفوفة القدرات (120 اختباراً) لتشمل قدرات القداسات `mass:*`.
- [x] **بوابات التحقق الكاملة (Full Verification Gates)**:
  - `pnpm exec tsc --noEmit` = خروج 0 (0 أخطاء).
  - `pnpm test` = 12 ملف اختبار، 274/274 فحصاً ناجحاً بنسبة 100% (Green).
  - `pnpm run build` = خروج 0، توليد 51/51 مساراً بنجاح نظيف (Clean routes).

## يعمل الآن (Divine Liturgies & Masses Management — Authenticated & Role-Gated)
- [x] **تحديث منظومة القدرات الأمنية `src/lib/domain/capabilities.ts` & `src/lib/domain/types.ts`**:
  - إضافة `mass:read` إلى `READ_ONLY_CAPABILITIES`.
  - إضافة `mass:create` و`mass:update` و`mass:toggle` إلى `EDITOR_CAPABILITIES`.
  - إضافة `mass:delete` إلى `OWNER_ONLY_CAPABILITIES` (قصر الحذف على مسؤول النظام فقط).
  - إضافة تصنيف `mass` في `AuditEntityType` وتسميات التدقيق العربية.
- [x] **إجراءات الخادم الإدارية `src/actions/admin-mass-actions.ts`**:
  - `createMassAction`: إنشاء قداس مع فحص صلاحية `mass:create`.
  - `updateMassAction`: تعديل قداس مع فحص صلاحية `mass:update`.
  - `toggleMassStatusAction`: تبديل حالة التفعيل مع فحص `mass:toggle`.
  - `deleteMassAction`: حذف نهائي مع قصر الصلاحية على `mass:delete` للمالك.
  - الفحص المزدوج للأمان: `requireStaff()` + `can(adminRoleFromStaffRole(session.role), capability)`.
  - التحقق من البيانات عبر `WeeklyMassInputSchema` (Zod).
  - التحديث الآمن وإعادة التحقق `revalidateTag(REVALIDATION_TAGS.masses)`.
- [x] **مكونات الواجهة الإدارية `AdminMassModal.tsx` و`AdminMassesTable.tsx`**:
  - نافذة `AdminMassModal`: إنشاء وتعديل كامل لكافة الحقول مع مؤشر حفظ وتنبيهات أخطاء.
  - جدول `AdminMassesTable`: إزالة لافتة العرض فقط، زر «إضافة قداس جديد»، أزرار تعديل وحذف، تبديل تفاعلي للحالة، وتحديثات تفاؤلية.
- [x] **الاختبارات وبوابات التحقق**:
  - `src/actions/__tests__/admin-mass-actions.test.ts`: اختبار المخطط والتحقق الأمني.
  - `src/lib/domain/__tests__/capabilities.test.ts`: تحديث مصفوفة القدرات (120 اختباراً).
  - `pnpm exec tsc --noEmit` = خروج 0 (0 أخطاء).
  - `pnpm test` = 8 ملفات، 253/253 فحصاً ناجحاً بنسبة 100%.
  - `pnpm run build` = توليد 51/51 مساراً بنجاح.

## يعمل الآن (Instant Streaming Loading Feedback & CLS Elimination)
- [x] **المكون الأساسي والمركبات `src/components/ui/Skeleton.tsx`**:
  - `Skeleton`: مكوّن أساسي مدعوم بالوصولية (`role="status"`, `aria-label="جاري التحميل..."`).
  - `MassCardSkeleton`: تطابق دقيق لبطاقة القداس (شارة اليوم، شارة المذبح، الفترة، العنوان، الوقت، الشماس/الكاهن، والمؤشر القبطي).
  - `EventCardSkeleton`: هيكل بطاقة الفعالية (صورة البانر، شارات الحالة والتاريخ، العنوان، ونقاط الزمان والمكان).
  - `TableSkeleton`: هيكل الجداول بصفوف وأعمدة مع رأس جدول وميضي.
- [x] **هياكل التحميل اللحظية لمسارات Next.js 15 App Router**:
  - `src/app/loading.tsx`: هيكل الصفحة الرئيسية (الهيرو، بطاقة العد التنازلي للقداس، و4 بطاقات خدمات سريعة).
  - `src/app/masses/loading.tsx`: هيكل القداسات (رأس الصفحة، أزرار الأيام الـ 7، مدخلات الفلترة، و3 بطاقات قداس).
  - `src/app/events/loading.tsx`: هيكل الفعاليات (رأس الصفحة، تبويبات التصنيفات، و4 بطاقات فعاليات متجاوبة).
  - `src/app/about/loading.tsx`: هيكل عن الكنيسة (الهيرو، شريط التبويبات، بطاقات التعريف، وإحصائيات الكنيسة).
  - `src/app/bible/loading.tsx`: هيكل قارئ الكتاب المقدس (فهرس الأسفار، محدد الأصحاح، وفقرات الآيات).
  - `src/app/admin/(protected)/loading.tsx`: هيكل الإدارة المحمية (الترويسة، 4 بطاقات إحصائيات، الأزرار السريعة، وهيكل جدول البيانات).
- [x] **بوابات التحقق الكاملة**:
  - `pnpm exec tsc --noEmit` خروج 0 (0 أخطاء).
  - `pnpm test` (Vitest): 7 ملفات و226/226 فحصاً ناجحاً 100%.
  - `pnpm run build`: خروج 0، وتوليد 51/51 صفحة بنجاح كامل بدون أي أخطاء هيدريشن أو شذوذ أبعاد.

## يعمل الآن (Welcoming Parish Identity & Micro-Animations — INV-IDENTITY-WARMTH & INV-FEEDBACK-ANIMATION)
- [x] **مكون الترحيب بالزوار الجدد `src/components/home/NewVisitorWelcome.tsx`**:
  - عنوان ترحيبي عائلي («أول مرة تزور كنيستنا؟») مع عنوان فرعي توجيهي.
  - آية المزمور بخط ليتورجي أصيل: «أَمَّا أَنَا فَبِكَثْرَةِ رَحْمَتِكَ أَدْخُلُ بَيْتَكَ. أَسْجُدُ فِي هَيْكَلِ قُدْسِكَ بِخَوْفِكَ» (مزمور 5: 7).
  - 4 بطاقات بصرية تفاعلية سهلة الوصول (القداسات `/masses`، الموقع `/contact`، الآباء الكهنة `/about/clergy`، الشفعاء `/about/altars`).
  - صندوق إرشادات ووقار لحضور الصلوات الأرثوذكسية والقداسات الإلهية بسلام وخشوع.
- [x] **مكون شفعاء الكنيسة الأطهار `src/components/home/PatronSaintsSection.tsx`**:
  - إبراز القديسين مكسيموس ودوماديوس (17 طوبة) والشهيد الأنبا موسى الأسود (24 بؤونة).
  - بطاقات سير وتأملات وفضائل روحية وأقوال ذهبية وشارات مضيئة وروابط السير وتاريخ التدشين.
- [x] **مكون المذابح الثلاثة المدشنة `src/components/home/SanctuaryAltarsShowcase.tsx`**:
  - عرض المذبح الأوسط (العذراء ومكسيموس ودوماديوس)، البحري (مارجرجس)، القبلي (الأنبا موسى).
  - إبراز التدشين بالميرون وتفاصيل الاستخدام الطقسي وقانون عدم تكرار الذبيحة على المذبح في اليوم نفسه.
- [x] **الدمج في تدفق الصفحة الرئيسية `src/app/page.tsx`**:
  - تكامل متسق بين شريط الهيرو وعدّاد القداس وخدمات الوصول السريع وكلمة الكهنة والآية والأخبار.
- [x] **حركات وميكرو-أنيميشن دقيقة وتوافق كامل لتقليل الحركة**:
  - إضافات `tailwind.config.ts` و`src/app/globals.css`: `animate-fade-in`, `animate-slide-up`, `animate-gold-glow`.
  - احترام تام لـ `@media (prefers-reduced-motion: reduce)` بتعطيل تام للحركات والانتقالات بنسبة 100%.

## يعمل الآن (Supabase Production Database — Project mlprvcgbwwihnjyvyawm)
- [x] ربط المشروع البعيد `mlprvcgbwwihnjyvyawm` عبر Supabase CLI.
- [x] تطبيق كافة الهجرات الـ 12 (`supabase db push`) بنجاح كامل (شاملة الهجرة 12 لمساحة التخزين وحاوية `media`).
- [x] اجتياز بوابة التحقق الحي G6 لمنظومة التخزين بنسبة 100% وتوثيق الأدلة في `.scratch/phase2-gates/live/`.
- [x] التحقق الميداني المباشر من مطابقة إحصائيات قاعدة البيانات:
  - 29 جدولاً في المخطط العام `public`.
  - 56 سياسة أمنية (RLS Policies).
  - 29 جدولاً مفعّلاً عليها RLS (100% تغطية أمنية).
  - 15 نوعاً مخصصاً (ENUMs).
  - كافة القيود والفهارس الفريدة (`condolence_bookings_booking_reference_code_key`, `subscribers_email_key`, `uq_event_exception_occurrence`, `uq_taxonomy_term_dimension_slug`, `uq_condolence_active_date`).
- [x] توليد ملف `.env.local` يحتوي على مفاتيح المشروع (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
- [x] إنشاء ملف `.env.example` كقالب استرشادي آمن وتتبع في git.
- [x] إضافة `supabase/.temp/` إلى `.gitignore`.
- [x] استعلام اختباري ناجح للمشروع البعيد عبر `@supabase/supabase-js` يعيد `200 OK`.

## يعمل الآن (GitHub Remote Repository)
- [x] تم إنشاء المستودع الخاص `Kerollosmm/church-site` على GitHub وربطه بـ `origin`
- [x] تم استبعاد `goal-container/` في `.gitignore` وتثبيت الحفظ
- [x] تم رفع الفرع `master` بنجاح وتعيينه ليتتبع `origin/master` (شجرة العمل نظيفة تماماً)

## يعمل الآن (Vitest Unit Test Suite & CI Gate — Commit 9aa0be9)
- [x] **جناح اختبارات Vitest 5.0.1 مكتمل**: 7 ملفات اختبارات و226 فحصاً ناجحاً بنسبة 100% في 2.92 ثانية:
  - `src/lib/domain/__tests__/capabilities.test.ts` (105 اختبارات): مصفوفة القدرات للأدوار الثلاثة (`owner`, `editor`, `viewer`)، رسائل الرفض، دالة `can()` النقية.
  - `src/lib/domain/__tests__/recurrence.test.ts` (23 اختباراً): توسيع السلاسل، التوقيت القاهري، استثناءات الإلغاء والنقل، حد النافذة القصوى 731 يوماً.
  - `src/lib/store/__tests__/json-driver.test.ts` (23 اختباراً): المستودع الملفي الذري المعزول، التهيئة بالبذرة، تسلسل التعديلات، عدم تكرار السلَج، وسجل التدقيق.
  - `src/lib/events/__tests__/filters.test.ts` (26 اختباراً): تصفية الفعاليات حسب الحالة، الأبعاد الستة للتصنيف، النافذة الزمنية، والتواريخ.
  - `src/lib/events/__tests__/ics.test.ts` (19 اختباراً): توليد تقاويم iCalendar (.ics) بمعايير RFC 5545 والمناطق الزمنية.
  - `src/lib/domain/__tests__/subscribers.test.ts` (17 اختباراً): تطبيع البريد الإلكتروني، حل وتجميع التصنيفات، وعدمية تكرار المشتركين.
  - `src/lib/utils/__tests__/coptic-date.test.ts` (13 اختباراً): عهد التقويم القبطي (1825030) وتحويلات تواريخ الأعياد والمواسم.
- [x] **بوابة CI الصلبة في `.github/workflows/ci.yml`**: أُضيف `pnpm test` كبوابة صلبة إلزامية ثالثة إلى جانب `tsc --noEmit` و`pnpm run build` بعد حارس منع تسرب متغيرات البيئة.

## يعمل الآن (Goal Brief v1.0 & Auto-Coder Delivery Integration)
- [x] اعتماد وثيقة موجز الهدف المجمدة v1.0 وتوأمها الآلي (`goal-brief-church-site-2026-09-16.md`, `.json`, `.html`) من تسليم `auto-coder`.
- [x] تشغيل سكربت التحقق الآلي `goal-brief-church-site-verify.ps1` واجتياز كافة الفحوصات بنجاح (`RESULT: PASS (all checks green)`).
- [x] تتبع ومطابقة معايير القبول الـ 16 (6 محققة ومثبتة، 5 جزئية، 5 فجوات مفتوحة محددة بدقة مع افتراضات آمنة).
- [x] حل وتصحيح التناقضات الستة بين وثائق التسليم السابقة وحالة المستودع الحقيقية.

## يعمل الآن (Public Page Gaps — `/about` + `/gallery` + `/sermons` + `/privacy`)
- [x] `/about`: فهرس قسم «عن الكنيسة» (كان 404) — مقدمة الكنيسة بلغتين، وبيانات العنوان (من `PARISH_ADDRESS_AR`) والإيبارشية، و**أرقام محسوبة من بيانات الكنيسة نفسها** (مذابح، كهنة، تخصصات المستوصف، اجتماعات، أنشطة، مدارس) بحذف أي بطاقة قيمتها صفر، وبطاقات واضحة للصفحات الثلاث + قائمة للصفحتين الجديدتين
- [x] `/gallery`: يعرض **الوسائط العامة فقط** عبر قارئ عام جديد `getPublicGalleryMedia()` (فلترة في الاستعلام + نموذج عام يُسقط `uploadedBy`)، وبحالة نائبة **موسومة قابلة للاستبدال** («الصور ستُضاف قريبًا» + السطر بالإنجليزية) حين لا وسائط، وبلا صورة مُختلقة — لا `<img>` ولا `next/image` (المشروع لا يستضيف ملفات صور، و`img-src` في CSP تمنع غير الذاتي)، فالبطاقة تحمل الوصف المسجَّل نصاً + اسم الملف + رابطاً مُتحقَّقاً (https/نسبي فقط)
- [x] `/sermons`: حالة فارغة صريحة («لا يوجد أرشيف عظات منشور بعد» + التسمية بالإنجليزية) بلا اختراع أي عظة، مع «مصادر الكلمة المتاحة الآن»: `/live` و`/bible` و`/masses` و`/events`، وشرائح `FlagBadge` على مصطلحات `event_type` الحية كل واحدة رابط إلى فعاليات ذلك النوع (`buildEventsHref`)
- [x] `/privacy`: ثمانية أقسام بلغتين مطابقة لما يخزّنه التطبيق فعلاً — `contact_messages` و`condolence_bookings` و`program_applications` و`job_applications` و`subscribers` (وكل نوع يحمل اسم جدوله في `data-privacy-table`)، وسجل التدقيق وحدود الكتابة العامة فيه، وما لا يُجمع إطلاقاً (لا اعترافات ولا سجلات مالية/اجتماعية ولا دفع ولا تحليلات)، وكوكي اللغة وTurnstile، وتقليل البيانات والاحتفاظ، والتواصل بشأن البيانات، وشروط مختصرة
- [x] الرسائل: ~70 مفتاح قاموس جديد (عربي + إنجليزي مقيَّد نوعياً)، ونصوص المحتوى الطويلة كأزواج `{ ar, en }` **يُلزم نوعها اللغتين** وتُعرض عبر `localized()`
- [x] الوصول: `/about` أول عنصر في قائمة «عن الكنيسة»، والثلاثة الأخرى في الدرج الجوّال + التذييل (صف `xl` فيه خمسة عشر بنداً فلا يُوسَّع)، ورابط التذييل «عن الكنيسة» صار إلى `/about`، ومسارات التصفح في صفحات `about/*` صارت إلى `/about`
- [x] `sitemap.ts`: أربعة مسارات جديدة (23 مدخلاً ثابتاً)، وفحص آلي أثبت أن **كل** روابط الصفحات الجديدة والتذييل/التنقل وكل مسارات الخريطة تُحَل إلى ملف مسار موجود (0 رابط ميت)
- [x] التحقق: `tsc` خروج 0، `lint` 0/0، `build` بلا بيئة خروج 0 و53/53 والمسارات الأربعة `ƒ`، وتشغيل `next start`: الأربعة 200 مع علامات الحالة الصحيحة في HTML، و**دورة وسائط كاملة** على المخزن الحقيقي (صفّان عامان ظهرا، والصف الداخلي لم يظهر) ثم استعادة ببصمة مطابقة

## يعمل الآن (Subscriptions / Notifications — STEP 4)
- [x] `SubscriberRecord` + قواعد نقية في `src/lib/domain/subscribers.ts` (تطبيع البريد مصدراً واحداً، تطبيع التصنيفات، بُعدا الاشتراك `event_type`/`ministry`، وحلّ السلاجات مع الإبلاغ عن المجهول) — وقيمتان تدقيقيتان جديدتان: `notify` و`subscriber`
- [x] المستودع: `listSubscribers` + `subscribe` (عديم التكرار بعقد: تحديث الصف نفسه وتنشيطه، `created` يخبر أيّهما حدث) + `setSubscriberActive` (بلا حذف) — في المحرّكين، و**حلقة `23505`** في محرك Supabase لسباق التسجيل المتزامن
- [x] محوّل البريد: `Mailer` + `getMailer()` (`MAIL_PROVIDER`، افتراضاً `noop`، وأي اسم مجهول → no-op مع خطأ مسجَّل) + `noopMailer` (يسجّل «would-send» في سجل التدقيق) + `notifyNewSubscription()` — **لا يُرسل أي بريد، والمكتوب يقول ذلك**
- [x] السطح العام: `/subscribe` (خادمي ديناميكي، عربي/إنجليزي، تصنيفات حية) + `SubscribeForm` (عميل، RHF بنفس مخطط الخادم) + `subscribeToEventsAction` (راية → معدل `subscribe:${ip}` → zod → Turnstile → **المستودع**) + دعوة للاشتراك في `/events`
- [x] راية الإطفاء `EVENTS_SUBSCRIPTIONS_ENABLED` (افتراضاً مفعّلة؛ التعطيل يرفض على الخادم ويحوّل الصفحة إلى لافتة تعريفية)
- [x] سطح الإدارة `/admin/subscribers`: قائمة (بما فيها الموقوف) بتصنيفات محلولة، زر إيقاف/إعادة تنشيط محروس بالقدرة، ولافتة «لا يُرسل أي بريد إلكتروني» — وبلا أي زر حذف
- [x] القدرات: `subscribers:read` (كل الأدوار) و`subscribers:write` (المحرر والمالك) + تسمياتها العربية + كيانها التدقيقي، ودمجها في `AdminCapabilities`
- [x] هجرتان (10 و11): `locale_enum` + `subscribers` + `notify` في `audit_action_enum`، وRLS بلا أي وصول عام (لا قراءة ولا إدراج) وبلا سياسة DELETE
- [x] بنك الذاكرة + الوثائق الخمس + تحديث `release-readiness.md` و`supabase/README.md` و`.gitignore` (`/.backups/`)

## يعمل الآن (Operational Handover Pack — docs/)
- [x] `docs/runbook.md`: البيئات الثلاث، جدول المتغيرات بمستهلك كل واحد، قاعدة اختيار المحرك والفرق بين مسار القراءة والمحرك، البناء/التشغيل، تطبيق الهجرات، **دورة النشر الفوري** (`revalidateTag` + `EVENT_SURFACE_PATHS` + الزر اليدوي + ما هو خارج القائمة ولماذا)، مكان `.data/` ونسخه، خطوط السجل، وفحوص الصحة
- [x] `docs/backup-restore.md`: إجراءا المحرّكين بالأوامر، **ودليل تنفيذ فعلي كامل** لنسخ/استعادة مخزن الملفات (بصمة مطابقة + عودة الموقف العام) + تحقق HTTP من بناء يعمل، وجدول «ما اختُبر وما لم يُختبر»، ووصفة نسخ دوري
- [x] `docs/rollback.md`: مصفوفة العرض←السبب، التراجع بالكود/بالنشر/بالبيانات (مع تكلفة البيانات وأمر يعدّها قبل التنفيذ)، سياسة الهجرات forward-only، ومفاتيح إطفاء الميزات، وقسم صريح لما لم يُختبر
- [x] `docs/credential-handover.md`: 12 مفتاحاً (المصدر، المستهلك، عام/سري، دورية التدوير)، خريطة «متغير ← ملف»، خطوات التدوير وأثر كل واحدة، وفحص تحقق بعد التسليم
- [x] `docs/admin-guide.md` + `docs/images/admin/README.md`: دليل عربي غير تقني ببنود التنقل الفعلية و10 عناصر نائبة للصور بأسماء موثّقة وقاعدة «لا بيانات أشخاص حقيقيين في الصور»

## يعمل الآن (Admin Events Surface — STEP 3)
- [x] فهرس الإدارة `/admin/events`: كل الفعاليات (بكل الحالات، والمستقلة وتجاوزات السلاسل) وكل السلاسل المتكررة — عنوان مُعرَّب بـ`localized()`، شارة الحالة، الموعد القادم، المكان، شرائح التصنيفات، آخر تعديل، بحث/تصفية/ترتيب، وأزرار صف: تعديل، نشر/إلغاء نشر، نقل الموعد، نسخ، أرشفة، إلغاء بسبب، حذف بتأكيد مزدوج
- [x] محرر الفعالية `/admin/events/new` و`/admin/events/[id]/edit`: كل حقول النطاق بالعربية والإنجليزية (عنوان/ملخص/وصف)، بداية ونهاية بتوقيت القاهرة (`datetime-local` ⇄ لحظة مطلقة)، علم «طوال اليوم»، المكان، ستة أبعاد تصنيف كمُحدِّدات متعددة، رابط الصورة، مرفقات (اسم/رابط/نوع/حجم)، الحالة — مع حالة انتظار أثناء الإرسال وأخطاء تحت الحقول وربط `aria-invalid`/`aria-describedby`
- [x] السلاسل المتكررة: `/admin/events/series/new` و`/admin/events/series/[id]` (أسبوعي/شهري، الفاصل، أيام الأسبوع أو يوم الشهر، بداية/نهاية، وقت البدء والمدة، المكان والتصنيفات الافتراضية) + **إدارة الاستثناءات**: إلغاء موعد واحد بسبب، نقل موعد واحد إلى تاريخ آخر، والتراجع عن الاستثناء — من قائمة هي توسيع المحرك نفسه (ملغى/منقول ظاهران)
- [x] سجل التدقيق `/admin/audit`: الوقت بتوقيت القاهرة، الفاعل، الإجراء، الكيان، وملخص «قبل ← بعد» عربي مشتق من اللقطة، مع مرشّحات في الرابط (نوع السجل/الإجراء/العدد)، وتمييز سطور **رفض الصلاحية**
- [x] مكتبة الوسائط `/admin/media`: تسجيل بيانات وصفية (اسم/نوع/حجم/رابط/نص بديل عربي وإنجليزي/عام أو داخلي)، رفض الحجم الزائد برسالة تذكر المُدخل والحد، نسخ الرابط، تعديل النص البديل، حذف السجل (مالك فقط)، وربط اختياري بفعالية عبر ضبط `imageUrl` — **بيانات وصفية فقط، بلا رفع بايتات، ومذكور نصاً في الشاشة**
- [x] الواجهة مبنية على القدرة: `resolveAdminCapabilities()` على الخادم و`AdminCapabilities` تُمرَّر للعميل، فالدور الذي لا يملك الإجراء لا يرى زرّه — والحد الفعلي يبقى `requireStaff()` + `can()` في كل إجراء
- [x] الرفض يُسجَّل: قيمة `denied` في `audit_action_enum`/`AuditAction` + `recordAuditNote()` في المستودع (المحرّكين) + نداؤه من `authorize()` قبل إعادة الرفض (بذل وسع)
- [x] الحالات: لا فعاليات/لا سلاسل/لا سجلات/لا وسائط (حالات فارغة بدعوة للإنشاء)، فشل الحفظ (شريط قريب من النموذج بلا نص تقني)، انتهاء الجلسة (`/admin/login?reason=session`)، حساب بلا صلاحية (`reason=role`)، خروج مقصود (`reason=signed-out`)، شاشة إجراء ممنوع، وتعذّر قراءة المخزن
- [x] الغلاف: بنود تنقّل جديدة (الفعاليات، الوسائط، سجل التدقيق)، `LocaleSwitcher` داخل لوحة الإدارة، `dir/lang` من كوكي اللغة على منطقة الإدارة، وعرض دور الفعاليات بجانب اسم المستخدم
- [x] `docs/admin-events-surface.md`: المسارات + مصفوفة الأدوار + تسجيل الرفض + جدول الحالات + محدودية الوسائط + ما لم يُنفَّذ
- [x] بلا اعتماديات جديدة وبلا متغيرات بيئة: `tsc` = خروج 0، `lint` = 0/0، `build` بلا بيئة = خروج 0 و53/53، والمسارات الإدارية السبعة الجديدة كلها `ƒ` و`/admin/login` بقي `○`

## يعمل الآن (Events Core Layer — الخطوة 1)
- [x] نموذج النطاق `src/lib/domain/types.ts` (فعاليات، سلاسل متكررة، استثناءات مواعيد، تصنيف بستة أبعاد، وسائط، سجل تدقيق) + `capabilities.ts` (`owner|editor|viewer` فوق الأدوار القائمة و`can()` نقية) + `recurrence.ts` (محرك توسيع أسبوعي/شهري بمنطقة السلسلة مع إلغاء/نقل موعد واحد)
- [x] مستودع بواجهة واحدة و**محرّكين**: `json` (افتراضي، كتابة ذرّية + تسلسل تعديلات + تهيئة من البذرة، `CHURCH_DATA_DIR` أو `.data/`) و`supabase` (نفس العقد على الجداول الجديدة، بعميل الجلسة أولاً)
- [x] تحويل محتوى البذرة إلى النموذج الجديد: 16 سلسلة أسبوعية (5 قداسات + 11 اجتماعاً) + فعاليتان مؤرختان + 37 مصطلحاً — بالأسماء العربية من صفوف البذرة نفسها، وبلا اختراع مواعيد للأنشطة ذات الجدول النصي
- [x] سجل تدقيق: سطر واحد لكل تعديل بالحالة قبل وبعد وملخّص عربي، من كلا المحرّكين
- [x] إجراءات خادمية محروسة: `requireStaff()` → `can()` → zod → المستودع → `revalidateTag/Path` (ونشر/إلغاء نشر/إلغاء/نقل موعد/نسخ/حذف للمالك فقط/`republishEventsAction` يُعيد `lastUpdatedAt`)
- [x] نواة i18n: `ar` (RTL، افتراضي) و`en` (LTR)، كوكي محفوظ، `localized()` بتراجع مرئي، قاموس واجهة `t()`، و`LocaleSwitcher` (غير مُركَّب بعد)
- [x] هجرتان جديدتان (8 و9) بنظام الفعاليات: 5 أنواع + 7 جداول + فهارس + RLS (قراءة عامة للمنشور، `is_staff()` للكتابة، `audit_log` إضافة فقط) + `database.types.ts` مطابق — **لم تُطبَّق على قاعدة حيّة**
- [x] `.data/` مُهمَل في git، وليست هناك أي اعتمادية npm جديدة

## يعمل الآن (Docs Layer)
- [x] PRD v1.1 (11 اجتماعاً، كانون 46+27، KPI قابلة للقياس)
- [x] IA v1.1 (Next 15، 11 قطاعاً)
- [x] BACKEND v1.1 (أدوار، جداول جديدة، مسار قراءة، إجراءات مُصححة، أمان تشغيلي)
- [x] CONTEXT v1.1 (مذابح، 14 تخصصاً مرتبة، رسوم أعمدة متوافقة)
- [x] AI Prompt v1.1 (بذر مكتمل: 11 اجتماعاً + 5 مدارس + تحذيرات التحقق)
- [x] ADR-0001 + تعديل v1.1 (سجل وسوم، أدوار)
- [x] بنك الذاكرة مهيأ (هذه الملفات)

## يعمل الآن (Build & Runtime Layer)
- [x] هيكل وسقالة المشروع (Next.js 15 App Router, TypeScript 5, Tailwind CSS, `@supabase/ssr`)
- [x] وحدة البيئة الكسولة `src/lib/env.ts` (فشل مغلق، لا قراءة عند الاستيراد) + تحديد معدل الطلبات `src/lib/security/rate-limit.ts`
- [x] التحقق الخادمي من Turnstile بنهج الفشل المغلق `src/lib/security/turnstile.ts`
- [x] واجهة Turnstile الفعلية `src/components/security/TurnstileWidget.tsx` مركّبة في الاستمارات العامة الثلاث (لا وجود لـ `mock-bypass-token`)، وتُرسم **لا شيء** عند غياب `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- [x] بوابة إدارة محمية: `src/middleware.ts` + `src/lib/auth/{roles,require-staff}.ts` + `src/app/admin/login/` + `src/actions/auth-actions.ts` (طاقم `admin`/`secretary` فقط، وفشل مغلق عند غياب البيئة)
- [x] حدود أنواع Supabase سليمة: `Relationships` مكتملة في `database.types.ts`، وصفر `as any` في `src/`
- [x] التقويم القبطي بعهد صحيح (1825030) — 1 توت 1743 ليوم 2026-09-11
- [x] عرض الأوقات بمنطقة `Africa/Cairo` (`src/lib/utils/cairo-time.ts`) و«القداس القادم» مشتق من الجدول الفعلي (`src/lib/utils/mass-schedule.ts`)
- [x] أنظمة الألوان والهوية البصرية والخطوط القبطية والعربية مع مغير حجم الخط `A / A+ / A++`
- [x] مكتبة المكونات (21 مكوّناً في `src/components/{ui,layout,home,masses,contact,security}` بعد حذف المكوّنات الميتة تباعاً: `MegaMenu`/`MobileDrawer`، ثم `LiveStreamPlayer`، ثم `BibleReader` و`Modal` و`Breadcrumb` و`CopticDivider` وتوأمَي حجوزات العزاء في المرحلة الرابعة)
- [x] نظام المسارات الـ 43 المحددة مع `generateStaticParams` (إجمالي 55 مساراً ثابتاً ومولداً)
- [x] دليل العيادات الطبية الثابت (14 تخصصاً + التجهيزات + الغرف + الرسوم 30-35 ج.م + هاتف الاستقبال) بعد استبعاد ميزة الأطباء بالكامل
- [x] جدول القداسات الأسبوعية التفاعلي مع تصفية المذابح والأيام والفترة الزمنية (صباحي/مسائي) وزر الطباعة
- [x] حجز قاعات العزاء مع توليد الأكواد المرجعية `COND-XXXXXX` والتتبع العام
- [x] قارئ الكتاب المقدس الأرثوذكسي التفاعلي (73 سفراً + 46 عهد قديم + 27 عهد جديد)
- [x] البث المباشر المدمج وجدول الصلوات
- [x] الحسابات البنكية الرسمية والتبرعات مع نسخ IBAN بنقرة واحدة
- [x] لوحة إدارة المحتوى `/admin` (القداسات، العيادات الـ 14، حجوزات العزاء)
- [x] خلو كامل من أخطاء الترجمة `tsc --noEmit` بنتيجة 0
- [x] اكتمال بناء الإنتاج `next build` بنجاح كامل 55/55 صفحة (وصار 52/52 صفحة ثابتة + 4 مسارات إدارية ديناميكية بعد إصلاح منطقة `/admin`)
- [x] طبقة بيانات موحّدة: `unstable_cache` + عميل عام **بلا كوكيز** (`src/lib/supabase/public.ts`) + تراجع مُعلَن ببنية سجل ثابت في `src/lib/queries.ts` (لا تراجع صامت)
- [x] هجرات SQL مُصدَّرة في `supabase/migrations/` (7 ملفات: 21 جدولاً + 9 enums + 40 سياسة RLS + 12 فهرساً + دالتا SECURITY DEFINER) مع `supabase/README.md` — **لم تُطبَّق على قاعدة بيانات حيّة بعد**
- [x] إجراءات إدارية موثوقة لحجوزات العزاء (اعتماد + اعتذار بسبب إلزامي) محروسة بـ `requireStaff()` وتُنهي بـ `revalidateTag`، وشاشة الحجوزات تقرأ بيانات حقيقية بحالة فارغة صريحة
- [x] رؤوس أمنية مُنفَّذة في `next.config.ts`: CSP (بلا Report-Only) + HSTS (180 يوماً مع includeSubDomains) + Permissions-Policy، مُشتقّة من متطلبات مُقاسة في المخرجات (22 سكربتاً مضمَّناً، Turnstile، Supabase، YouTube/Facebook)
- [x] تضييق قائمة المضيفين: `images.remotePatterns` فارغة صراحةً (كانت `**`)، ومصدر واحد `src/lib/security/trusted-embeds.ts` يمنع تضمين أي `stream_url` غير معتمد في `/live`
- [x] صفر ثغرات في اعتماديات الإنتاج: `pnpm audit --prod` من 4 (2 high) إلى 0 عبر رفع `next`/`postcss` و`pnpm.overrides`، مع مخرجات CSS مطابقة حرفياً
- [x] ESLint 9 (flat config عبر `FlatCompat` مع `next/core-web-vitals`) — 0 أخطاء و0 تحذيرات على 100 ملف، وسكربت `lint` لم يعد `next lint` المهجور
- [x] سير عمل CI `.github/workflows/ci.yml` (بوابتان صلبتان: `tsc --noEmit` + `build` بلا بيئة، وإعلاميان: `audit --prod` + `lint`)
- [x] إزالة الكود الميت في المرحلة الرابعة: 6 ملفات بصفر مستوردين مُثبَت بـ `git grep` على `HEAD` (توأمان ميتان لحجوزات العزاء، `BibleReader`، `Modal`، `Breadcrumb`، و`CopticDivider` الذي صار يتيماً بعد حذف `Breadcrumb`)، مع تقليم `CardHeader/CardTitle/CardContent/CardDescription/CardFooter` من `Card.tsx` لأن آخر مستهلكيها كانوا الملفات المحذوفة
- [x] مصدر واحد لرمز الحجز المرجعي `src/lib/domain/booking-reference.ts` (نوع موسوم `BookingReference` + `makeBookingReference` + `normalizeBookingReference` + عنصر نائب مشتق) — الشكل `COND-XXXXXX` بلا تغيير، وبلا تكرار نص البادئة في الواجهات
- [x] وثيقة جاهزية النشر `docs/release-readiness.md`: البوابات الخمس، حارس البناء بلا بيئة، جدول متغيرات §9.1 بمستهلك كل متغير، خطوات القاعدة واستعلامات التحقق بعد التطبيق، قائمة الفحوص البشرية، والفجوات المقبولة
- [x] صفر `as any` في `src/` (المطابقة الوحيدة سطر تعليق توثيقي)

## سجل المراجعات (Review Layer)
- [x] 2026-09-17: **تسليم حزمة اختبارات الواجهات وإجراءات الخادم الشاملة (UI & Action Testing Deliverable)** — (1) إدماج وتفعيل جناح الاختبارات الشامل المبني على Vitest + @testing-library/react + jsdom بإجمالي 12 ملف اختبار و274 فحصاً ناجحاً بنسبة 100% (274/274 passed). (2) إضافة أجنحة اختبارات مكونات الواجهة التفاعلية المتوافقة مع معايير INV-IDENTITY-WARMTH وINV-FEEDBACK-ANIMATION: `NewVisitorWelcome.test.tsx` (4 فحوص)، `PatronSaintsSection.test.tsx` (4 فحوص)، `SanctuaryAltarsShowcase.test.tsx` (5 فحوص)، `Skeleton.test.tsx` (7 فحوص)، واختبارات إجراءات الخادم `admin-mass-actions.test.ts` (13 فحصاً). (3) التحقق الكامل والشامل: `tsc --noEmit` 0 أخطاء، `pnpm test` 274/274 خروج 0، و`pnpm run build` توليد 51/51 مساراً بنجاح نظيف.
- [x] 2026-09-16: **حزمة اختبارات Vitest وبوابة CI الصلبة (Commit `9aa0be9`) وإدماج تسليم Goal Brief v1.0** — (1) إدماج جناح اختبارات Vitest 5.0.1 (7 ملفات، 226 فحصاً ناجحاً بنسبة 100% في 2.92 ثانية: قدرات 105، تكرار 23، مستودع ملفي 23، فلاتر 26، iCal 19، مشتركون 17، تاريخ قبطي 13) مع عزل مجلد بيانات الاختبار عن مخزن التطوير. (2) تعزيز سير عمل CI `.github/workflows/ci.yml` بجعل `pnpm test` بوابة صلبة إلزامية ثالثة إلى جانب فحص الأنواع والبناء بلا بيئة. (3) إدماج واعتماد وثيقة موجز الهدف المجمدة Goal Brief v1.0 وتوأمها الآلي وملخصها وسكربت التحقق `goal-brief-church-site-verify.ps1` (نجاح كامل RESULT: PASS). (4) تتبع معايير القبول الـ 16 (6 محققة، 5 جزئية، 5 فجوات مفتوحة مع افتراضات آمنة صريحة). (5) تصحيح التناقضات الستة السابقة في الوثائق. التحقق: `tsc` خروج 0، `lint` خروج 0، `test` 226/226 خروج 0، `build` بلا بيئة خروج 0 (53/53 صفحة ثابتة)، `audit --prod` 0 ثغرات، والمستودع `master` متزامن مع `origin/master`.
- [x] 2026-09-16: **إغلاق فجوات الصفحات العامة** — أربع صفحات عامة ناقصة من قائمة متطلبات الهدف، بلا أي اعتمادية جديدة وبلا متغيرات بيئة: (1) **`/about`**: فهرس «عن الكنيسة» الذي كان 404 — مقدمة الكنيسة (عربي/إنجليزي)، العنوان من `PARISH_ADDRESS_AR` والإيبارشية من القاموس، و**كل رقم محسوب من بيانات الكنيسة** (`getAltars`/`getClergy`/`getClinicSpecialties`/`getChurchMeetings`/`getActivities`/`getSchoolsAcademies`) مع حذف البطاقة الصفرية، وبطاقات للصفحات الثلاث. (2) **`/gallery`**: قارئ عام جديد `getPublicGalleryMedia()` في `src/lib/events/feed.ts` يفلتر `publicOnly` في الاستعلام ويعيد نموذجاً يُسقط `uploadedBy`؛ وحالة نائبة **موسومة قابلة للاستبدال** («الصور ستُضاف قريبًا» + السطر بالإنجليزية) بدل أي صورة مُختلقة؛ وبلا `<img>`/`next/image` (لا ملفات مستضافة، و`img-src` تمنع غير الذاتي)، فالبطاقة تعرض الوصف المسجَّل نصاً + اسم الملف + رابطاً مُتحقَّقاً بـ `openableMediaUrl()` (https أو نسبي فقط). (3) **`/sermons`**: حالة فارغة صريحة موسومة بلا اختراع عظات + «مصادر الكلمة» (`/live`, `/bible`, `/masses`, `/events`) + شرائح `FlagBadge` على مصطلحات `event_type` الحية (روابط `buildEventsHref`). (4) **`/privacy`**: سياسة من ثمانية أقسام بلغتين مطابقة للجداول الفعلية (`contact_messages`, `condolence_bookings`, `program_applications`, `job_applications`, `subscribers` — كل نوع يحمل `data-privacy-table`)، مع سجل التدقيق، وما لا يُجمع، والكوكي والـTurnstile، والتقليل والاحتفاظ، والحقوق، وشروط مختصرة. (5) **الوصول**: `/about` في قائمة «عن الكنيسة»، والثلاثة في الدرج الجوّال والتذييل (قرار: عدم توسيع صف `xl` الممتلئ — الوصول هو المطلوب)، وتصحيح مسارات التصفح في `about/*`، و4 مسارات في `sitemap.ts`. (6) **الرسائل**: ~70 مفتاح قاموس (عربي + إنجليزي مقيَّد نوعياً) والمحتوى الطويل كأزواج `{ar,en}` يلزمها النوع. التحقق: `tsc` خروج 0، `lint` 0/0، `build` بلا بيئة خروج 0 و53/53 (والأربعة `ƒ` ديناميكية كما يُتوقع لكوكي اللغة)، فحص آلي للروابط (23 رابطاً داخلياً + 23 مسار خريطة = 0 رابط ميت)، تشغيل `next start` (الأربعة 200 مع علامات الحالات في HTML)، و**دورة وسائط كاملة**: صفّان عامان ظهرا في الشبكة وصف داخلي غاب تماماً، ثم استعادة الملف ببصمة `230ca458…` مطابقة. لم يُعمل أي commit.
- [x] 2026-09-16: **STEP 4 — الاشتراكات/التنبيهات + حزمة التسليم التشغيلي** — (1) **المشتركون في المستودع**: `SubscriberRecord` + `src/lib/domain/subscribers.ts` (تطبيع البريد في موضع واحد، بُعدا اشتراك، حلّ سلاجات مع إبلاغ عن المجهول) + `listSubscribers`/`subscribe`/`setSubscriberActive` في المحرّكين، مع **عدمية التكرار بعقد** (نفس الصف يُحدَّث ويُنشَّط، و`created` يخبر أيّهما حدث) وحلّ `23505` في سباق Supabase، **وبلا حذف** للمشتركين. (2) **البريد**: `src/lib/notify/` بواجهة `Mailer` ومحوّل `noop` وحيد يُسجّل ما كان سيُرسل كسطر تدقيق `notify` ويُرجع `delivered: false` دائماً، مع مكان مزوّد حقيقي معلَّم بثلاث خطوات — **لا يُرسل أي بريد ولا يدّعي أي سطح ذلك**. (3) **العام**: `/subscribe` (صفحة ديناميكية بلغتين + استمارة عميل بنفس مخطط الخادم) و`subscribeToEventsAction` بعقد الاستمارات العامة نفسه (راية → معدل → zod → Turnstile) لكن بكتابة **عبر المستودع** فعملت بلا قاعدة، ودعوة للاشتراك في `/events`، وراية `EVENTS_SUBSCRIPTIONS_ENABLED`. (4) **الإدارة**: `/admin/subscribers` بقدرتَي قراءة/كتابة، ولافتة «لا يُرسل أي بريد»، وبند تنقّل ورابط في اللوحة ومرشّحات تدقيق جديدتان. (5) **القاعدة**: هجرتان (10: `locale_enum` + `subscribers` + `notify` في `audit_action_enum`؛ 11: RLS بلا أي وصول عام وبلا DELETE) + `database.types.ts`. (6) **المستند**: schemaVersion 2 مع **ترقية معلنة من 1** بدل رفض مستندات الكنيسة القائمة. (7) **الوثائق**: الخمس في `docs/` بتفصيل §10.6 من activeContext. التحقق: `tsc` خروج 0، `lint` 0/0، `build` بلا بيئة خروج 0 و53/53، تشغيل حقيقي (`/subscribe`=200، `/admin/subscribers`=307 إلى الدخول)، و7 فحوص وحدة ناجحة، و**دورة نسخ→تعديل→استعادة→تحقق مُنفَّذة فعلياً** (بصمة مطابقة + عودة الموقف العام + ظهور/اختفاء الفعالية المؤقتة في HTML من بناء يعمل). لم يُعمل أي commit.
- [x] 2026-09-16: **STEP 3 — سطح إدارة الفعاليات** — (1) **الفهرس**: `src/app/admin/(protected)/events/page.tsx` + `EventsManager.tsx` يعرضان كل صف فعالية (بكل الحالات، والمستقلة وتجاوزات السلاسل) وكل سلسلة متكررة، مع بحث وتصفية بالحالة وترتيب، وأزرار الصف موصولة بالإجراءات القائمة (نشر/إلغاء نشر/أرشفة/إلغاء بسبب/نسخ/حذف بتأكيد مزدوج/نقل موعد عبر `updateEventAction`)؛ وزر مسح الذاكرة المؤقتة مع «آخر تعديل على المحتوى» واسم المحرك عبر `RepublishControl`. (2) **المحررون**: `_components/EventEditorForm.tsx` (كل حقول النطاق بالعربية والإنجليزية + التوقيت بتوقيت القاهرة + طوال اليوم + المكان + ستة أبعاد تصنيف + الصورة + المرفقات + الحالة) و`_components/SeriesEditorForm.tsx` (أسبوعي/شهري بقاعدة صريحة + المكان والتصنيفات الافتراضية) و`_components/SeriesOccurrencesPanel.tsx` (إلغاء موعد واحد، نقله، والتراجع عن الاستثناء). (3) **القراءة**: `src/lib/events/admin.ts` قارئ إدارة مستقل عن `feed.ts` (لأن الفهرس العام يخفي المسودات)، و`admin-form.ts` نقي يعمل في الخادم والمتصفح (تحويل الساعة الجدارية ⇄ اللحظة، حمولات الإجراءات، وأخطاء الحقول من نفس مخططات zod)، و`audit-view.ts` يحوّل لقطتَي before/after إلى أسطر عربية. (4) **الرفض يُسجَّل**: قيمة `denied` جديدة في `AuditAction`/`AuditActionEnum`/`audit_action_enum` (مع `ALTER TYPE … ADD VALUE IF NOT EXISTS`)، و`EventRepository.recordAuditNote()` في المحرّكين، ويناديها `authorize()` قبل إعادة الرفض (بذل وسع مع تسجيل الفشل بلا تحويله إلى خطأ للمستخدم). (5) **الحالات والجلسة**: `/admin/login` يبقى **ثابتاً** ويعرض سبب إعادة التوجيه عبر مكوّن عميل داخل `Suspense` (`SignInNotice`)، و`middleware.ts` يحمل `?reason=session|role`، و`signOut` يحمل `?reason=signed-out`؛ وشاشة `AdminForbiddenNotice` للإجراء الممنوع. (6) **الوسائط**: `/admin/media` يسجّل بيانات وصفية فقط (بلا رفع بايتات، ومذكور نصاً) مع رفض الحجم الزائد برسالة مبنية من `MAX_MEDIA_SIZE_BYTES`. التحقق: `tsc` خروج 0، `lint` 0/0، `build` بلا أي متغير بيئة خروج 0 و53/53 والمسارات الجديدة كلها `ƒ` و`/admin/login` `○`، وسكربت مؤقت (حُذف) بـ31 فحصاً ناجحاً (تسجيل الرفض بلا تغيير محتوى، جدول الأدوار، حد الوسائط، تحويل توقيت القاهرة، رفض القواعد غير الصالحة inline، ملخص التدقيق، وعدم انحدار محرك التكرار)، وتشغيل `next start` أثبت أن `/admin*` يعيد 307 إلى `/admin/login?reason=session` بينما الصفحة العامة `/events` و`/admin/login` تردان 200.
- [x] 2026-09-16: **الطبقة الأساسية لنظام الفعاليات/التصنيفات/i18n (الخطوة 1)** — (1) **النموذج**: `src/lib/domain/types.ts` (فعالية بدورين موثّقين: مستقلة أو تجاوز موعد في سلسلة)، `capabilities.ts` (`owner|editor|viewer` فوق `admin|secretary` بلا مساس بهما + `can()` نقية من جدول قرار واحد)، و`recurrence.ts` (محرك توسيع أسبوعي/شهري **بمنطقة السلسلة**، إلغاء ونقل موعد واحد، نافذة قصوى 731 يوماً بـ `RangeError` بدل قصّ صامت). (2) **المستودع**: `src/lib/store/` — عقد واحد (`repository.ts` + `StoreError` بأربعة أكواد مغلقة)، محرك ملفي ذرّي (`json-store.ts`: ملف مؤقت + `rename` مع إعادة محاولة، طابور تعديلات داخل العملية، تهيئة عند أول استخدام، رفض الملف التالف بدل استبداله بالبذرة)، محرك Supabase بنفس العقد، مصنع واحد في `index.ts`، و`revalidate.ts` منفصل ليستورد `next/cache` بلا أن يجرّه سكربت عادي. (3) **البذرة**: تحويل 5 قداسات + 11 اجتماعاً إلى 16 سلسلة أسبوعية، وصفّي البث إلى فعاليتين، و37 مصطلحاً مُشتقّاً من نصوص الكنيسة نفسها (`name_ar`/`category`)، مع إبقاء `media` فارغة عن قصد (لا وجود لأصول `/assets/`). (4) **الإجراءات**: `src/actions/event-actions.ts` بعقد واحد (`requireStaff()` → `can()` → zod → المستودع → إبطال الوسوم بعد النجاح فقط) وسطح كامل يشمل `republishEventsAction`. (5) **i18n**: `src/lib/i18n/` (لهجات + علامة ترجمة مفقودة مرئية + كوكي + قاموس واجهة + مبدّل عميل غير مُركَّب). (6) **القاعدة**: هجرتان (5 أنواع + 7 جداول + فهارس + RLS) و`database.types.ts` مطابق عموداً بعمود. **عيب حقيقي أُصلح أثناء التحقق**: تقاسم مفاتيح خريطة النتائج بين الموعد المنقول والموعد الأصلي المُخلّى جعل `includeMovedFrom` يبتلع الموعد الأصلي — فُصل المفتاحان (`<date>` و`<date>@origin`). التحقق: `tsc` خروج 0، و`build` بلا أي متغير بيئة خروج 0 و52/52، و`lint` خروج 0، وسكربت مؤقت (حُذف بعده) أثبت التوسيع/الإلغاء/النقل/النسخ/التدقيق (8 أسطر بترتيبها المتوقع) ومرشّحات القراءة، وأن `.data/church-store.json` يُنشأ في وقت التشغيل ومُهمَل في git (`.gitignore:36`).
- [x] 2026-09-16: **المرحلة الرابعة (4.1 → 4.3: القابلية للصيانة وجاهزية النشر)** — (1) **4.1**: حُذفت 6 ملفات بعد إثبات صفر مستوردين بـ `git grep` **على شجرة `HEAD`** (لا على شجرة العمل بعد الحذف، لأن الحذف يجعل النتيجة صفراً بالضرورة): `src/components/condolence/{CondolenceBookingForm,ReservationTrackingCard}.tsx` (لكل منهما توأم حيّ في `src/app/condolence/**`)، `src/components/bible/BibleReader.tsx`، `src/components/ui/Modal.tsx`، `src/components/layout/Breadcrumb.tsx`، و`src/components/ui/CopticDivider.tsx` **الذي صار يتيماً نتيجة الحذف نفسه**؛ وقُلِّمت `CardHeader/CardTitle/CardContent/CardDescription/CardFooter` من `Card.tsx` لفقدانها آخر مستهلكيها (وبقي `Card` المستخدم في 4 مواضع) مع تعليق يشرح سبب الغياب. كل الـ13 وسماً في `REVALIDATION_TAGS` وكل مخططات zod لها مستهلك، فلم يبقَ أي يتيم من هذا الحذف. (2) **4.2**: صفر `as any` في `src/` (المطابقة الوحيدة تعليق توثيقي)، و`src/lib/domain/booking-reference.ts` جديد يوحّد شكل `COND-XXXXXX` (بادئة + طول + عنصر نائب **مشتق** + نوع موسوم + مولد + مُوحِّد حالة)، ومُتبنّى في إجراء الحجز وفي استمارة/صفحة التتبع بلا تغيّر في الشكل ولا في السلوك (قرار مقصود: لا رفض لأي رمز غير مطابق حتى لا يتعطل تتبع صف أُدرج يدوياً). (3) **4.3**: `docs/release-readiness.md` جديد + تزامن بنك الذاكرة؛ وأثناء كتابته أُثبت أن `NEXT_PUBLIC_SITE_URL` و`YOUTUBE_API_KEY` **لا يستهلكهما أي كود** وأن `sitemap.ts`/`robots.ts` غير موجودين (بند §9.3 رقم 7 غير مستوفى) فسُجِّل صراحةً بدل الادعاء. التحقق: `tsc` خروج 0، و`build` بلا أي متغير بيئة خروج 0 و52/52، و`lint` خروج 0 و0/0 على 96 ملفاً (91 تحت `src/`).
- [x] 2026-09-16: **المرحلة الثالثة (3.1 → 3.5: التقوية والتشغيل)** — (1) **3.1**: رؤوس أمنية في `next.config.ts` — `Content-Security-Policy` **مُنفَّذة** (لا Report-Only) بكل سماح مُعلَّل: `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com` (الضرورة مُقاسة: 22 سكربت `self.__next_f` مضمَّناً في `contact.html`)، `style-src 'self' 'unsafe-inline'` (4 سمات `style=`)، `frame-src` = Turnstile + مضيفو البث المشتقّون من المصدر الواحد، `form-action/base-uri/frame-ancestors 'self'`، و`object-src 'none'`، مع `upgrade-insecure-requests` في الإنتاج فقط و`'unsafe-eval'`/`ws:` في التطوير فقط؛ و`Strict-Transport-Security: max-age=15552000; includeSubDomains`؛ و`Permissions-Policy` تعطّل الكاميرا/الميكروفون/الموقع/الدفع وغيرها **مع ترك autoplay/encrypted-media/fullscreen/picture-in-picture** لأن إطارَي YouTube/Facebook يحتاجانها. (2) **3.2**: حُذف `images.remotePatterns: [{hostname:"**"}]` (كان وسيط صور مفتوحاً) وصارت فارغة صراحةً — لا `next/image` ولا `public/` ولا `<img>` إطلاقاً؛ و`src/lib/security/trusted-embeds.ts` جديد يحرس إطار البث بـ `getTrustedEmbedUrl` (https + مضيف معتمد فقط) مع حالة عربية صريحة «رابط البث الحالي غير معتمد» بدل إسقاط الحالة. (3) **3.3**: جذر الثغرات كان `postcss@8.4.31` **المثبَّتة داخل next** لا devDependency، فأُصلح بـ `next ^15.5.25` (أحدث 15.x) و`postcss ^8.5.28` و`pnpm.overrides` → `pnpm audit --prod` = «No known vulnerabilities found»، ومخرج CSS مطابق حرفياً (`5de250c8da5558e9.css`، 45151 بايت). (4) **3.4**: ESLint 9.39.5 + eslint-config-next 15.5.25 + `@eslint/eslintrc` بـ `eslint.config.mjs` (flat config + FlatCompat + `next/core-web-vitals`)، و`lint` = `eslint .` → 0/0 على 100 ملف، والفاعلية مُثبَتة بملف تحقّق مؤقت أطلق 3 نتائج ثم حُذف. (5) **3.5**: `.github/workflows/ci.yml` (checkout@v7، pnpm/action-setup@v6، setup-node@v7/Node 22 مع cache pnpm، تثبيت frozen-lockfile، حارس بيئة يمنع تسرّب `NEXT_PUBLIC_*|SUPABASE_*|TURNSTILE_*|YOUTUBE_*`، ثم البوابتان `tsc --noEmit` و`build`، وبعدهما `audit` و`lint` بـ continue-on-error). التحقق: `tsc` خروج 0، `build` بلا أي متغير بيئة خروج 0 و52/52، الرؤوس الستة في `routes-manifest.json` ومُخدَمة فعلاً عبر `next start`+curl على `/` و`/live` و`/masses`، و10 حالات لقائمة البث الموثوقة، وYAML مُحلَّل بنجاح.
- [x] 2026-09-16: **المرحلة الثانية (P2.1 → P2.6)** — (1) **P2.2**: `src/lib/queries.ts` أُعيد بناؤه حول `readOrSeed(queryName, seed, read)` فلا تراجع صامت بعد اليوم (بنية سجل ثابتة `{ query, served:'seed-data', reason }` والأسباب: `environment_not_configured` مرة/عملية، `query_error`، `empty_result`، `unexpected_error`)، مع عميل عام جديد `src/lib/supabase/public.ts` بلا جلسة وبلا `cookies()` لأن `unstable_cache` يعمل خارج نطاق الطلب (إصلاح العيب الذي كان يجعل الكاش يخزّن البذرة بصمت)؛ وقراءة الطاقم `getCondolenceBookings()` بلا كاش لأنها تعتمد الجلسة. (2) **P2.1**: تحويل `/masses` و`/donations` و`/bible` و`/admin/masses` و`/admin/clinics` ولوحة `/admin` إلى طبقة البيانات بأسلوب غلاف خادمي + طفل عميل (`MassesExplorer`, `DonationAccountsList`, `BibleReaderClient`, `AdminMassesTable`, `AdminClinicsGrid`)، مع إزالة استيرادات `SEED_*` المباشرة منها و0 `as any` جديد. (3) **P2.6**: كانون واحد لـ73 سفراً في `SEED_BIBLE_BOOKS` ومعرّفات مشتقة بـ `bibleBookId(order)`، وكل العدّادات (73/46/27) مشتقة من المصفوفة، و`is_deuterocanonical` بدل `is_deutero`. (4) **P2.4**: حذف `dQw4w9WgXcQ` و`SAMPLE_CHURCH_CHANNEL` من البذرة، وتكوين القناة عبر `NEXT_PUBLIC_YOUTUBE_CHANNEL_URL` مع حالة «لم تُضبط القناة بعد»، وحذف المكوّن الميت `LiveStreamPlayer.tsx`. (5) **P2.3**: إجراءات إدارية موثوقة `approveCondolenceBooking`/`rejectCondolenceBooking` (سبب إلزامي) بـ `requireStaff()` + zod + كتابة بجلسة الطاقم + تأكيد الصف + `revalidateTag`، وشاشة الحجوزات صارت تقرأ الحجوزات الحقيقية بحالة فارغة صريحة (حُذفت الصفوف الملفقة)، وتُعلَّم الشاشات غير المنفَّذة صراحةً. (6) **P2.5**: `supabase/migrations/` بسبعة ملفات SQL مرقّمة (21 جدولاً، 9 enums، 40 سياسة، 12 فهرساً، دالتا SECURITY DEFINER، RLS على 21 جدولاً) + `supabase/README.md`. التحقق: `tsc --noEmit` خروج 0 بعد حذف `.next`، و`pnpm run build` بلا أي متغيرات بيئة خروج 0 و52/52 صفحة ثابتة، وأدلة HTML للصفحات المحوَّلة، و0 أثر للعناصر البديلة المحذوفة.
- [x] 2026-09-16: إغلاق فجوتَي المرحلة الأولى **P1.2 + P1.3** — (1) **P1.3**: مكوّن عميل جديد `src/components/security/TurnstileWidget.tsx` يحمّل سكربت Cloudflare مرة واحدة (`render=explicit`)، ويرسم **لا شيء** عند غياب `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (البقاء على البناء بلا بيئة)، ويسلّم الرمز عبر `onVerify(token)`/`onExpire` و`resetSignal` لإعادة التوليد؛ ورُكّب في الاستمارات الثلاث (`ContactForm`, `CondolenceBookingForm`, `EducationEnrollmentForm`) بعد حذف الإدخال المخفي `mock-bypass-token` وقيمة `defaultValues` المزيفة واستبدالهما بـ `setValue("turnstileToken", token)` وإعادة ضبط الواجهة بعد كل إرسال (الرموز أحادية الاستخدام). لم يُخفَّف مخطط zod ولا `verifyTurnstile`. (2) **P1.2**: `submitClinicInquiry` صار فاشلاً مغلقاً (لا إقرار نجاح بلا صف مُدرَج) مع تحديد معدل `clinic:${ip}` والتحقق من Turnstile، وأُضيف `turnstileToken` إلى `ClinicInquirySchema`؛ **الإجراء ميت**: لا تستورده أي صفحة/مكوّن فلم تُخترع استمارة. (3) **تنظيف**: توحيد مصدر تسميات أيام الأسبوع — `DayTabFilter` يشتق من `DAY_OF_WEEK_LABELS_AR`/`DAY_OF_WEEK_INDEX` وحُذفت خريطة الأيام المحلية المكررة من صفحة إدارة القداسات. التحقق: `tsc --noEmit` = خروج 0 (صفر مخرجات بعد حذف `.next`)، `pnpm run build` بلا أي متغيرات بيئة = خروج 0 و52/52 صفحة ثابتة، `git grep -n "mock-bypass-token" -- src/` = 0 (خروج 1)، `git grep -in "mock"` = 0، وبناء تحقّقي بمفتاح وهمي أثبت ظهور حاوية الواجهة مرة واحدة في كل HTML للاستمارات الثلاث واستبدال المفتاح حرفياً في 3 حِزم عميل، ثم أُعيد البناء بلا بيئة (0 أثر للمفتاح)، ورابط السكربت `…/api.js?render=explicit` يرد 200.
- [x] 2026-09-16: تمريرة إكمال المرحلة الأولى (Phase-1 Completion Pass) — (1) **تشخيص جذر أخطاء الأنواع**: تعارض نوعي بين `@supabase/ssr@0.5.2` و`@supabase/supabase-js@2.116` (المعامل الثالث في `SupabaseClient` صار اسم المخطط)، إضافة إلى غياب `Relationships` عن كل جداول `Tables`؛ أُصلح الشكل وأُزيلت 6 تحويلات `as any` بلا إضافة أي تحويل جديد، وكشف إزالة تحويل `rpc` نقص معالجة الحالة `cancelled` في بطاقة التتبع فأُضيفت مع اشتقاق نوع النتيجة من الإجراء. (2) **P1.6**: عهد التقويم القبطي `1825030` مع تحقق عددي لأربعة تواريخ. (3) **P1.7**: سلَج التسجيل مشتق من البذرة (`SEED_PROGRAM_SLUGS` + حارس `isProgramSlug` + `notFound()`). (4) **P1.8**: `/live` يستبعد المؤرشف ويُظهر الحالة والقادم بالعربية وبوقت القاهرة. (5) **P1.9**: حذف الحجز الملفق `COND-DEMO01`، وتحويل العدّاد الوهمي إلى مشتق من الجدول الحقيقي (مكوّن خادمي + عدّاد عميل). (6) **P1.10**: `spiritual_urgent` بدل `urgent`. (7) **عيب محجوب أُصلح**: ترسيب تحويلة 307 ثابتة لصفحات `/admin` في البناء بلا بيئة — أُضيف `dynamic = "force-dynamic"` لمنطقة الإدارة المحمية. التحقق: `tsc` = 0 (خروج 0)، `build` = 52/52 بلا أي متغيرات بيئة (خروج 0)، `as any` = تعليق واحد فقط، `COND-DEMO` = 0، وفحص HTML المولَّد لصفحات `/` و`/live` و`/education/adult-bible` و`/contact` و`/masses`.
- [x] 2026-09-14: مراجعة كود مزدوجة المحور (Standards + Spec) لتمريرة إعادة تصميم غير ملتزَمة شملت 6 صفحات → تراجع كامل إلى `f0fe90e` بموافقة المستخدم. النسخة الاحتياطية: `.scratch/antigravity-redesign-2026-09-14/redesign.patch`. الدليل: diff=0 ملفات، tsc=0، build=56/56 و103 kB.
- [x] 2026-09-14: إعادة تطبيق التصميم الجديد (Re-landing) — شملت مسار `/masses` ومكوناته الأربعة فقط بمعالجة كامل ملاحظات المراجعة، بينما بقيت صفحات `[slug]` التفصيلية الأربع على تصميم `f0fe90e` الأصلي المتوافق.
- [x] 2026-09-14: استبعاد ميزة الأطباء بالكامل من `src/` (حذف مسار الأطباء ومكوناتهم، تطهير طبقة البيانات والبذرة، تحديث الروابط وصفحات الإدارة، والتحقق: `tsc` = 0، `doctor` = 0، `build` = 55/55).
- [x] 2026-09-14: تطهير ميزة الأطباء بالكامل من وثائق المواصفات وبنك الذاكرة (Specs Cleaner): تحديث `INFORMATION_ARCHITECTURE.md` (43 مساراً، 55 صفحة، حذف مسار الأطباء والمصفوفة والـ ERD)، `PRODUCT_REQUIREMENTS_DOCUMENT.md` (حذف بند الأطباء من الخريطة الذهنية وتفصيل المتطلبات)، `BACKEND_AND_DATA_SPEC.md` (حذف جداول clinic_doctors و doctor_slots و doctor_absences وفهارسها وسياسات RLS وإجراءاتها)، و`CONTEXT.md` (حذف §2.5 و§2.6 وإعادة ترقيم الأقسام).
- [x] تراكمي: فلترة الفترة الزمنية (صباحي/مسائي) في `/masses` (PRD §3.1.4) — تم إنجازها وتركيبها مع فلاتر اليوم والمذبح.
- [x] 2026-09-14: تمريرة إصلاح طبقة `src/` (Src-layer fix pass) — ثلاثة بنود: (1) رابط `tel:035500002` لهاتف استقبال المستوصف في `/clinics` و`/contact`؛ (2) مكون التواصل المشترك `src/components/contact/ContactLinks.tsx` وتركيبه في `services/[slug]` (contact_phone/contact_whatsapp) و`meetings/[slug]` (whatsapp_group_link ×11) و`activities/[slug]` (whatsapp_link على 3 من 7) مع `toWhatsAppUrl` لتحويل الأرقام المصرية إلى صيغة wa.me الدولية، وإصلاح رابط واتساب الآباء الكهنة؛ (3) تنظيفات المراجعة (توحيد اشتقاق الفترة والتسميات، توليد أزرار الفلترة، استنتاج العدّادات، توحيد ثابت رسم الكشف، إزالة الثوابت النصية غير المأهولة). التحقق: `tsc` = 0، `build` = 55/55، `doctor` = 0، وفحص HTML المولّد للصفحات الثابتة.

- [x] 2026-09-14: مراجعة كود مزدوجة المحور (ثانية) للتغيير غير الملتزم به (إعادة هبوط `/masses` + استبعاد الأطباء) مع تحقق مستقل من كل مخالفة صلبة: طبقة `src/` سليمة بالكامل (ربط الحقول القانونية نظيف ميدانياً بلا false-green، tsc=0، بناء 55/55). النتائج: (1) بقاء §3.2.2 «نبض العيادات» و`/clinics/status` في PRD (سطر 168) مخالفاً INV-03 والقرار المعتمد؛ (2) تناقض العدّ: مصفوفة IA=43 مساراً مقابل «44» في وثائق بنك الذاكرة؛ (3) بقاء مراجع الأطباء في `docs/agents/domain.md` و`AI_DEVELOPER_PROMPT_AND_GUIDELINES.md`؛ (4) إعادة الهبوط غطّت `/masses` ومكوناتها الأربعة فقط وبقيت صفحات `[slug]` الأربع على تصميم f0fe90e (بيانات التواصل في البذرة — contact_phone/whatsapp — غير معروضة في أي مكان)؛ (5) هاتف الاستقبال 03-5500002 بلا رابط `tel:`؛ (6) كل قداسات البذرة صباحية (05:30-08:30) ففلتر «مسائي» لا يعرض إلا الحالة الفارغة. ملاحظات حكمية: تكرار اشتقاق الفترة الزمنية ×3، تسميات فترة مكررة، أرقام صلبة (٣ مذابح/14/30-35 ج.م)، وثوابت نصية احتياطية غير مأهولة بالبذرة.

- [x] 2026-09-14: تطهير بقايا ميزة الأطباء من النسخ الحية والوثائق المعيارية (Copy & Docs Residual Purge) — 7 ملفات بصياغة محلية لكل ملف: `src/components/layout/MegaMenu.tsx` («دليل التخصصات الطبية»)، `src/app/admin/layout.tsx`، `src/app/admin/page.tsx` (سطرا 71 و169 دون المساس ببند معيار المستوصف)، `AI_DEVELOPER_PROMPT_AND_GUIDELINES.md` (حذف `clinics/status/page.tsx` وكتلة `RealtimeAbsenceStrip.tsx` مع تصحيح رموز الشجرة)، `docs/adr/0001-static-first-headless-edge-architecture.md` (§1، INV-01 بند 1، §3.2 بوسوم `src/lib/tags.ts` الفعلية، §3.3، سجل وسوم §5)، `README.md` (§2.1، مخطط §3، الركيزة الثالثة، شجرة §5)، و`memory-bank/productContext.md` (إعادة صياغة شخصية مدام مريم وحذف شخصية «د. بيتر» وإعادة الترقيم). التحقق: `tsc` = 0 (خروج 0)، `build` = 55/55 (خروج 0)، `git grep -in "doctor" -- src/` = 0 (خروج 1). المراجع المتبقية محصورة في السجلات التاريخية المستثناة والمراجع العامة المشروعة.

- [x] 2026-09-14: تنظيفات الشفرة (Code Hygiene) — حذف `src/components/layout/MegaMenu.tsx` و`MobileDrawer.tsx` (مكوّنان غير مستوردين ولا يستوردهما أي ملف، وكانا يشيران إلى مسارات غير قائمة مثل `/clinics/schedule` و`/programs/*`)، وإضافة `.claude/settings.local.json` و`.scratch/` إلى `.gitignore`، وتوحيد ثابتَي رسم الكشف وعدد التخصصات في 8 مواضع لتُشتق من `src/lib/constants.ts` و`SEED_CLINIC_SPECIALTIES.length`. التحقق: `tsc` = 0 (خروج 0)، `build` = 55/55 (خروج 0)، وأسطر مراجع التنقل والعدّ الثابتة = 0، وفحص HTML المولّد للقيم المعروضة.

## قيد الانتظار (Deployment Layer — الفجوات المفتوحة والافتراضات الآمنة)
- [x] **الفجوة 1: رفع الوسائط الثنائية (Binary Media Upload) [مكتملة ومحققة حياً 100%]** — تم بناء وإنجاز واختبار منظومة رفع وتخزين الوسائط الرقمية بمحولين (Supabase Storage للإنتاج وFileMediaStorage للتطوير والاختبارات) مع الهجرة 12 وسياسات RLS، ودفعها للمشروع الحي `mlprvcgbwwihnjyvyawm` واجتياز بوابة G6 الحية بنجاح كامل (PASS).
- [ ] **الفجوة 2: محول البريد الإلكتروني (Mailer Transport)** — الاشتراك في التنبيهات يعمل بمحول `noop` مسجل في سجل التدقيق وبنصوص صريحة للزائر بأنه لا يُرسل بريد. *الافتراض الآمن*: بقاء الـ no-op حتى توفير مفاتيح مزود بريد حقيقي (Resend أو SMTP).
- [ ] **الفجوة 3: أدلة إمكانية الوصول والأداء في المتصفح (A11y & Performance Evidence)** — البنية الهيكلية سليمة، لكن لم تُفحص في متصفح حي (Lighthouse وتباين وقارئات الشاشة). *الافتراض الآمن*: صيانة المعايير الهيكلية وتوثيق الفحوص البصرية كغير متحققة في هذه البيئة حتى توفير جلسة متصفح.
- [ ] **الفجوة 4: لقطات شاشات لوحة الإدارة (Admin Guide Screenshots)** — دليل الإدارة `docs/admin-guide.md` يحمل 10 عناصر نائبة موسومة في `docs/images/admin/`. *الافتراض الآمن*: بقاء العناصر النائبة بالأسماء الموثقة حتى التقاطها من لوحة إدارة مأهولة بجلسة حقيقية.
- [ ] **الفجوة 5: البنية التحتية والمحتوى المزود من الكنيسة (User-Supplied Inputs)** — تطبيق هجرات Supabase (الهجرات 1-12 مطبقة حياً، والهجرة 13 `content_types` بانتظار التطبيق لتفعيل دورة G6 الحية)، النطاق الرسمي، شهادة SSL، واعتماد الكنيسة للبيانات الرسمية (الحسابات، الكهنة، الهواتف، المواعيد). *الافتراض الآمن*: استمرار عمل محول مخزن الملفات محلياً حتى دفع الهجرة 13 للمشروع الحي.
- [ ] **تشغيل CI على GitHub (CI Green on Release Commit)** — سير العمل `.github/workflows/ci.yml` جاهز ومتحقق محلياً بجميع بواباته، ويلزم متابعة تشغيله على GitHub Actions عند دفع commit الإصدار.
- [ ] محرر مصطلحات التصنيف في لوحة الإدارة (إدارة الأبعاد الستة وتفعيل/إيقاف المصطلحات).
- [ ] تحميل نص الكتاب المقدس الكامل في جدول `bible_verses`.
- [ ] مراجعة التصديرات الميتة وشاشات الإدارة غير المنفذة (رسائل التواصل، طلبات التوظيف، شريط التنبيهات).

## العوائق
- لا توجد عوائق فنية تعيق البناء أو التشغيل. البيانات الحساسة محمية ببيانات بذر تجريبية مؤمنة لحين تزويد الكنيسة بالأرقام النهائية.

