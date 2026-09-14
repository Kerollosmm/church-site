# دليل المطور وموجه الذكاء الاصطناعي الشامل (AI Developer Prompt & Design System)
## البوابة الرقمية لكنيسة القديسين مكسيموس ودوماديوس والشهيد الأنبا موسى الأسود
**الإصدار:** 1.1.0 | **المعيار:** Next.js 15 / Tailwind CSS / Supabase (@supabase/ssr) / TypeScript | **الهوية:** Coptic Orthodox Heritage

---

## 1. الموجه الشامل للذكاء الاصطناعي (Master AI Prompt to Copy-Paste)

> **إرشادات الاستخدام**: يمكن للمطور نسخ المربع البرمجي أدناه بالكامل وتقديمه لأي نموذج ذكاء اصطناعي لبناء الموقع بالكامل خطوة بخطوة وبأعلى مستويات الدقة والالتزام المعماري.

```markdown
You are an expert full-stack engineer and digital artisan specializing in Next.js 15 (App Router), TypeScript, Tailwind CSS, and Supabase (via the official `@supabase/ssr` package — never the deprecated `@supabase/auth-helpers-nextjs`).
Your mission is to build the complete, production-ready, accessible, and high-performance official web portal for:
"كنيسة القديسين مكسيموس ودوماديوس والشهيد الأنبا موسى الأسود"
(Church of Saints Maximus & Domadius and St. Moses the Black - Alexandria, Coptic Orthodox Church).

### Core Architectural Invariants:
1. Reference Model: Modeled upon the UX paradigm of 'https://stathanasius-elseyouf.com/', separating heavy internal parish administration from a fast, open, public-facing parish portal.
2. Zero-Auth Public Experience: Visitors, parishioners, and senior citizens must access mass schedules, clinic directories, meetings, and schools without login walls. Direct WhatsApp and phone deep links for immediate connection.
3. Coptic Spiritual Aesthetics: Reverent palette featuring Royal Coptic Navy (#1E2A78), Divine Gold (#C5A880), Warm Marble Alabaster (#FAF8F5), and Dark Slate (#1E293B), with authentic Coptic cross ornaments and typography.
4. Strict RTL & Mobile-First: Arabic is primary, responsive down to 320px screens, with font-resizing controls for elderly parishioners.
5. Full 35+ Page Routes: Core Parish, 14 Clinic Specialties, 11 Distinct Age-Group Meetings, 5 Ecclesial Academies, 7 Parochial Activities, 8 Public Services & Facilities, Condolence Booking (+ Public Reference Tracking), Live Streaming, Canonical Coptic Bible Reader, and Official Bank Donations.

Execute the implementation adhering strictly to the file structure, design tokens, SQL schema, and seed data provided below.
```

---

## 2. نظام التوكنات والهوية البصرية القبطية (Coptic Design Tokens)

### 2.1 لوحة الألوان المعتمدة (Color Palette)

```typescript
// tailwind.config.ts - Extended Colors
export const churchPalette = {
  // الأزرق القبطي الملوكي (رمز السماء والعمق اللاهوتي)
  copticNavy: {
    DEFAULT: "#1E2A78",
    50: "#EEF1FA",
    100: "#DCE2F5",
    200: "#B8C4EB",
    500: "#1E2A78",
    600: "#182260",
    700: "#131A49",
    800: "#0D1131",
    900: "#07091A",
  },
  // الذهب البيزنطي القبطي (رمز المجد الإلهي والخلود)
  copticGold: {
    DEFAULT: "#C5A880",
    50: "#F9F6F1",
    100: "#F2ECE2",
    200: "#E6D8C4",
    300: "#D9C5A7",
    400: "#CDB38B",
    500: "#C5A880",
    600: "#B08E5F",
    700: "#8B6F45",
    800: "#655030",
    900: "#3F321C",
  },
  // خلفية الرخام الأبيض الدافئ (رمز الطهارة وراحة القراءة)
  alabasterBg: "#FAF8F5",
  surfaceCard: "#FFFFFF",
  slateText: {
    primary: "#1E293B",   // نصوص العناوين الرئيسية
    secondary: "#475569", // النصوص التوضيحية
    muted: "#64748B",     // التواريخ والشروحات الجانبية
  },
  status: {
    presentGreen: "#15803D",
    absentRed: "#DC2626",
    pendingYellow: "#D97706", // حجز قيد المراجعة
  }
};
```

