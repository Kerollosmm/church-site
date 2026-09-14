# Active Context — الحالة الحالية

## أين نحن (2026-09-14)
- **اكتملت**: تمريرة إصلاح طبقة `src/` (Src-layer fix pass) على ثلاثة بنود:
  1. **رابط الاتصال المباشر**: هاتف استقبال المستوصف 03-5500002 أصبح رابط `tel:035500002` في `src/app/clinics/page.tsx` و`src/app/contact/page.tsx` (حفاظاً على النص وبصرياته مع حالة hover).
  2. **عرض بيانات التواصل من البذرة**: مكون مشترك جديد `src/components/contact/ContactLinks.tsx` يعرض عنصراً فقط عند وجود قيمته (هاتف/واتساب/مجموعة واتساب)، وتم تركيبه في `services/[slug]` (contact_phone + contact_whatsapp)، و`meetings/[slug]` (whatsapp_group_link على كل الـ 11 اجتماعاً)، و`activities/[slug]` (whatsapp_link على 3 من 7 فقط). وتحويل أرقام الواتساب يتم عبر `toWhatsAppUrl` (تحويل الصفر البادئ إلى كود مصر 20). و`education/[slug]` لم يُلمس (لا حقول تواصل في البذرة).
  3. **تنظيفات المراجعة**: توحيد اشتقاق الفترة الزمنية في `getMassPeriodFromTime`، وتسميات الفترة في `getMassPeriodLabel` كمصدر وحيد، وتوليد أزرار الفلترة من مصفوفة، واستنتاج عدد المذابح (`altars.length`) وعدد التخصصات (`SEED_CLINIC_SPECIALTIES.length`)، وتوحيد نص رسم الكشف في `src/lib/constants.ts`، وحذف الثوابت النصية غير المأهولة بالبذرة «المذبح الرئيسي» و«الآباء الكهنة بالتناوب»، وعرض علامة الحالة الإيجابية فقط عند `is_active === true`.
  4. **تطهير بقايا ميزة الأطباء من النسخ الحية والوثائق المعيارية (Doctor-Feature Residual Purge)**: حُذف مسار `clinics/status/page.tsx` ومكوّن `RealtimeAbsenceStrip.tsx` من شجرة `AI_DEVELOPER_PROMPT_AND_GUIDELINES.md`؛ واستُبدلت نصوص الأطباء في `src/components/layout/MegaMenu.tsx` («دليل الأطباء الشامل» → «دليل التخصصات الطبية»)، و`src/app/admin/layout.tsx` («أطباء المستوصف» → «دليل التخصصات الطبية»)، و`src/app/admin/page.tsx` (سطرا 71 و169 فقط)، و`README.md` (§2.1، مخطط §3، الركيزة الثالثة، شجرة §5)، و`docs/adr/0001-static-first-headless-edge-architecture.md` (§1 بندان، INV-01 بند 1، §3.2، §3.3، سجل وسوم §5)، و`memory-bank/productContext.md` (إعادة صياغة شخصية مدام مريم، وحذف شخصية «د. بيتر» وإعادة ترقيم الشخصيات لتطابق PRD §2). أُبقيت المراجع العامة المشروعة: «لتيسير التشخيص على الطبيب» في `src/app/clinics/page.tsx:122` و«معيار المستوصف» في `src/app/admin/page.tsx:132`.
  5. **تنظيفات الشفرة (Code Hygiene)**: حُذف مكوّنا التنقل الميتان `src/components/layout/MegaMenu.tsx` و`MobileDrawer.tsx` (لا يستوردهما أي ملف، ومعظم روابطهما تشير لمسارات غير قائمة) — التنقل الوحيد المعتمد هو `Header.tsx`؛ وأُضيف `.claude/settings.local.json` و`.scratch/` إلى `.gitignore`؛ ووُحّدت قيم رسم الكشف وعدد التخصصات في 8 مواضع عبر `src/app/clinics/page.tsx`، `src/app/clinics/specialties/page.tsx`، `src/components/layout/Footer.tsx`، `src/components/home/HeroBanner.tsx`، `src/components/home/QuickServiceGrid.tsx` لتشتق من `CLINIC_CONSULTATION_FEE_MIN_EGP`/`MAX_EGP` و`SEED_CLINIC_SPECIALTIES.length`.

## المقارنة بين المحفوظ والمستبعد (Kept vs Dropped)
- **ما تم الاحتفاظ به (Kept)**: دليل العيادات الـ 14 مع أرقام الغرف، والتسعيرة الرمزية (30-35 ج.م)، وهاتف الاستقبال 03-5500002، والجماليات البصرية والتصميم القبطي.
- **ما تم استبعاده (Dropped)**: ميزة الأطباء بالكامل، جداول تواجد الأطباء، بطاقات الأطباء الفردية، وشاشات إدارة الأطباء.

