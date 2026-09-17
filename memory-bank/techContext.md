# Tech Context — المكدس التقني والقيود

## المكدس المعتمد (v1.1)
| الطبقة | التقنية |
| :--- | :--- |
| الإطار | Next.js 15 (App Router, RSC, ISR) — TypeScript 5 strict |
| الواجهة | Tailwind CSS + Shadcn/ui، RTL أولاً، أيقونات Lucide + رسم قبطي مخصص |
| الخلفية | Supabase (PostgreSQL 15+) عبر **`@supabase/ssr`** (ممنوع `auth-helpers`) |
| النماذج | React Hook Form + Zod (مخططات BACKEND §7.1) |
| الاستضافة | Vercel Edge + Supabase |

## متغيرات البيئة (BACKEND §9.1)
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (خادم فقط), `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_YOUTUBE_CHANNEL_URL` (اختياري — عند غيابه تعرض `/live` حالة «لم تُضبط القناة بعد»)، `YOUTUBE_API_KEY` (اختياري).

- **المستهلك فعلاً في الكود** (اتحاد `ServerEnvVar` في `src/lib/env.ts`): الستة `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY`/`TURNSTILE_SECRET_KEY`/`NEXT_PUBLIC_TURNSTILE_SITE_KEY`/`NEXT_PUBLIC_YOUTUBE_CHANNEL_URL` فقط، **إضافة إلى `CHURCH_DATA_DIR`** الذي يُقرأ مباشرة في `src/lib/store/json-store.ts` (خارج اتحاد `ServerEnvVar` لأنه متغير تشغيلي لا سر، وغيابه يعني `<repo>/.data`)، و`EVENTS_SUBSCRIPTIONS_ENABLED` (`isEventSubscriptionsEnabled()` في `src/lib/env.ts`، افتراضاً مفعّلة) و`MAIL_PROVIDER` (`src/lib/notify/mailer.ts`، افتراضاً `noop` أي **لا إرسال بريد إطلاقاً**) — وكلها متغيرات تشغيلية لا أسرار.
- **`hasSupabaseAdminEnv()`** (`NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`) هو شرط اختيار محرك `supabase` في `src/lib/store/index.ts` — وهو **مختلف عن** `hasSupabaseEnv()` (URL + مفتاح anon) الذي يحكم مسار القراءة العامة. بغياب أي منهما يبقى المحرك الملفي هو المستخدم. **تحذير تشغيلي**: نشر يضبط URL + service-role وينسى مفتاح anon يشغّل محرك Supabase بينما تقرأ الصفحات العامة البذرة (والسطر `[queries] database read skipped` هو الدليل).
- **معلَن في §9.1 وغير مستهلك في الكود بعد** (أُثبت بـ `git grep` = 0 مطابقة في المرحلة الرابعة): `NEXT_PUBLIC_SITE_URL` و`YOUTUBE_API_KEY` — الأول لأن `metadataBase`/`sitemap.ts`/`robots.ts` غير موجودة أصلاً، فبند §9.3 رقم 7 غير مستوفى حتى الآن.
- `TURNSTILE_SECRET_KEY` غيابه **في الإنتاج** يرفض كل كتابة عامة (فشل مغلق في `verifyTurnstile`)، وفي التطوير فقط يُتجاوز مع تحذير مسجَّل.

## جاهزية النشر
`docs/release-readiness.md` هي المرجع التنفيذي الواحد: البوابات الخمس بالأوامر ونتائجها، حارس «البناء بلا بيئة» منقولاً حرفياً من `ci.yml`، جدول §9.1 أعلاه مع سلوك كل متغير عند غيابه، خطوات القاعدة واستعلامات التحقق بعد التطبيق (21 جدولاً/40 سياسة/21 RLS/9 enums + `condolence_bookings_booking_reference_code_key` و`uq_condolence_active_date`)، قائمة الفحوص البشرية الإلزامية، والفجوات المقبولة عند الإطلاق (الشاشات الإدارية غير المنفَّذة، نص الكتاب المقدس، sitemap/robots، اختبار CSP في متصفح، تشغيل CI على GitHub).