### 2.2 منظومة الخطوط والطباعة (Typography Hierarchy)

- **خط العناوين الرئيسية والهوية**: `Noto Kufi Arabic` و `Alexandria` (أوزان: 700 Bold و 800 ExtraBold).
- **خط القراءة والنصوص الطويلة**: `Noto Sans Arabic` (أوزان: 400 Regular و 500 Medium) مع تباعد أسطر مريح (`line-height: 1.8`).
- **خط الآيات الإنجيلية والصلوات الطقسية**: `Amiri` أو `Scheherazade New` (أوزان: 700 Bold مع علامات التشكيل).
- **خط الأرقام والتواريخ الإنجليزية**: `Outfit` أو `Inter`.

### 2.3 الزخارف والرموز البصرية القبطية (Coptic Visual Accents)
- استخدام الصليب القبطي ذي الفصوص الأربعة والأطراف الثلاثية كعنصر فني في فواصل الأقسام (`Divider`).
- زوايا بطاقات ناعمة (`rounded-2xl`) مع حدود مذهبة رقيقة (`border border-copticGold/20`).
- تأثيرات ظلال راقية مستوحاة من عمارة الكنائس القبطية (`shadow-sm hover:shadow-md transition-all duration-300`).
- **قاعدة تباين إلزامية (v1.1)**: الذهبي `#C5A880` للزخرفة والحدود فقط على الخلفيات الفاتحة (تباينه ~2.4:1 فقط)؛ للنصوص الذهبية على الفاتح استخدم `copticGold-700` (`#8B6F45`) أو أغمق حفاظاً على معيار WCAG AA.

---

## 3. شجرة الملفات الكاملة للمشروع (Project Structure)