## أدلة التحقق [PROVEN]
- فحص الأنواع: `pnpm exec tsc --noEmit` = 0 أخطاء (خروج 0).
- خلو الشفرة البرمجية: `git grep -in "doctor" -- src/` = 0 أسطر (خروج 1).
- خلو الروابط القديمة: `git grep -rn "/clinics/doctors" src/` = 0 أسطر (خروج 1).
- تمريرة تطهير بقايا الأطباء (النسخ والوثائق): `pnpm exec tsc --noEmit` = 0 أخطاء (خروج 0)، و`pnpm run build` = 55/55 صفحة (خروج 0)، و`git grep -in "doctor" -- src/` = 0 أسطر (خروج 1).
- تمريرة تنظيفات الشفرة (Code Hygiene): `pnpm exec tsc --noEmit` = 0 (خروج 0)، و`pnpm run build` = 55/55 صفحة (خروج 0)، و`git grep -n "MegaMenu\|MobileDrawer\|MEGA_MENU_CATEGORIES\|MegaCategory" -- src/` = 0 أسطر، و`git grep -n "الـ 14\|14 تخصص\|14 عيادة" -- src/` = 0 أسطر، ولم يبقَ «30-35» إلا في تعليقات `src/lib/constants.ts`. وفحص HTML المولّد: القيم المعروضة ما زالت صحيحة (14 عيادة/تخصصاً، و«قيمة الكشف: 30 إلى 35 جنيهاً مصرياً فقط»، و«30-35 ج» في بطاقة كل تخصص)، وصفر ظهور لـ `undefined`/`NaN` في النص المرئي لأي صفحة (كل الظهورات داخل وسوم `script`).
- مسارات وبناء الإنتاج: 43 مساراً مفعلاً (43 routes)، وبناء الإنتاج `pnpm run build` = 55/55 صفحة بنجاح (55 pages built).
- تحقق من HTML المولّد فعلياً [PROVEN]: `tel:035500002` في `contact.html` و`clinics.html`؛ `https://wa.me/201220000004` في `services/educational-center.html`؛ لا كتلة تواصل في `services/canteens.html` (الحقلان null)؛ لا رابط واتساب في `services/church-giftshop.html` (contact_whatsapp = null)؛ «مجموعة واتساب» مرة واحدة في `activities/scouts.html` وصفر في `activities/lending-library.html` و`social-club.html`؛ `wa.me/20122000000{1,2,3}` في `about/clergy.html`؛ صفر نتائج لـ «الآباء الكهنة بالتناوب» و«المذبح الرئيسي» في `masses.html`؛ صفر نتائج لـ «نبض»/availability/ticker في كل الصفحات المولّدة.

## الخطوة التالية الفورية
1. نشر التطبيق على Vercel أو بيئة الاستضافة السحابية المعتمدة.
2. ربط مفاتيح Supabase الحية (URL و ANON_KEY و SERVICE_ROLE_KEY) وتنفيذ DDL الرسمي.
3. مراجعة وتحديث أرقام هواتف الآباء الكهنة والحسابات البنكية بعد التوقيع الرسمي للإدارة الكنسية.
4. [مكتمل — `e87713c`] ملاحظات المراجعة المزدوجة الثانية على مستوى الوثائق: حُذف §3.2.2 «نبض العيادات» و`/clinics/status` من PRD، وطُهّرت مراجع الأطباء من `docs/agents/domain.md` و`AI_DEVELOPER_PROMPT_AND_GUIDELINES.md`، وصُحّح عدّ المسارات إلى 43.
5. [مكتمل] تطهير بقايا ميزة الأطباء من النسخ الحية والوثائق المعيارية: حُذف `clinics/status/page.tsx` و`RealtimeAbsenceStrip.tsx` من شجرة `AI_DEVELOPER_PROMPT_AND_GUIDELINES.md`، واستُبدل «أطباء المستوصف» في `src/app/admin/layout.tsx`، و«تحديث بيانات الأطباء» و«تعديل مواعيد أطباء العيادات الخارجية التخصصية» في `src/app/admin/page.tsx`، و«دليل الأطباء الشامل» في `src/components/layout/MegaMenu.tsx`، مع `README.md` و`docs/adr/0001` و`memory-bank/productContext.md`. المراجع المتبقية محصورة في السجلات التاريخية والمراجع العامة المشروعة.

## قرارات معتمدة
- قرار معتمد نهائي (Approved Decision): البوابة الرقمية لن تنشر أبداً أسماء الأطباء الفردية أو جداولهم الشخصية (the portal will never publish individual doctor names or schedules)، منعاً للإرباك وتضارب الاعتذارات وللحيادية الرعوية.
- دليل العيادات التخصصي: 14 تخصصاً طبياً مع أرقام الغرف والتسعيرة الرمزية للكشف (30-35 ج.م) وهاتف استقبال العيادات (03-5500002) والاتصال المباشر دون نشر أطباء أو أشرطة اعتذار.
- INV-01: بنية منفصلة تماماً بدون تسجيل دخول للخدمات العامة، حجز العزاء بنظام تتبع علني مشفر (COND-XXXXXX).
- INV-03: عدم عرض شارات توفر أو غياب غير دقيقة أو وهمية.
- ألوان وهوية قبطية ملكية: كحلي قبطي، ذهبي معتم للنصوص لضمان تباين WCAG 2.1 AA، وخطوط عربية كوفية وأميري.
- الحقول القانونية: الالتزام الصارم بحقول البذرة ومخطط DDL دون ابتداع حقول غير مأهولة.
- قرار معتمد: تنقية الثوابت النصية الاحتياطية غير المأهولة بالبذرة (عدم اختراع بيانات للكاهن المصلي) مع الإبقاء على التركيب المشتق من بيانات حقيقية فقط (مثل `قداس يوم ${dayName}`).
