# System Patterns — الأنماط المعمارية المعتمدة

## 1. التسليم: Static-First + Edge
- صفحات محتوى مستقر: SSG. صفحات الجداول: ISR بفترات مصفوفة IA §3.
- التحديث الفوري عبر `revalidateTag` بأسماء من `src/lib/tags.ts` حصراً — لا أسماء وسوم حرة.

## 2. قراءة/كتابة البيانات
- القراءة: RSC + `unstable_cache(query, keys, { tags, revalidate })` (BACKEND §6).
- الكتابة العامة: Server Action → تحديد المعدل → Zod → Turnstile → عميل service-role (للحجز والتسجيل) أو anon RLS insert — وكل مسار كتابة عام **يفشل مغلقاً**: لا إقرار نجاح بلا صف مُدرَج فعلاً، والخطأ يُعاد برسالة عربية دقيقة. إجراء `submitClinicInquiry` يتبع نفس العقد وإن كان بلا واجهة حالياً.
- الكتابة الإدارية: جلسة `@supabase/ssr` + `getUser()` + فحص `profiles.role` + سياسات `is_staff()`/`is_admin()`.

## 3. نموذج الأدوار
`admin` > `secretary` > `priest` / `servant` — لا صلاحيات كتابة بلا دور. أول مدير: SQL يدوي فقط.

## 4. الثابت اللفظي (CONTEXT §3)
`mass_schedules` لا "فعاليات" — `parishioners` لا "users" — `condolence_booking` لا "إيجار" — `consultation_fee_egp` لا "ticket".

## 5. هيكل المستودع
`src/app` (43 مساراً)، `src/actions` (Server Actions)، `src/lib/{supabase,queries,tags,validations,security,constants,utils,domain,data}`، `src/components/{ui,layout,home,masses,contact,security}`، `docs/{adr,agents}`، `memory-bank/` (يُزامن بداية ونهاية كل مهمة).
- **انضباط حذف الكود الميت**: لا تُترك مكوّنات أو تصديرات غير موصولة. الإثبات المطلوب قبل الحذف هو صفر مستوردين بـ `git grep` **على `HEAD`** (لا على شجرة العمل بعد الحذف)، ثم فحص ما إذا كان الحذف قد يتّم أي تصدير آخر. بهذا أُزيلت `MegaMenu`/`MobileDrawer` ثم `LiveStreamPlayer` ثم (في المرحلة الرابعة) `components/condolence/*` و`components/bible/BibleReader` و`ui/Modal` و`layout/Breadcrumb` و`ui/CopticDivider` — الأخير صار ميتاً لأن `Breadcrumb` كان مستهلكه الوحيد، وكذلك `CardHeader/CardTitle/CardContent/CardDescription/CardFooter` قُلِّمت من `Card.tsx` لذات السبب.
- **تحذير أدوات**: `grep` في صدَفة هذا المستودع دالة غلاف تُفسد `-E` مع `-n`/`-i`/`-c` وتُرجع «0 مطابقة» كاذبة؛ استخدم `git grep` أو `command grep` في كل إثبات وجود/غياب.

## 6. الخصوصية
لا جداول اعترافات أو ماليّة داخلية أصلاً — غياب البنية هو الضمانة (INV-01).

## 7. قنوات التواصل (Contact Channels)
- مكوّن مشترك واحد `src/components/contact/ContactLinks.tsx` يعرض عناصر التواصل (اتصال/واتساب/مجموعة واتساب) ويعيد `null` عند غيابها كلها — يُعرض العنصر فقط عند وجود قيمة غير فارغة في البذرة.
- تحويل الأرقام إلى صيغة دولية يتم حصراً عبر `toWhatsAppUrl` في `src/lib/utils/parish-contact.ts` (يحوّل «0» البادئة إلى كود مصر «20»).
- اشتقاق الفترة (صباحي/مسائي) وتسمياتها مصدره الوحيد `getMassPeriodFromTime` و`getMassPeriodLabel` — لا يجوز تكرار منطق التحويل أو التسمية.
- الثوابت غير المُبذَّرة (رسم الكشف 30-35 ج.م) تُعرَّف مرة واحدة في `src/lib/constants.ts`.

