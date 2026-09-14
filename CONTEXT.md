# Domain Context & Ubiquitous Language (v1.1)

## كنيسة القديسين مكسيموس ودوماديوس والشهيد الأنبا موسى الأسود
### Church of Saints Maximus & Domadius and St. Moses the Black — Asafra, Alexandria
**Coptic Orthodox Patriarchate of Alexandria**

---

## 1. Domain Philosophy & Overview

This document defines the authoritative ubiquitous language and domain glossary for the official parish portal of the Church of Saints Maximus, Domadius, and Saint Moses the Black. All agents, engineers, and contributors must strictly adhere to the nomenclature defined below across code, database schemas, UI components, API contracts, and user-facing communications.

---

## 2. Ubiquitous Language & Core Entities

### 2.1 Liturgy & Masses (`mass_schedules` / القداس الإلهي)
- **Concept**: The Eucharistic Divine Liturgy (القداس الإلهي) celebrated according to Coptic Orthodox rites (St. Basil, St. Gregory, St. Cyril).
- **Ubiquitous Term**: `Liturgy` or `Mass` (Arabic: **القداس الإلهي** / plural: **القداسات الإلهية**).
- **Attributes**:
  - `altar_id`: Specific consecrated sanctuary where the liturgy is offered.
  - `celebrant_priest_id`: Officiating priest (nullable if rotating).
  - `day_of_week`: `day_of_week_enum` (Sunday through Saturday).
  - `start_time` / `end_time`: Exact liturgical prayer duration.
  - `target_group_ar`: Congregation category (e.g., عام لجميع الشعب, كبار السن وطلبة الجامعات, عمال وموظفين).
  - `is_seasonal`: Indicator for special fasting seasons (الصوم الكبير, صوم الميلاد, صوم العذراء, شهر كيهك).

### 2.2 Altars & Sanctuaries (`altars` / المذابح الكنسية)
- **Concept**: Consecrated altars dedicated to specific patron saints, carrying official episcopal chrismation (التدشين الميروني).
- **Ubiquitous Term**: `Altar` (Arabic: **المذبح** / plural: **المذابح**).
- **Parish Altars**:
  1. **المذبح الأوسط (الرئيسي)**: مذبح القديسين مكسيموس ودوماديوس (Patron Saints: St. Maximus & St. Domadius).
  2. **المذبح البحري**: مذبح الشهيد القوي الأنبا موسى الأسود (Patron Saint: St. Moses the Black).
  3. **المذبح القبلي**: مذبح والدة الإله القديسة مريم والشهيد العظيم مارجرجس (Patron Saints: St. Mary & St. George).
- **Domain Rule**: Every liturgy schedule must be bound to a valid consecrated altar.

### 2.3 Clergy & Priesthood (`clergy` / مجمع الآباء الكهنة)
- **Concept**: Ordained priests of the parish ordained by the Holy Synod of the Coptic Orthodox Church.
- **Ubiquitous Term**: `Priest` / `Clergy` (Arabic: **الكاهن** / **مجمع الآباء الكهنة**).
- **Clerical Ranks**:
  - `قس` (Priest): Initial holy orders of presbyterate.
  - `قمص` (Hegumen): Senior archpriest rank conferred through long pastoral service.
- **Attributes**:
  - `clerical_name_ar`: Official canonical ordained name (e.g., القس مكسيموس, القمص دوماديوس).
  - `ordination_date`: Canonical date of laying on of hands (سيامة الكاهن).
  - `confession_hours_ar`: Allocated public schedule for confession and pastoral counseling (مواعيد الاعتراف والإرشاد الروحي).
  - `responsibilities_ar`: Specific pastoral sectors assigned by the church council.

### 2.4 Clinic Specialties (`clinic_specialties` / التخصصات الطبية)
- **Concept**: Specialized medical departments within the church charitable outpatient clinic (المستوصف الخيري التخصصي).
- **Ubiquitous Term**: `Clinic Specialty` (Arabic: **التخصص الطبي** / **العيادة التخصصية**).
- **Canonical Departments (14 Specialties)**:
  1. Internal Medicine (الباطنة والجهاز الهضمي)
  2. Pediatrics (طب الأطفال وحديثي الولادة)
  3. Orthopedics (جراحة العظام والمفاصل)
  4. General Surgery (الجراحة العامة والمناظير)
  5. Obstetrics & Gynecology (النساء والتوليد)
  6. Dentistry (طب وجراحة الأسنان)
  7. Ophthalmology (طب وجراحة العيون)
  8. ENT / Otolaryngology (الأنف والأذن والحنجرة)
  9. Dermatology (الأمراض الجلدية والليزر)
  10. Physiotherapy (العلاج الطبيعي والتأهيل)
  11. Cardiology (أمراض القلب والأوعية)
  12. Neurology & Psychiatry (المخ والأعصاب والطب النفسي)
  13. Medical Laboratory (المعمل والتحاليل الطبية)
  14. Charitable Pharmacy (الصيدلية الخيرية)