```text
church-site/
├── public/
│   ├── assets/
│   │   ├── coptic-cross.svg
│   │   ├── arabesque-pattern.png
│   │   └── default-avatar.png
│   ├── fonts/
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── about/
│   │   │   ├── history/page.tsx
│   │   │   ├── altars/page.tsx
│   │   │   └── clergy/page.tsx
│   │   ├── masses/page.tsx
│   │   ├── clinics/
│   │   │   ├── page.tsx
│   │   │   ├── specialties/page.tsx
│   │   │   └── status/page.tsx
│   │   ├── meetings/
│   │   │   ├── [slug]/page.tsx
│   │   │   └── page.tsx
│   │   ├── education/
│   │   │   ├── [slug]/page.tsx
│   │   │   └── page.tsx
│   │   ├── activities/
│   │   │   ├── [slug]/page.tsx
│   │   │   └── page.tsx
│   │   ├── services/
│   │   │   ├── [slug]/page.tsx
│   │   │   └── page.tsx
│   │   ├── condolence/
│   │   │   ├── page.tsx
│   │   │   └── track/page.tsx
│   │   ├── live/page.tsx
│   │   ├── bible/page.tsx
│   │   ├── donations/page.tsx
│   │   ├── contact/page.tsx
│   │   └── admin/
│   │       ├── layout.tsx
│   │       ├── page.tsx
│   │       ├── clinics/page.tsx
│   │       ├── masses/page.tsx
│   │       └── bookings/page.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── MegaMenu.tsx
│   │   │   ├── MobileDrawer.tsx
│   │   │   ├── QuickActionBar.tsx
│   │   │   ├── Breadcrumb.tsx
│   │   │   └── Footer.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── CopticDivider.tsx
│   │   │   └── FontSizeSwitcher.tsx
│   │   ├── home/
│   │   │   ├── HeroBanner.tsx
│   │   │   ├── NextMassCountdown.tsx
│   │   │   ├── QuickServiceGrid.tsx
│   │   │   ├── BibleVerseDaily.tsx
│   │   │   └── LatestNewsCarousel.tsx
│   │   ├── clinics/
│   │   │   └── RealtimeAbsenceStrip.tsx
│   │   ├── masses/
│   │   │   ├── WeeklyMassTable.tsx
│   │   │   ├── AltarSelectDropdown.tsx
│   │   │   └── DayTabFilter.tsx
│   │   └── condolence/
│   │       ├── CondolenceBookingForm.tsx
│   │       └── ReservationTrackingCard.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   ├── admin.ts
│   │   │   ├── queries.ts          # استعلامات مقروءة مغلّفة بـ unstable_cache مع وسوم إعادة التحقق
│   │   │   └── tags.ts             # سجل وسوم إعادة التحقق الموحد (Revalidation Tag Registry)
│   │   ├── utils/
│   │   │   ├── coptic-date.ts
│   │   │   └── formatters.ts
│   │   └── validations/
│   │       └── church-schemas.ts
│   ├── types/
│   │   └── database.types.ts
│   └── actions/
│       ├── clinic-actions.ts
│       ├── condolence-actions.ts
│       ├── contact-actions.ts
│       ├── enrollment-actions.ts
│       └── stream-actions.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. بيانات البذر الأولية الشاملة (Complete Production Seed Data)

```sql
-- =============================================================================
-- بيانات البذر الرسمية لكنيسة القديسين مكسيموس ودوماديوس والشهيد الأنبا موسى الأسود
-- ⚠️ تنبيه إلزامي (v1.1): أسماء الآباء الكهنة، الهواتف، وأرقام الحسابات البنكية/IBAN أدناه
-- تُعامل كـ PLACEHOLDER يتعذر التحقق منه آلياً. يجب اعتمادها رسمياً من إدارة الكنيسة
-- قبل النشر — لا تنشر أبداً أرقام حسابات غير مُتحقق منها (خطر الاحتيال المالي).
-- =============================================================================

-- 1. المذابح الكنسية الثلاثة
INSERT INTO altars (name_ar, name_en, patron_saint, consecration_date, description_ar, display_order) VALUES
(
    'المذبح الأوسط الرئيسي',
    'Main Altar',
    'القديسان مكسيموس ودوماديوس أميرا الروم',
    '1985-05-15',
    'المذبح التاريخي الأوسط للكنيسة، مكسو بالرخام التوسكاني ومزين بأيقونة البانتوقراطورة والحضن الأبوي، وتقام عليه قداسات الآحاد والأعياد السيدية الكبرى.',
    1
),
(
    'المذبح البحري',
    'Northern Altar',
    'الشهيد العظيم القوي الأنبا موسى الأسود',
    '1987-07-01',
    'مذبح مجاور لمزار رفات الشهيد الأنبا موسى الأسود، تقام عليه القداسات الإلهية ونهضة القديس السنوية، ويعد منارة للرجاء والتوبة الروحية.',
    2
),
(
    'المذبح القبلي',
    'Southern Altar',
    'والدة الإله القديسة مريم والشهيد العظيم مارجرجس',
    '1990-11-17',
    'مذبح مبارك مكرس على اسم السيدة العذراء مريم والشهيد مارجرجس، تقام عليه قداسات فجر الجمعة والسبت وصلوات التسابيح والعشيات.',
    3
);