## 8. التنقل والعدّادات المشتقة (Navigation & Derived Counts)
- التنقل مصدره الوحيد `src/components/layout/Header.tsx` (مصفوفة `navLinks` + درج جوّال مدمج). لا تُضاف مكوّنات تنقل بديلة غير موصولة — حُذف `MegaMenu.tsx` و`MobileDrawer.tsx` لهذا السبب تحديداً.
- عدد التخصصات الطبية يُشتق دائماً من `SEED_CLINIC_SPECIALTIES.length`، ورسم الكشف من `CLINIC_CONSULTATION_FEE_MIN_EGP`/`MAX_EGP` في `src/lib/constants.ts` — يُمنع تكرار الأرقام (14 / 30-35) كنصوص صلبة في النصوص أو العناوين أو التذييل.
- تسميات أيام الأسبوع ومؤشرها تُشتق من `DAY_OF_WEEK_LABELS_AR`/`DAY_OF_WEEK_INDEX` في `src/lib/utils/mass-schedule.ts` (يُمنع تكرار خريطة أيام محلية جديدة) — ويشمل ذلك تبويبات الفلترة في `DayTabFilter` وجدول الإدارة؛ لا توجد أي خريطة أيام محلية في `src/` الآن، والإملاء المعتمد «الإثنين».

## 9. حدود الأنواع مع Supabase (Typed Client Boundary)
- `src/types/database.types.ts` يجب أن تبقى **مطابقة تماماً** لشكل `GenericSchema` في إصدار `postgrest-js` المثبَّت: `public.Tables/Views/Functions/Enums/CompositeTypes`، و**كل جدول يجب أن يحمل `Relationships: GenericRelationship[]`** (النقص يُسقط اشتقاق النوع إلى `never`). تُسمى القيود `{table}_{column}_fkey` كما في BACKEND §3 — ويجب مزامنتها مع أسماء قيود DDL الحقيقية.
- يُنشأ عميل Supabase **بلا وسائط نوعية** في `src/lib/supabase/{server,client}.ts` ويُصرَّح بالنوع المقصود على توقيع الدالة (`SupabaseClient<Database>`)، لأن `@supabase/ssr@0.5.2` و`@supabase/supabase-js@2.116` متعارضان في مواقع معاملات `SupabaseClient`. لا يُستخدم `as any` على الاستعلامات؛ إن ظهر `never` في نتيجة استعلام فالخطأ في شكل الأنواع أو في هذه الحدود لا في الاستعلام.
- أنواع نتائج الإجراءات تُشتق في الواجهات عبر `Awaited<ReturnType<typeof action>>` بدل إعادة كتابة شكل النتيجة يدوياً (منع الانحراف بين الخادم والعميل).

## 10. الزمن والمكان (Time & Place)
- كل عرض زمني للجمهور يمر عبر `src/lib/utils/cairo-time.ts` (`PARISH_TIME_ZONE = "Africa/Cairo"`، `formatCairoDateTime`)، ويُمنع قصّ نص UTC ISO أو الاعتماد على منطقة المضيف. تحويل وقت الجدار المحلي إلى لحظة مطلقة يتم بـ `cairoWallClockToInstant` (مرورا مزدوجاً لاحترام التوقيت الصيفي).
- «القداس القادم» يُشتق حصراً من جدول القداسات الفعلي عبر `getNextMass` في `src/lib/utils/mass-schedule.ts`؛ وإن لم يوجد قداس مُفعَّل يُعرض لا شيء بدل موعد مُخترع.

## 11. أسلاج البرامج المؤهلة للتسجيل
- المصدر الوحيد هو `SEED_PROGRAM_SLUGS` في `src/lib/data/seed-data.ts`: صفوف `SEED_SCHOOLS` مُقيَّدة به، و`PROGRAM_SLUGS` في مخطط zod مشتق منه، والحارس `isProgramSlug` يمنع أي سلَج غير مؤهل (تُرجع الصفحة `notFound()`)، ويُمنع أي تحويل صامت إلى برنامج بديل.

## 12. منطقة `/admin` ديناميكية إلزامياً
- `src/app/admin/(protected)/layout.tsx` يحمل `export const dynamic = "force-dynamic"`: فحص الجلسة يجب أن يُعاد تقييمه في كل طلب، وإلا رُسّخت تحويلة الفشل المغلق `redirect("/admin/login")` كتحويلة ثابتة 307 في مخرجات البناء فتُحجب اللوحة عن الطاقم المسجَّل. استمارة الدخول `/admin/login` تبقى خارج المجموعة المحمية وثابتة.