> **v1.1**: هذه القائمة مطابقة ترتيباً ومضموناً لبيانات البذر في `AI_DEVELOPER_PROMPT_AND_GUIDELINES.md §4` (المصدر التنفيذي الوحيد للتخصصات).

### 2.5 Church Meetings & Sunday School (`church_meetings` / التربية الكنسية والاجتماعات النوعية)
- **Concept**: Categorical pastoral fellowships organized by age, educational stage, and social demographic.
- **Ubiquitous Term**: `Church Meeting` (Arabic: **اجتماع التربية الكنسية** / **الاجتماع النوعي**).
- **The 11 Canonical Sectors**:
  1. `malaeika`: اجتماع الملائكة (Nursery & Kindergarten)
  2. `ebtedaey-1-3`: اجتماع ابتدائي صغار (Grades 1 to 3)
  3. `ebtedaey-4-6`: اجتماع ابتدائي كبار (Grades 4 to 6)
  4. `edaady`: اجتماع المرحلة الإعدادية (Middle School)
  5. `thanaway`: اجتماع المرحلة الثانوية (High School)
  6. `arshi-youth`: أسرة شباب عرشي (University & College Youth)
  7. `ni-angelos`: اجتماع ني أنجيلوس (Graduates & Young Professionals)
  8. `holy-family`: اجتماع الأسرة المقدسة (Newly Married Couples)
  9. `men`: اجتماع رجال القديس يوسف النجار (Men & Fathers)
  10. `om-elkhalas`: اجتماع أم الخلاص (Mothers & Women)
  11. `widows-orphans`: اجتماع الشهيد مارمينا والبابا كيرلس (Elderly, Widows & Seniors)
- **Key Attributes**: Motto verse (`motto_verse_ar`), Bible reference (`bible_reference`), meeting hall (`location_hall_ar`), supervising priest (`supervising_priest_id`).

### 2.6 Schools & Academies (`schools_academies` / المدارس والمعاهد الكنسية)
- **Concept**: Structured educational academies operating formal curricula across semesters or multi-year diplomas.
- **Ubiquitous Term**: `Church Academy` / `School` (Arabic: **المعهد الكنسي** / **مدرسة التعليم الكنسي**).
- **Institutes**:
  - `deacon-school`: مدرسة القديس إستفانوس للشمامسة (Coptic hymns, ritual theology, liturgical languages).
  - `children-bible`: مدرسة الكتاب المقدس للأطفال (Bible memorization, competitions).
  - `adult-bible`: معهد الكتاب المقدس للكبار (4-stage theological and biblical studies).
  - `karouz-academy`: معهد كاروز لإعداد وتأهيل الخدام (Servant pedagogy, church history, pastoral psychology).
  - `cithara-choir`: مدرسة قيثارة التسابيح وكورال الكنيسة (Orthodox choir training and hymnology).

### 2.7 Activities & Youth Formations (`activities` / الأنشطة الرعوية)
- **Concept**: Extracurricular developmental groups fostering talent, recreation, and community connection.
- **Ubiquitous Term**: `Parish Activity` (Arabic: **النشاط الرعوي**).
- **Formations**:
  - `scouts`: فوج القديس الأنبا موسى للكشافة والمرشدات (Air, Sea, and Land scouts).
  - `lending-library`: مكتبة الاستعارة العامة وفهرس الكتب (Parish lending library).
  - `printing-center`: مركز الطباعة والتصوير الرقمي (Student digital printing service).
  - `creativity-center`: مركز تنمية المواهب والإبداع والفنون (Arts, crafts, and drama).
  - `social-club`: النادي الاجتماعي والرياضي والملاعب (Parish sports fields and hall).
  - `computer-center`: مركز التكنولوجيا والكمبيوتر (Coding, IT, digital literacy).
  - `summer-club`: النادي الصيفي السنوي (Vacation youth camps).

