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

- **المستهلك فعلاً في الكود** (اتحاد `ServerEnvVar` في `src/lib/env.ts`): الستة `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY`/`TURNSTILE_SECRET_KEY`/`NEXT_PUBLIC_TURNSTILE_SITE_KEY`/`NEXT_PUBLIC_YOUTUBE_CHANNEL_URL` فقط.
- **معلَن في §9.1 وغير مستهلك في الكود بعد** (أُثبت بـ `git grep` = 0 مطابقة في المرحلة الرابعة): `NEXT_PUBLIC_SITE_URL` و`YOUTUBE_API_KEY` — الأول لأن `metadataBase`/`sitemap.ts`/`robots.ts` غير موجودة أصلاً، فبند §9.3 رقم 7 غير مستوفى حتى الآن.
- `TURNSTILE_SECRET_KEY` غيابه **في الإنتاج** يرفض كل كتابة عامة (فشل مغلق في `verifyTurnstile`)، وفي التطوير فقط يُتجاوز مع تحذير مسجَّل.

## جاهزية النشر
`docs/release-readiness.md` هي المرجع التنفيذي الواحد: البوابات الخمس بالأوامر ونتائجها، حارس «البناء بلا بيئة» منقولاً حرفياً من `ci.yml`، جدول §9.1 أعلاه مع سلوك كل متغير عند غيابه، خطوات القاعدة واستعلامات التحقق بعد التطبيق (21 جدولاً/40 سياسة/21 RLS/9 enums + `condolence_bookings_booking_reference_code_key` و`uq_condolence_active_date`)، قائمة الفحوص البشرية الإلزامية، والفجوات المقبولة عند الإطلاق (الشاشات الإدارية غير المنفَّذة، نص الكتاب المقدس، sitemap/robots، اختبار CSP في متصفح، تشغيل CI على GitHub).

## مخطط قاعدة البيانات المُصدَّر (supabase/migrations)
- سبع ملفات SQL مرقّمة زمنياً في `supabase/migrations/` تحمل المخطط كاملاً (الامتدادات والأنواع، `profiles` والدوال المساعدة، 21 جدولاً، الدوال `SECURITY DEFINER`، الفهارس، تفعيل RLS و40 سياسة) مشتقّة حرفياً من BACKEND §2–§5 ومطابقة لأسماء الأعمدة والقيود في `src/types/database.types.ts`، مع `supabase/README.md` (ترتيب التطبيق + خطوة ترقية أول مدير يدوياً).
- فرقان موثّقان عن نص المواصفة: (1) كل عمود له `DEFAULT` في §3 صار `NOT NULL` ليطابق `database.types.ts`، و(2) `normalize_arabic()` تُنشأ قبل `bible_verses` (لأن العمود المولَّد يحتاجها)؛ وأُضيفت حُرّاس إعادة تطبيق (`IF NOT EXISTS`/`DO $$ … EXCEPTION`).
- **لم يُطبَّق أي ملف منها على قاعدة بيانات حيّة بعد** — التطبيق والتحقق من أسماء القيود الفعلية بند نشر معلّق.

## قيود الإصدارات المثبَّتة (مهم عند ترقية أي حزمة Supabase)
- `@supabase/supabase-js@2.116.0` أعاد تعريف `SupabaseClient` (المعامل الثالث صار **اسم المخطط** نصاً، والرابع نوعه، مع معامل خامس للخيارات) وحذف المسار الفرعي `dist/module/lib/types`.
- `@supabase/ssr@0.5.2` لا يزال يستورد `GenericSchema` من ذلك المسار المحذوف ويُصرِّح بعائد `SupabaseClient<Database, SchemaName, Schema>` (ثلاثة معاملات)، أي أنه **غير متوافق نوعياً** مع الإصدار أعلاه. النتيجة العملية قبل المعالجة: كل استعلام يُحلّ إلى صفوف `never` (لأن خطأ القيد يُسكت عنه بـ `skipLibCheck`).
- **المعالجة المعتمدة حالياً (بلا تغيير dependencies)**: إنشاء العميل بلا وسائط نوعية + التصريح بالنوع على توقيع الدالة في `src/lib/supabase/{server,client}.ts`، مع `Relationships` مكتملة في `src/types/database.types.ts`. أي ترقية لإحدى الحزمتين تستوجب إعادة اختبار: استعلام مُوسَّم، ونداء `rpc`، ونداء إجراء إداري — والتحقق من زوال الحاجة إلى هذه المعالجة.
- `@supabase/ssr` يُستورد من `@supabase/ssr/dist/main/*` داخل تعريفاته؛ لذلك `skipLibCheck` مطلوب لبناء نظيف.

## متطلبات وقت التشغيل
- Node 20+ مع ICU كامل (تم التحقق على Node v22.22.0): يستخدم الكود `Intl.DateTimeFormat` بمنطقة `Africa/Cairo` وتقويم `gregory` وأرقام `latn` لعرض التواريخ، وهو ما يتطلب بيانات المناطق الزمنية الكاملة في بيئة البناء والتشغيل.
- pnpm 10 (تم التحقق على 10.33.0) مع `pnpm-lock.yaml`؛ وسير عمل CI يثبّت Node 22 وpnpm 10.

## أدوات الجودة والأمن (v1.1 — المرحلة الثالثة)
| البند | الحالة |
| :--- | :--- |
| Next.js | `^15.5.25` (أحدث 15.x؛ لا قفزة major) |
| postcss | `^8.5.28` كـ devDependency **و** `pnpm.overrides.postcss = "^8.5.28"` — الثاني هو ما يُصلح فعلاً ثغرات `next` (يثبّت `postcss@8.4.31`)، ولا يُحذف قبل رفع next إلى نسخة تعتمد postcss مُصلَحاً |
| ESLint | `eslint@9.39.5` + `eslint-config-next@15.5.25` + `@eslint/eslintrc@3.3.7`، إعداد flat في `eslint.config.mjs` عبر `FlatCompat` — `pnpm run lint` = `eslint .` (0/0 على 100 ملف) |
| رؤوس الأمن | CSP مُنفَّذة + HSTS (15552000) + Permissions-Policy في `next.config.ts` (لا Report-Only) |
| CI | `.github/workflows/ci.yml`: بوابتان صلدتان (`tsc --noEmit` + `build` بلا بيئة) وإعلاميان (`audit --prod` + `lint`) |
| ثابت البناء | التطبيق **يجب** أن يبني بلا أي متغير بيئة (تُحقّق محلياً وفي CI بخطوة تمنع تسرّب `NEXT_PUBLIC_*`/`SUPABASE_*`/`TURNSTILE_*`/`YOUTUBE_*`) |

## قيود معروفة
- استهداف الأداء: FCP < 800ms، LCP < 1.2s على شبكات 3G/4G المصرية.
- إرسال واتساب آلي خارج النطاق (Phase 2) — الاشتراكات تُخزن فقط.
- نص الكتاب المقدس (فان دايك + أسفار ثانية) يُحمّل كبيانات بذر ضخمة — خطوة نشر مستقلة.