-- 2. مجمع الآباء الكهنة الموقرين
INSERT INTO clergy (clerical_name_ar, clerical_name_en, rank_title_ar, ordination_date, feast_day, responsibilities_ar, confession_hours_ar, phone_office, whatsapp_number, display_order) VALUES
(
    'القمص مكسيموس وصفي',
    'Fr. Maximus Wasfy',
    'قمص',
    '1986-06-22',
    '17 طوبة (عيد القديسين مكسيموس ودوماديوس)',
    'وكيل الكنيسة والمشرف العام على مجمع الكهنة وشؤون الرعاية ومستوصف الكنيسة التخصصي.',
    'الإثنين والأربعاء من 6:00 م حتى 9:00 م (بالمكتب الرعوي)',
    '03-5551234',
    '01220000001',
    1
),
(
    'القس موسى إبراهيم',
    'Fr. Moussa Ibrahim',
    'قس',
    '2004-11-14',
    '24 بؤونة (عيد استشهاد القديس الأنبا موسى الأسود)',
    'المسؤول عن قطاع التربية الكنسية (المرحلة الإعدادية والثانوية) ومعهد كاروز لإعداد الخدام وفوج الكشافة والمرشدات.',
    'الثلاثاء والخميس من 6:30 م حتى 9:30 م',
    '03-5551235',
    '01220000002',
    2
),
(
    'القس يوحنا فرج',
    'Fr. Youhanna Farag',
    'قس',
    '2012-02-19',
    '4 طوبة (عيد القديس يوحنا الإنجيلي)',
    'مسؤول شؤون الأسرة والزواج، اجتماع الخريجين ني أنجيلوس، ومكتب التوظيف والخدمات المجتمعية.',
    'السبت من 5:00 م حتى 8:00 م والأحد بعد القداس الإلهي',
    '03-5551236',
    '01220000003',
    3
);

-- 3. تخصصات العيادات الطبية الـ 14
INSERT INTO clinic_specialties (name_ar, name_en, slug, description_ar, room_number, icon_name, display_order) VALUES
('الباطنة والجهاز الهضمي', 'Internal Medicine', 'internal-medicine', 'تشخيص وعلاج أمراض الباطنة، السكر، ضغط الدم، وأمراض الكبد والجهاز الهضمي.', 'عيادة 101', 'Activity', 1),
('طب الأطفال وحديثي الولادة', 'Pediatrics', 'pediatrics', 'رعاية الأطفال منذ الولادة ومتابعة التطور الحركي والذهني والتطعيمات الدورية.', 'عيادة 102', 'Baby', 2),
('جراحة العظام والمفاصل', 'Orthopedics', 'orthopedics', 'علاج الكسور، آلام العمود الفقري، التهابات المفاصل، وتأهيل إصابات الملاعب.', 'عيادة 103', 'Bone', 3),
('الجراحة العامة والمناظير', 'General Surgery', 'general-surgery', 'مناظير الجهاز الهضمي، الجراحات الصغرى، وجراحة الغدد والأورام.', 'عيادة 104', 'Scissors', 4),
('النساء والتوليد', 'Obstetrics & Gynecology', 'obgyn', 'متابعة الحمل الحرج، فحص الجنين بالموجات الصوتية رباعية الأبعاد، وعلاج تأخر الإنجاب.', 'عيادة 105', 'HeartPulse', 5),
('طب وجراحة الأسنان', 'Dentistry', 'dentistry', 'حشو الأسنان، علاج الجذور، تجميل الأسنان، وزراعة الأسنان بأحدث الأجهزة المعقمة.', 'عيادة 106', 'Smile', 6),
('طب وجراحة العيون', 'Ophthalmology', 'ophthalmology', 'فحص قاع العين، قياس ضغط العين، تصحيح الإبصار، وعمليات المياه البيضاء.', 'عيادة 107', 'Eye', 7),
('الأنف والأذن والحنجرة', 'ENT', 'ent', 'علاج حساسية الجيوب الأنفية، التهابات الأذن الوسطى، ومقاييس وضغط السمع.', 'عيادة 108', 'Ear', 8),
('الأمراض الجلدية والليزر', 'Dermatology', 'dermatology', 'علاج الصدفية، الإكزيما، تساقط الشعر، وحب الشباب بالليزر المعتمد.', 'عيادة 109', 'Sparkles', 9),
('العلاج الطبيعي والتأهيل', 'Physiotherapy', 'physiotherapy', 'أحدث أجهزة التردد الحراري والكهربائي للتأهيل الحركي وما بعد العمليات الجراحية.', 'صالة التأهيل', 'Accessibility', 10),
('أمراض القلب والأوعية', 'Cardiology', 'cardiology', 'رسم قلب متقدم، موجات إيكو، ومتابعة قصور الشرايين التاجية وضغط الدم المرتفع.', 'عيادة 110', 'Heart', 11),
('المخ والأعصاب والطب النفسي', 'Neurology & Psychiatry', 'neurology', 'علاج اضطرابات النوم، الصداع المزمن، الشلل الرعاش، والاستشارات النفسية الأسرية.', 'عيادة 111', 'Brain', 12),
('المعمل والتحاليل الطبية', 'Medical Laboratory', 'laboratory', 'فحوصات الدم الشاملة، وظائف الكبد والكلى، دلالات الأورام، وباقات الكشف الدوري.', 'الدور الأول', 'FlaskConical', 13),
('الصيدلية الخيرية المفتوحة', 'Charitable Pharmacy', 'pharmacy', 'صرف الأدوية المزمنة للمحتاجين بأسعار رمزية وتوفير الأدوية الحيوية.', 'المدخل الخارجي', 'Pill', 14);