## 13. واجهة Turnstile — النصف العميل (Client Half)
- مكوّن واحد فقط: `src/components/security/TurnstileWidget.tsx` (عميل) يُركَّب في الاستمارات العامة الثلاث، ويحمّل سكربت Cloudflare **مرة واحدة لكل مستند** عبر وعد مُخزَّن على مستوى الوحدة (`?render=explicit`) — لا تكرار للسكربت ولا `next/script`.
- المفتاح العام يُقرأ **بعبارة عضو حرفية** `process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY` لِيُستبدَل في حزمة المتصفح؛ وعند غيابه يُرسم **لا شيء** فتبقى الاستمارات والبناء بلا بيئة عاملين بلا أثر للواجهة.
- العقد: `onVerify(token)` (ويُنادى بـ `""` عند الانتهاء/الخطأ لتفريغ الحقل)، و`onExpire` اختياري، و`resetSignal` تصاعدي يطلب رمزاً جديداً — لأن الرموز أحادية الاستخدام فيجب إعادة الضبط بعد **كل** إرسال لا بعد الفشل فقط.
- الواجهة ليست حدّاً أمنياً: التحقق الخادمي `verifyTurnstile()` يبقى الفيصل، ومخطط zod يشترط الرمز فقط عند وجود مفتاح عام. يُمنع تخفيف أيٍّ منهما أو العودة إلى رمز ثابت (مثل `mock-bypass-token`).

## 14. مسار القراءة العام: عميل بلا كوكيز + تراجع مُعلَن (Observable Fallback)
- كل قراءة عامة في `src/lib/queries.ts` تمر عبر `readOrSeed(queryName, seed, read)` وتستعمل `createPublicSupabaseClient()` من `src/lib/supabase/public.ts` — عميل anon **بلا جلسة وبلا `cookies()`**، لأن `unstable_cache` يعمل خارج نطاق الطلب: استدعاء `cookies()` داخل نطاق الكاش يرمي استثناءً كان يُبتلع سابقاً فتُخزَّن نسخة البذرة بدل بيانات القاعدة (الكاش كان معطّلاً فعلياً).
- **لا تراجع صامت**: كل حالة تراجع تُسجَّل ببنية ثابتة `[queries] database read failed|skipped { query, served: 'seed-data', reason }` والأسباب محصورة في `environment_not_configured` (تُسجَّل مرة لكل عملية) و`query_error` و`empty_result` و`unexpected_error`. البذرة تبقى استراتيجية SSG/offline مقصودة لكنها مرئية دائماً في السجلات.
- القراءات الخاصة بالطاقم (`getCondolenceBookings`) استثناء مقصود: تحتاج الجلسة (`createSupabaseServerClient`) فتُنفَّذ **بلا كاش** ولا تُستدعى إلا من منطقة `/admin` الديناميكية، وبلا أي بذرة بديلة (لا صفوف ملفقة).

## 15. صفحات تعتمد البيانات: غلاف خادمي + طفل عميل
- الصفحات التي تحتاج تفاعلاً (فلاتر/تبويبات/نسخ/طباعة/إجراءات) تُقسَم إلى `page.tsx` خادمي (يقرأ عبر `src/lib/queries.ts` ويصدّر `metadata`) + مكوّن عميل في نفس المجلد يستقبل البيانات كخصائص (`MassesExplorer`, `BibleReaderClient`, `DonationAccountsList`, `AdminMassesTable`, `AdminClinicsGrid`, `BookingsManager`). لا تُستورد `SEED_*` في الصفحات المحوَّلة إطلاقاً.
- الأنواع المشتركة بين البذرة والقاعدة تُعرَّف مرة واحدة في `src/lib/data/seed-data.ts` (مثل `WeeklyMassRow`) وتُعاد تصديرها عبر `queries.ts`، فلا يفرّع المستهلك على مصدر البيانات.

## 16. مصدر واحد لأسفار الكتاب المقدس
- `SEED_BIBLE_BOOKS` في `src/lib/data/seed-data.ts` هو **المصدر الوحيد** للكانون (73 سفراً: 46 + 27، وسِتّها القانونية الثانية)، ومعرّفات الأسفار تُشتق من رقمها القانوني عبر `bibleBookId(order)` وكذلك `book_id` في `SEED_BIBLE_VERSES` — فلا يمكن للقائمة والمراجع أن تختلف.
- كل عدّاد معروض (73/46/27) يُشتق من طول المصفوفة لا من نص صلب، و`getBibleBooks()` يقرأ `bible_books` ويرجع إلى البذرة. نص الأسفار الكامل خارج النطاق (خطوة نشر مستقلة) والمقتطف المعروض في القارئ لا يزال ثابتاً.