## مخطط قاعدة البيانات المُصدَّر (supabase/migrations)
- **أحد عشر ملفاً** SQL مرقّمة زمنياً في `supabase/migrations/`: السبعة الأولى تحمل مخطط الأساس (الامتدادات والأنواع، `profiles` والدوال المساعدة، 21 جدولاً، الدوال `SECURITY DEFINER`، الفهارس، تفعيل RLS و40 سياسة) مشتقّة حرفياً من BACKEND §2–§5 ومطابقة لأسماء الأعمدة والقيود في `src/types/database.types.ts`؛ والملفان 8 و9 يحملان **طبقة الفعاليات** (5 أنواع + 7 جداول + فهارس + RLS)، والملفان 10 و11 يحملان **المشتركين** (`locale_enum` + `subscribers` + قيمة `notify` في `audit_action_enum` + RLS بلا أي وصول عام) — مع `supabase/README.md` (ترتيب التطبيق + خطوة ترقية أول مدير يدوياً).
- **الإجماليات بعد الملفات الأحد عشر** (مقيسة من الملفات بـ `grep` على بدايات الأسطر): **29 جدولاً**، **56 سياسة**، **29 جدولاً بـ RLS مفعّلة**، **15 نوعاً**.
- فرقان موثّقان عن نص المواصفة: (1) كل عمود له `DEFAULT` في §3 صار `NOT NULL` ليطابق `database.types.ts`، و(2) `normalize_arabic()` تُنشأ قبل `bible_verses` (لأن العمود المولَّد يحتاجها)؛ وأُضيفت حُرّاس إعادة تطبيق (`IF NOT EXISTS`/`DO $$ … EXCEPTION`). والملفات 8–11 خارج BACKEND أصلاً (ميزات جديدة) ومسجَّلة كذلك في `supabase/README.md`.
- أسماء قيود تعتمد عليها طبقة الفعاليات: `uq_taxonomy_term_dimension_slug` (تفرد `(dimension, slug)`) و`uq_event_exception_occurrence` (تفرد `(series_id, occurrence_date)` — وعليه تعمل `upsertException` بـ `onConflict: "series_id,occurrence_date"`)، ويعتمد المشتركون على `subscribers_email_key` (تفرد `email` بعد تطبيعه في `src/lib/domain/subscribers.ts`، وسباق `23505` يُحلّ في المحرك بتحديث الصف الفائز).
- **لم يُطبَّق أي ملف منها على قاعدة بيانات حيّة بعد** — التطبيق والتحقق من أسماء القيود الفعلية بند نشر معلّق، وكذلك اختبار `pg_dump`/`pg_restore` (غير مختبَر، موثّق في `docs/backup-restore.md` §2).

## قيود الإصدارات المثبَّتة (مهم عند ترقية أي حزمة Supabase)
- `@supabase/supabase-js@2.116.0` أعاد تعريف `SupabaseClient` (المعامل الثالث صار **اسم المخطط** نصاً، والرابع نوعه، مع معامل خامس للخيارات) وحذف المسار الفرعي `dist/module/lib/types`.
- `@supabase/ssr@0.5.2` لا يزال يستورد `GenericSchema` من ذلك المسار المحذوف ويُصرِّح بعائد `SupabaseClient<Database, SchemaName, Schema>` (ثلاثة معاملات)، أي أنه **غير متوافق نوعياً** مع الإصدار أعلاه. النتيجة العملية قبل المعالجة: كل استعلام يُحلّ إلى صفوف `never` (لأن خطأ القيد يُسكت عنه بـ `skipLibCheck`).
- **المعالجة المعتمدة حالياً (بلا تغيير dependencies)**: إنشاء العميل بلا وسائط نوعية + التصريح بالنوع على توقيع الدالة في `src/lib/supabase/{server,client}.ts`، مع `Relationships` مكتملة في `src/types/database.types.ts`. أي ترقية لإحدى الحزمتين تستوجب إعادة اختبار: استعلام مُوسَّم، ونداء `rpc`، ونداء إجراء إداري — والتحقق من زوال الحاجة إلى هذه المعالجة.
- `@supabase/ssr` يُستورد من `@supabase/ssr/dist/main/*` داخل تعريفاته؛ لذلك `skipLibCheck` مطلوب لبناء نظيف.