-- 4. جدول القداسات الأسبوعية
INSERT INTO mass_schedules (altar_id, day_of_week, title_ar, start_time, end_time, target_group_ar, notes_ar)
SELECT id, 'Sunday', 'قداس الأحد الصباحي الأول', '06:00:00', '08:30:00', 'عام لجميع الشعب', 'مصحوب بكلمة روحية قصيرة وعرض ألحان الشمامسة'
FROM altars WHERE name_ar = 'المذبح الأوسط الرئيسي';

INSERT INTO mass_schedules (altar_id, day_of_week, title_ar, start_time, end_time, target_group_ar, notes_ar)
SELECT id, 'Sunday', 'قداس الأحد الصباحي الثاني', '08:30:00', '11:00:00', 'طلبة الجامعات والأسر', 'ينعقد بالتوازي مع مدارس الأحد الصباحية'
FROM altars WHERE name_ar = 'المذبح البحري';

INSERT INTO mass_schedules (altar_id, day_of_week, title_ar, start_time, end_time, target_group_ar, notes_ar)
SELECT id, 'Wednesday', 'قداس الأربعاء الباكر', '05:30:00', '07:30:00', 'الموظفين وأصحاب الأعمال والطلبة', 'ينتهي باكراً لإتاحة الفرصة للذهاب للعمل والدراسة'
FROM altars WHERE name_ar = 'المذبح الأوسط الرئيسي';

INSERT INTO mass_schedules (altar_id, day_of_week, title_ar, start_time, end_time, target_group_ar, notes_ar)
SELECT id, 'Friday', 'قداس الجمعة الرئيسي الشامل', '07:00:00', '09:30:00', 'شعب الكنيسة وأسر التربية الكنسية', 'يليه مباشرة اجتماعات مدارس الأحد لكافة المراحل'
FROM altars WHERE name_ar = 'المذبح القبلي';