## 17. كتابة إدارية موثوقة (Admin Mutations)
- كل إجراء إداري في `src/actions/admin-booking-actions.ts` يبدأ بـ `requireStaff()` ثم يتحقق بـ zod، ثم يكتب **بعميل الجلسة** (لا service-role) لتكون سياسة `is_staff()` هي الحد الثاني.
- **الفشل المغلق**: لا نجاح بلا صف مُتأثّر فعلاً — يتم `update(...).eq("status","pending").select("id, status").maybeSingle()`؛ غياب الصف يعني رسالة «تغيّرت الحالة من جهاز آخر»، وانتهاك `uq_condolence_active_date` يُترجم إلى رسالة تعارض تاريخ. وبعد النجاح فقط `revalidateTag(REVALIDATION_TAGS.condolenceBookings)`.
- الاعتذار يستلزم سبباً مكتوباً (5–500 حرف) يُخزَّن في `rejection_reason`؛ ولا تُعرض أي صفوف ملفقة عند غياب البيانات — حالة فارغة صريحة أو رسالة خطأ عربية.

## 18. البث المباشر: بلا محتوى بديل مُخترع
- يُمنع منعاً باتاً بذر معرّف فيديو أو اسم قناة وهمي في `SEED_STREAM_EVENTS` (`stream_url` يبقى فارغاً في الأساس)، ويُمنع أي رابط يوتيوب صلب في الواجهة.
- رابط القناة الرسمية مصدره `getYoutubeChannelUrl()` (متغير `NEXT_PUBLIC_YOUTUBE_CHANNEL_URL`، اختياري): عند غيابه تُرسم حالة «لم تُضبط قناة البث الرسمية» ولا يُرسم زر؛ والبث المباشر لا يُضمَّن إلا إذا كانت حالته `live` وسجلّه غير مؤرشف و`stream_url` غير فارغ.

## 19. رؤوس الأمن (Security Headers) — CSP مُنفَّذة
- كلها تُحقن من `next.config.ts` على `/:path*` (فتسري على الصفحات الثابتة أيضاً، وقد تُحقّق ذلك بـ `next start` + `curl`): HSTS (`max-age=15552000; includeSubDomains`)، CSP، Permissions-Policy، مع `X-Frame-Options: SAMEORIGIN` و`X-Content-Type-Options: nosniff` و`Referrer-Policy: strict-origin-when-cross-origin`.
- **CSP مُنفَّذة لا Report-Only**، وكل سماح فيها مشتق من متطلب مُقاس في مخرجات البناء لا من تقدير: `'unsafe-inline'` في `script-src` لأن Next يرسم سكربتات `self.__next_f.push` مضمَّنة (22 في الصفحة الواحدة)، و`'unsafe-inline'` في `style-src` لسمات `style=` المضمَّنة. استخدام nonces كان سيُحوّل كل الصفحات إلى ديناميكية فيهدم static-first.
- `upgrade-insecure-requests` تُضاف في الإنتاج فقط، و`'unsafe-eval'` مع `ws:`/`wss:` في التطوير فقط (React Refresh وHMR) — يُمنع تسرّب سماح التطوير إلى البناء الإنتاجي.
- `Permissions-Policy` تعطّل ما لا تحتاجه البوابة (camera/microphone/geolocation/payment/usb/midi/magnetometer/serial) **ولا تمسّ** autoplay/encrypted-media/fullscreen/picture-in-picture لأن إطارَي YouTube/Facebook يطلبانها فعلاً.
- أي إضافة لمضيف خارجي (سكربت/إطار/نقطة اتصال) تستلزم تعديل `next.config.ts` صراحةً — لا يُوسَّع أي توجيه إلى `*`.
- **غير مُتحقَّق بعد**: لم تُختبر CSP في متصفح حقيقي (التحقق بنائي: مخرجات البناء + الرؤوس المُخدَمة)، فالمرشح الأول لأي مخالفة مستقبلية هو `connect-src` أو `frame-src`.

