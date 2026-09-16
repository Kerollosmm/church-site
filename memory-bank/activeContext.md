# Active Context — الحالة الحالية

## أين نحن (2026-09-16)
- **اكتملت**: تمريرة إكمال المرحلة الأولى (Phase-1 Completion Pass) — إغلاق أخطاء الأنواع المتبقية، وإنجاز المهام P1.6 إلى P1.10، مع اكتشاف وإصلاح عيب حجب لوحة الإدارة أثناء التحقق.
- **اكتملت**: تمريرة إغلاق فجوتَي المرحلة الأولى المتبقيتين P1.2 وP1.3 (الفشل المغلق في استفسار المستوصف + تركيب Turnstile الفعلي في الاستمارات العامة) — §4 أدناه.
- **اكتملت**: تمريرة **المرحلة الثانية (P2.1 → P2.6)** — توحيد مسار البيانات (طبقة استعلام واحدة بلا تراجع صامت + عميل عام بلا كوكيز)، تحويل أربع صفحات إلى طبقة البيانات، مصدر واحد لأسفار الكتاب المقدس، إزالة محتوى البث البديل، إجراءات إدارية موثوقة لحجوزات العزاء، وهجرات Supabase مُصدَّرة — §5 أدناه.
- **اكتملت**: تمريرة **المرحلة الثالثة (3.1 → 3.5: التقوية والتشغيل)** — رؤوس أمنية مُنفَّذة (CSP enforcing + HSTS + Permissions-Policy)، تضييق قائمة المضيفين المسموح بها للصور ولإطار البث، رفع `postcss` مع إصلاح `pnpm audit --prod` (4 → 0)، إضافة ESLint، وسير عمل CI ببوابتين صلبتين — §6 أدناه.
- **اكتملت**: تمريرة **المرحلة الرابعة (4.1 → 4.3: القابلية للصيانة وجاهزية النشر)** — حذف 6 ملفات ميتة مُثبَتة، تقليم تصديرات بقيت يتيمة بعد الحذف، توحيد رمز الحجز المرجعي في وحدة نطاق واحدة، ووثيقة `docs/release-readiness.md` — §7 أدناه.
- **الحالة الراهنة**: `tsc --noEmit` = 0 أخطاء، و`pnpm run build` = 52/52 صفحة ثابتة + 4 مسارات إدارية ديناميكية، بلا أي متغيرات بيئة (البناء يعمل بالبذرة)، و`pnpm run lint` = 0/0 على 96 ملفاً، و`pnpm audit --prod` = صفر ثغرات. لم يُعمل أي commit — كل العمل في شجرة العمل.

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



## أدلة التحقق [PROVEN]

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

## الخطوة التالية الفورية
1. **اتّباع `docs/release-readiness.md` بالترتيب**: البوابات الخمس (§1) ثم متغيرات §9.1 (§2) ثم هجرات `supabase/migrations/` وخطوة الـ bootstrap اليدوية (`UPDATE profiles SET role = 'admin' WHERE id = '<uuid>';`) ثم استعلامات التحقق (§3) ثم الفحوص البشرية (§4).
2. تطبيق `supabase/migrations/` على مشروع Supabase (بالترتيب الزمني) ثم **التحقق الفعلي** من: (أ) أسماء القيود المولَّدة (`condolence_bookings_booking_reference_code_key`، `uq_condolence_active_date`، و`{table}_{column}_fkey`) مقابل `Relationships` في `database.types.ts`؛ (ب) أن `track_condolence_booking` تعمل بصلاحية anon؛ (ج) أن سياسة `is_staff()` تسمح لسكرتير باعتماد حجز فعلاً.
3. [متبقٍ من 4.1] تنظيف مرجعي نصي **تُرك عمداً خارج النطاق** (المطلوب كان `docs/` + بنك الذاكرة، وهذه وثائق معيارية تُنقَّى في تمريرة مخصّصة): `AI_DEVELOPER_PROMPT_AND_GUIDELINES.md` يحمل في شجرة المكوّنات `Breadcrumb.tsx` و`CopticDivider.tsx` (المحذوفَين)، و`INFORMATION_ARCHITECTURE.md` سطر 157 يسمّي `LiveStreamPlayer` ضمن مكوّنات `/live`.
4. [متبقٍ من 4.3] **بند §9.3 رقم 7 غير مستوفى**: لا `src/app/sitemap.ts` ولا `src/app/robots.ts`، و`NEXT_PUBLIC_SITE_URL` لا يستهلكه أي كود (`git grep` = 0) — مطلوب قبل Claim النطاق وSearch Console.
4. [متبقٍ من P2.3] بناء الشاشات الإدارية غير المنفَّذة: صندوق رسائل التواصل، طلبات التسجيل والتوظيف، شريط التنبيهات، جدولة البث، ومحرر جداول القداسات/الاستثناءات الموسمية — وهي مُعلَّمة الآن صراحةً في لوحة التحكم. وبقيت معها سطحيات ميتة مقصودة: `refreshStreamData` و`submitJobApplication` و`getSiteAlerts`.
5. [متبقٍ من P2.6] تحميل نص الكتاب المقدس الكامل (فان دايك + الأسفار القانونية الثانية) في `bible_verses`؛ المقتطف المعروض في القارئ ما زال مثالاً ثابتاً لا يتبع السفر المحدد.
6. [متبقٍ] لم تُختبر الواجهة تفاعلياً في متصفح بمفتاح Turnstile حقيقي، ولم يُختبر تدفق اعتماد/اعتذار الحجز على قاعدة بيانات حقيقية (يتطلب البند 2 أولاً) — التحقق هنا بنائي (tsc/build/lint/HTML) وبقراءة كود فقط.
7. [متبقٍ من 3.1] **CSP مُنفَّذة لكن لم تُختبر في متصفح حقيقي**: التحقق كان ببناء المخرجات وقراءة HTML والرؤوس المُخدَمة، لا بتشغيل متصفح. الخطوة العملية: فتح `/contact` (مع مفتاح Turnstile حقيقي) و`/live` (بعد ضبط `stream_url` معتمد) ومراقبة وحدة التحكم لرصد أي مخالفة CSP — والمرشح الأول للتعديل هو `connect-src` أو `frame-src` لا `script-src`.
8. [متبقٍ من 3.5] لم يُشغَّل سير عمل CI على GitHub بعد (لا push ولا PR في هذه التمريرة)؛ صحة YAML والخطوات مُتحقَّقة محلياً فقط.
9. [متبقٍ من 3.3] الإصلاح الفعلي لثغرات `postcss` جاء من `pnpm.overrides` لأن `next@15.5.25` يثبّت `postcss@8.4.31`؛ متى رُفع `next` إلى minor أحدث يعتمد postcss مُصلَحاً يمكن حذف الـ override (لا يجب حذفه قبله، وإلا عادت الثغرات الأربع).
10. [طريقة عمل، من 4.1] عند إثبات حذف أي كود: استخدم `git grep` (أو `command grep`) لا `grep` المجرَّد — فالأخير دالة غلاف في هذه الصدَفة تُفشل `-E` مع `-n`/`-i`/`-c` وتُرجع «0 مطابقة» كاذبة.

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
- حذف المكوّنات الميتة قاعدة مستمرة: قبل حذف أي ملف يُثبَت أولاً بصفر مستوردين بـ `git grep` على `HEAD` (لا على شجرة العمل بعد الحذف)، ويُفحص بعده هل صار أي تصدير يتيماً بسببه.