### 2.8 Public Services & Facilities (`public_services` / المرافق والخدمات المجتمعية)
- **Concept**: Practical humanitarian, educational, and community enterprises serving Alexandria neighborhood residents.
- **Ubiquitous Term**: `Public Service` (Arabic: **الخدمة المجتمعية العامة**).
- **Facilities**:
  - `educational-center`: المركز التعليمي وفصول التقوية المدرسية.
  - `nursery`: حضانة القديسين النموذجية للغات والرضع.
  - `canteens`: المقاصف والكانتين المركزي.
  - `charitable-kitchen`: المطبخ الخيري ومنفذ المحبة للأسر (Food assistance).
  - `employment-office`: مكتب التوظيف والتأهيل المهني (Job placement).
  - `membership-registry`: مكتب السجل والشؤون الكنسية وإفادات المعمودية (Parish civil/sacramental registry).
  - `church-giftshop`: مكتبة البيع والهدايا والأيقونات والصلبان.
  - `tailoring-workshop`: مشغل ومعرض التفصيل والخياطة الكنسية.

### 2.9 Condolence Hall Bookings (`condolence_bookings` / حجز قاعة العزاء والمناسبات)
- **Concept**: Public reservation workflow for the parish condolence hall (قاعة العزاء الرئيسية المجهزة) during bereavement.
- **Ubiquitous Term**: `Condolence Booking` (Arabic: **حجز قاعة العزاء**).
- **Attributes**:
  - `booking_reference_code`: Unique alpha-numeric tracking token (e.g. `COND-X7K92P`).
  - `deceased_full_name`: Full tripartite name of the deceased (اسم المتوفى الثلاثي).
  - `applicant_name` / `applicant_phone`: Contact details of the grieving relative.
  - `relationship_to_deceased`: Kinship degree.
  - `event_date`: Booking date.
  - `status`: `pending` (default upon submission), `approved`, `rejected`, `cancelled`.
- **Domain Rule**: Public submissions are permitted without authentication (`status = 'pending'`), while approval requires a presiding priest or administrative servant.

### 2.10 Live Stream (`/live` / البث المباشر)
- **Concept**: Live liturgical and devotional broadcast channels carrying real-time feeds of services, praises, and midnight psalmodies.
- **Ubiquitous Term**: `Live Stream` (Arabic: **البث المباشر**).
- **Features**:
  - Embedded low-latency player (YouTube Live / Facebook Video).
  - Liturgy countdown timer to the next upcoming scheduled celebration.
  - Liturgical archive organized by celebration feast.

### 2.11 Canonical Orthodox Bible (`/bible` / الكتاب المقدس المعتمد)
- **Concept**: Full canonical scriptural text adhering strictly to the Coptic Orthodox canon, including the Deuterocanonical Books (الأسفار القانونية الثانية).
- **Ubiquitous Term**: `Canonical Bible` (Arabic: **الكتاب المقدس - الترجمة العربية المعتمدة**).
- **Standards**:
  - Arabic Van Dyck text with complete diacritics and Orthodox Deuterocanonical additions (Tobit, Judith, Wisdom, Sirach, Baruch, 1 & 2 Maccabees, Prayer of Manasseh, Esther/Daniel additions).
  - Cross-referenced with the Katameros (القطمارس - Coptic liturgical daily readings).

---

## 3. Lexical Invariants & Prohibited Drift

| Prohibited Colloquialism | Mandatory Canonical Term | Reason |
| :--- | :--- | :--- |
| `events` / فعاليات | `mass_schedules` / القداسات الإلهية | Masses are sacraments, not generic events |
| `users` / مستخدمين | `parishioners` / شعب الكنيسة | Reflects pastoral parish relationship |
| `boss` / مدير | `presiding_priest` / الكاهن المشرف | Church governance is liturgical, not corporate |
| `ticket` / تذكرة كشف | `clinic_slot` / موعد العيادة | Avoids transactional commercial framing |
| `hall_rental` / إيجار القاعة | `condolence_booking` / حجز قاعة العزاء | Service is pastoral consolation, not real estate rental |
| `products` / منتجات | `giftshop_items` / مقتنيات المكتبة الكنسية | Sacred icons and books are spiritual blessings |