-- 5. اجتماعات التربية الكنسية الـ 11
INSERT INTO church_meetings (name_ar, slug, target_age_ar, motto_verse_ar, bible_reference, day_of_week, start_time, end_time, location_hall_ar, servant_in_charge_ar, description_ar, display_order) VALUES
('اجتماع الملائكة (حضانة)', 'malaeika', 'مرحلة الحضانة (KG1 و KG2)', 'دَعُوا الأَوْلاَدَ يَأْتُونَ إِلَيَّ وَلاَ تَمْنَعُوهُمْ لأَنَّ لِمِثْلِ هؤُلاَءِ مَلَكُوتَ اللهِ', 'مرقس 10: 14', 'Friday', '08:30:00', '10:30:00', 'قاعات مبنى الخدمات - الدور الثاني', 'تاسوني مارينا ميخائيل', 'خدمة مبهجة تعتمد على الأناشيد القبطية المبسطة، مسرح العرائس، والتلوين وتنمية حب الكنيسة في نفوس الأطفال.', 1),
('اجتماع ابتدائي صغار (1-3)', 'ebtedaey-1-3', 'الصفوف الأول والثاني والثالث الابتدائي', 'تَعَالَوْا أَيُّهَا الْبَنُونَ اسْتَمِعُوا إِلَيَّ فَأُعَلِّمَكُمْ مَخَافَةَ الرَّبِّ', 'مزمور 34: 11', 'Friday', '10:30:00', '12:30:00', 'القاعة الكبرى للقديس مكسيموس', 'الشماس مينا فوزي', 'برنامج متكامل يضم دروس الكتاب المقدس، تاريخ الكنيسة وسير القديسين، الألحان، والأنشطة الترفيهية.', 2),
('اجتماع ابتدائي كبار (4-6)', 'ebtedaey-4-6', 'الصفوف الرابع والخامس والسادس الابتدائي', 'يَا ابْنِي أَعْطِني قَلْبَكَ، وَلْتُلاَحِظْ عَيْنَاكَ طُرُقِي', 'أمثال 23: 26', 'Friday', '10:30:00', '12:30:00', 'قاعة الشهيد الأنبا موسى الأسود', 'الشماس بيشوي فؤاد', 'بناء الشخصية المسيحية القوية، مسابقات إنجيلية، دورات رياضية، ورحلات تثقيفية شهرية.', 3),
('اجتماع المرحلة الإعدادية', 'edaady', 'بنين وبنات المرحلة الإعدادية', 'لاَ يَسْتَهِنْ أَحَدٌ بِحَدَاثَتِكَ، بَلْ كُنْ قُدْوَةً لِلْمُؤْمِنِينَ', '1 تيموثاوس 4: 12', 'Thursday', '18:00:00', '20:00:00', 'مسرح الكنيسة الرئيسي', 'أ. ميخائيل مجدي', 'جلسات حوارية تفاعلية لمواجهة تحديات سن المراهقة، معالجة التساؤلات الإيمانية، وأنشطة كشفية وروحية.', 4),
('اجتماع المرحلة الثانوية', 'thanaway', 'شباب وشابات المرحلة الثانوية', 'اذْكُرْ خَالِقَكَ فِي أَيَّامِ شَبَابِكَ', 'جامعة 12: 1', 'Friday', '18:30:00', '20:30:00', 'القاعة الكبرى للقديسين', 'م. فادي عاطف', 'تثبيت العقيدة الأرثوذكسية، اللاهوت الدفاعي، الإرشاد المهني والدراسي لطلاب الثانوية العامة.', 5),
('أسرة شباب عرشي (جامعيين)', 'arshi-youth', 'طلبة وطالبات الجامعات والمعاهد العليا', 'أَسْتَطِيعُ كُلَّ شَيْءٍ فِي الْمَسِيحِ الَّذِي يُقَوِّينِي', 'فيلبي 4: 13', 'Sunday', '19:00:00', '21:00:00', 'مسرح الكنيسة الرئيسي', 'د. أنطون سمير', 'ملتقى فكري وروحي وثقافي لشباب الجامعة يناقش الفلسفة المعاصرة، العمل المجتمعي، والتهيئة لسوق العمل.', 6),
('اجتماع ني أنجيلوس (خريجين)', 'ni-angelos', 'الخريجون وأصحاب المهن الحرة والموظفون', 'كُونُوا رَاسِخِينَ، غَيْرَ مُتَزَعْزِعِينَ، مُكْثِرِينَ فِي عَمَلِ الرَّبِّ كُلَّ حِينٍ', '1 كورنثوس 15: 58', 'Saturday', '19:30:00', '21:30:00', 'قاعة المؤتمرات - الدور الرابع', 'م. يوسف كامل', 'رعاية الخريجين الجدد، مناقشة قضايا العمل والنزاهة المهنية، والتوجيه نحو تأسيس بيوت مسيحية ناجحة.', 7),
('اجتماع الأسرة المقدسة', 'holy-family', 'المتزوجون حديثاً والأسر الشابة', 'أَمَّا أَنَا وَبَيْتِي فَنَعْبُدُ الرَّبَّ', 'يشوع 24: 15', 'Wednesday', '19:00:00', '21:00:00', 'صحن الكنيسة الرئيسي', 'أ. مدحت سمير وتاسوني نجوى', 'إرشاد زوجي وتربوي متخصص، حل الخلافات الأسرية، تربية الأبناء في ضوء تعاليم الإنجيل.', 8),
('اجتماع رجال القديس يوسف النجار', 'men', 'الرجال وأرباب الأسر وكبار السن', 'تَصَرَّفُوا كرِجَالٍ. تَقَوَّوْا. لِتَصِرْ كُلُّ أُمُورِكُمْ فِي مَحَبَّةٍ', '1 كورنثوس 16: 13-14', 'Tuesday', '18:30:00', '20:30:00', 'قاعة الشهيد الأنبا موسى', 'أ. مجدي خليل', 'مشاركة روحية واجتماعية تسند الآباء في مسؤولياتهم الجسيمة وتوفر دعماً أخوياً متيناً.', 9),
('اجتماع أم الخلاص للسيدات', 'om-elkhalas', 'الأمهات والسيدات وربات البيوت', 'امْرَأَةٌ فَاضِلَةٌ مَنْ يَجِدُهَا؟ لأَنَّ ثَمَنَهَا يَفُوقُ اللآلِئَ', 'أمثال 31: 10', 'Monday', '10:00:00', '12:00:00', 'صحن الكنيسة الرئيسي', 'تاسوني سامية عزيز', 'صلاة رفع بخور عشية ودراسة كتاب وندوات صحية وتدبير منزلي وإشراف روحي.', 10),
('اجتماع الشهيد مارمينا والبابا كيرلس', 'widows-orphans', 'كبار السن والأرامل وذوي الهمم', 'آبٌ للأيتام وقاضٍ للأرملة، الله في مسكنه المقدس', 'مزمور 67: 6', 'Wednesday', '10:00:00', '12:00:00', 'القاعة الأرضية المهيأة للكراسي المتحركة', 'PLACEHOLDER - يُحدَّد أمين الخدمة من إدارة الرعاية', 'خدمة الافتقاد ومساندة الأرامل وكبار السن وذوي الهمم بزيارات أسبوعية ورعاية روحية وإفادات كنسية.', 11);