## متطلبات وقت التشغيل
- Node 20+ مع ICU كامل (تم التحقق على Node v22.22.0): يستخدم الكود `Intl.DateTimeFormat` بمنطقة `Africa/Cairo` وتقويم `gregory` وأرقام `latn` لعرض التواريخ، وهو ما يتطلب بيانات المناطق الزمنية الكاملة في بيئة البناء والتشغيل. **صار هذا المتطلب أوسع**: `src/lib/utils/zone-time.ts` يبني مُنسِّقاً لكل منطقة IANA تستعملها سلسلة فعاليات، فبيئة بلا بيانات مناطق ستكسر توسيع السلاسل.
- Node's `crypto.randomUUID()` (بلا اعتماديات) هو مصدر معرّفات صفوف الفعاليات/المصطلحات/الوسائط، و`node:fs/promises` هو مخزن المحرك الملفي — كلاهما على الخادم فقط (`src/lib/store/*` وحدات خادمية).
- pnpm 10 (تم التحقق على 10.33.0) مع `pnpm-workspace.yaml` و`pnpm-lock.yaml`؛ وسير عمل CI يثبّت Node 22 وpnpm 10.
- أوامر التشغيل المجمعة في جذر المستودع: `dev:web`, `dev:admin`, `build:web`, `build:admin`, `build`, `typecheck` (`pnpm -r typecheck`), `test` (`vitest run`), `lint`.

## أدوات الجودة والأمن (v1.1 — بعد اكتمال Phase 1 Monorepo Split)
| البند | الحالة |
| :--- | :--- |
| Next.js | `^15.5.25` (مستقل لكل من `apps/web` و`apps/admin`) |
| postcss | `^8.5.28` كـ devDependency **و** `pnpm.overrides.postcss = "^8.5.28"` |
| ESLint | `eslint@9.39.5` + `eslint-config-next@15.5.25` إعداد مساحة العمل flat في `eslint.config.mjs` — `pnpm run lint` = 0 أخطاء |
| Vitest | `vitest@5.0.1` يفحص مساحة العمل بالكامل (`apps/` و`packages/`) — **274/274 فحصاً ناجحاً بنسبة 100% (12 ملفاً)** |
| رؤوس الأمن | CSP مُنفَّذة + HSTS (15552000) + Permissions-Policy في `apps/web/next.config.ts` |
| CI | `.github/workflows/ci.yml`: بوابات صلدة (`pnpm typecheck` + `pnpm test` + `pnpm --filter web build` بلا بيئة + `pnpm --filter admin build` + `pnpm run lint`) |
| ثابت البناء | تطبيق `apps/web` **يجب** أن يبني بلا أي متغير بيئة (تُحقّق محلياً وفي CI بخطوة تمنع تسرّب أي متغيرات) |

## قيود معروفة
- استهداف الأداء: FCP < 800ms، LCP < 1.2s على شبكات 3G/4G المصرية.
- إرسال واتساب آلي خارج النطاق (Phase 2) — الاشتراكات تُخزن فقط.
- **لا مزوّد بريد**: التنبيهات تُخزَّن وتُعرض في الإدارة فقط، والوحيد المُختار `MAIL_PROVIDER=noop` الذي يُسجّل سطر تدقيق `notify` («إشعار بريدي (لم يُرسل)») ولا يُرسل شيئاً؛ ربط مزوّد حقيقي ثلاث خطوات معلَّمة في `src/lib/notify/mailer.ts`. وخطوط السجل: `[notify] would-send — NO EMAIL IS SENT`.
- **صور دليل الإدارة غير ملتقطة**: البيئة التطويرية بلا متصفح، فالعناصر في `docs/admin-guide.md` نائبة بأسماء ملفات في `docs/images/admin/`.
- نص الكتاب المقدس (فان دايك + أسفار ثانية) يُحمّل كبيانات بذر ضخمة — خطوة نشر مستقلة.
- **هجرات Supabase غير منطبقة وبلا اختبار استعادة**: `pg_dump`/`pg_restore` موثّقان في `docs/backup-restore.md` §2 وموسومان «غير مختبَرين» حتى يُجريا مرة على staging.