## 20. مصدر واحد لمضيفي التضمين الموثوقين
- `src/lib/security/trusted-embeds.ts` هو المصدر الوحيد: `TURNSTILE_ORIGIN`، `TRUSTED_EMBED_HOSTS` (YouTube/YouTube-nocookie/Facebook)، و`getTrustedEmbedUrl(raw)` التي تقبل `https` على مضيف معتمد فقط (وترفض `http:` و`javascript:` و`data:` والمضيف المنتحل مثل `www.youtube.com.evil.example.com` والقيم الفارغة) وتُرجع الرابط المُطبَّع أو `null`.
- `next.config.ts` يبني `frame-src` من نفس الثابت، و`/live` يمرّر `stream_url` عبر نفس الدالة — فلا يمكن للرأس وللفحص وقت التشغيل أن يفترقا. **قيمة القاعدة لا تصل إلى `src` الإطار أبداً**، وعند الرفض تُعرض حالة عربية صريحة «رابط البث الحالي غير معتمد» (لا إسقاط صامت إلى «غير نشط»).
- الوحدة بلا أي اعتماديات (لا `@/` ولا استيرادات وقت تشغيل) لأن محمّل إعدادات Next يترجمها و`require`sها أثناء تحميل `next.config.ts`.
- `images.remotePatterns` تبقى **فارغة**: لا `next/image` ولا `public/` ولا `<img>` في المشروع، والبديل الشبكي السابق (`hostname: "**"`) كان يجعل `/_next/image` وسيطاً مفتوحاً لكل أصل HTTPS.

## 21. بوابات الجودة (Lint + CI)
- ESLint 9 بصيغة flat في `eslint.config.mjs` يبني `next/core-web-vitals` عبر `FlatCompat` (لأن `eslint-config-next@15.5.x` ما زال بصيغة eslintrc)، وسكربت `lint` هو `eslint .` — ويُمنع الرجوع إلى `next lint` المهجور (يطلب تهيئة تفاعلية تفشل في CI).
- `.github/workflows/ci.yml` بوابتان **صلبتان**: `pnpm exec tsc --noEmit` و`pnpm run build` (بعد خطوة تحرس ثابت «البناء بلا بيئة»: تفشل إن وُجد أي `NEXT_PUBLIC_*`/`SUPABASE_*`/`TURNSTILE_*`/`YOUTUBE_*`)، و`pnpm audit --prod` و`pnpm run lint` **إعلاميان** (`continue-on-error`) حتى تُصلَح المخالفات المتبقية بوعي.
- `pnpm.overrides.postcss` موجود **مؤقتاً**: `next@15.5.25` يثبّت `postcss@8.4.31` (وهي سبب الثغرات الأربع). يُحذف الـ override فقط بعد رفع `next` إلى نسخة تعتمد postcss مُصلَحاً، وإلا عادت الثغرات.

## 22. مصدر واحد لرمز الحجز المرجعي (Booking Reference)
- `src/lib/domain/booking-reference.ts` هو المصدر الوحيد لشكل `COND-XXXXXX`: `BOOKING_REFERENCE_PREFIX = "COND"`، `BOOKING_REFERENCE_BODY_LENGTH = 6`، و`BOOKING_REFERENCE_PLACEHOLDER` **مشتق** منهما (فلا يمكن أن يخالف الشكل الذي يولّده الكود)، ونوع موسوم `BookingReference = string & { readonly [brand]: true }`.
- التوليد عبر `makeBookingReference(shortId)` التي تُبقي العشوائية عند المنادي (`nanoid` في `src/actions/condolence-actions.ts`) فيبقى الملف بلا اعتماديات وقابلاً للاختبار. والتوحيد عبر `normalizeBookingReference(value)` (تشذيب + رفع حالة) المستخدم في الإجراء وفي حقل الإدخال معاً.
- **يُمنع** تكرار نص `COND-` أو إعادة حساب الشكل أو ضبط حالة الأحرف في أي ملف آخر (كان مكرَّراً في 4 مواضع قبل المرحلة الرابعة).
- **قرار مقصود**: لا ترفض الوحدة أي رمز غير مطابق للشكل — الدالة تُوحِّد فقط، والتطابق يقع عند الاستعلام. لو رفضت لتعذّر تتبع أي صف أُدرج يدوياً في القاعدة (نمط `COND-AB12` مثلاً) — ولذلك لا يوجد `isBookingReference` يرفض الإدخال.
- النوع الموسوم يُطبَّق عند حدود **التوليد/التوحيد** فقط؛ أعمدة `database.types.ts` المولَّدة تبقى `string` لأنها مرآة لحقول DDL ولا تُحرَّر يدوياً.