-- 6. المدارس والأكاديميات الكنسية
INSERT INTO schools_academies (name_ar, slug, category_type, curriculum_summary_ar, academic_stages_count, registration_open, responsible_servant_ar, study_schedule_ar) VALUES
('مدرسة القديس إستفانوس للشمامسة', 'deacon-school', 'deacon_school', 'تعليم طقس وألحان الكنيسة القبطية الأرثوذكسية، مردات القداسات، واللغة القبطية وقواعدها.', 4, TRUE, 'المعلم جورج أنور', 'الجمعة من 1:00 ظ حتى 3:30 م بجميع فصول الكنيسة'),
('معهد الكتاب المقدس للكبار', 'adult-bible', 'bible_institute', 'دراسة أكاديمية معمقة للعهدين القديم والجديد، علم المخطوطات، وتفسير الآباء الأولين.', 4, FALSE, 'د. مراد وهبة', 'الأحد والثلاثاء من 7:00 م حتى 9:30 م بقاعة القديس ديديموس'),
('معهد كاروز لإعداد الخدام', 'karouz-academy', 'servant_prep', 'إعداد الخادم الأرثوذكسي روحياً ولاهوتياً ونفسياً مع تدريب عملي ميداني في التربية الكنسية.', 2, TRUE, 'أ. صموئيل متى', 'السبت من 6:00 م حتى 9:00 م بالمسرح الرئيسي'),
('مدرسة قيثارة التسابيح والكورال', 'cithara-choir', 'choir', 'تدريب الأصوات، الصولفيج الكنسي، مرافقة الدف والمثلث، وتسجيل الترانيم التراثية.', 3, TRUE, 'أ. رفيق وليم', 'الخميس من 7:00 م حتى 9:00 م'),
('مدرسة الكتاب المقدس للأطفال', 'children-bible', 'children_bible', 'تبسيط أسفار الكتاب المقدس وقصص الآباء والأنبياء عبر الوسائط التفاعلية والرسوم المتحركة والمسابقات الذهنية الأسبوعية.', 2, FALSE, 'PLACEHOLDER - يُحدَّد من إدارة التربية الكنسية', 'الجمعة بعد قداس الصباح — قاعة الأطفال');

-- 7. الحسابات البنكية المعتمدة للتبرعات
INSERT INTO donation_accounts (bank_name_ar, bank_name_en, account_title_ar, account_number, iban_number, swift_code, purpose_category_ar, display_order) VALUES
(
    'البنك الأهلي المصري (فرع العصافرة)',
    'National Bank of Egypt',
    'كنيسة القديسين مكسيموس ودوماديوس والأنبا موسى الأسود',
    '100307049823101',
    'EG3800010030704982310100018',
    'NBEGEGCXXXX',
    'الحساب الجاري العام وعمارة الكنيسة ومبنى الخدمات',
    1
),
(
    'بنك مصر (فرع المنتزه)',
    'Banque Misr',
    'لجنة الرعاية وإخوة الرب بكنيسة مكسيموس ودوماديوس',
    '240019900015682',
    'EG12000202400199000156820012',
    'BMISEGCXXXX',
    'حساب إخوة الرب، الرعاية الاجتماعية والعمليات الحرجة',
    2
),
(
    'البنك التجاري الدولي (CIB)',
    'Commercial International Bank',
    'مستوصف كنيسة القديسين مكسيموس والأنبا موسى',
    '100045892147',
    'EG540010100045892147000019',
    'CIBEEGCXXXX',
    'دعم وتطوير الأجهزة الطبية ومساعدة المرضى غير القادرين',
    3
);
```

---

## 5. مصفوفة الاستجابة السريعة ومعايير الأداء المعتمدة (Implementation SLAs)

1. **التحقق من صحة الإدخال (Validation Strictness)**:
   - كافة استمارات الواجهة مربوطة بـ `React Hook Form` و `Zod`.
   - لا تُقبل أي أرقام هواتف مصرية خارج الأنماط الرسمية (`010`, `011`, `012`, `015`).
2. **التعامل مع التواريخ القبطية (Coptic Calendar Engine)**:
   - تضمين دوال تحويل التاريخ الميلادي إلى التاريخ القبطي (توت، بابه، هاتور، كيهك، طوبة، أمشير، برمهات، برمودة، بشنس، بؤونة، أبيب، مسرى، والنسيء) لعرض تاريخ اليوم الطقسي في شريط الترويسة.
3. **أزرار الاتصال السريع (Quick Tel & WhatsApp URLs)**:
   - روابط واتساب مهيأة مسبقاً برسائل نصية واضحة، مثال:
   `https://wa.me/201220000001?text=سلام+ونعمة،+أود+الاستفسار+عن+خدمة+...`

---
**انتهت وثيقة الموجه العام للذكاء الاصطناعي وإرشادات التطوير - جاهزة للبناء المباشر.**
