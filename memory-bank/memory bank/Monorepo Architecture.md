---
title: "Monorepo Architecture & Workspace Boundaries"
aliases: ["Monorepo Architecture", "pnpm Workspace", "Package Boundaries", "Codebase Structure"]
tags:
  - "#memory-bank"
  - "#architecture"
  - "#monorepo"
  - "#refactoring"
  - "#status/approved"
version: "2.0"
last_updated: 2026-09-26
---

# Monorepo Architecture & Workspace Boundaries

> [!info] Architecture Overview
> Engineered as a **pnpm workspace monorepo** with strict boundary separation between two decoupled Next.js 15 applications and three focused domain packages.

---

## 1. بنية الحزم والتطبيقات (Workspace Layout)

```
C:\Church-Site\
├── apps/
│   ├── web/               # البوابة العامة للمخدومين (Next.js 15, Zero-Auth, Static-First)
│   └── admin/             # لوحة تحكم السكرتارية والكهنة (Next.js 15, Port 3001, SSR Auth)
├── packages/
│   ├── domain/            # النطاق والأنواع ومصفوفة القدرات ومحرك التكرار
│   ├── data-access/       # طبقة التخزين المزدوج (JSON/Supabase) والعملاء والوسائط
│   └── ui/                # المكونات المشتركة، الأدوات، والتصميم القبطي
├── memory-bank/           # بنك الذاكرة ومستودع أوبسيديان (Obsidian Vault)
├── supabase/              # ملفات الهجرات العشرين والإعدادات
└── scripts/               # فاحص الأسرار وأدوات البناء
```

---

## 2. تفصيل مكونات المنظومة وحدود العزل (Package Boundaries)

### أ. `apps/web` (بوابة المخدومين العامة)
- **المهمة**: توفير وصول سريع وبسيط لكافة خدمات الكنيسة دون حواجز تقنية.
- **الخصائص والحدود**:
  * تطبيق Next.js 15 App Router، ثابت أولاً (Static-First) بصفر مصادقة مطابقة لـ [[INV-01 Zero-Auth Invariant|INV-01]].
  * يبني بصفر متغيرات بيئة (No-Env Invariant) مع توليد 59 مساراً ثابتاً وديناميكياً بنجاح.
  * عزل كامل لرموز الإدارة: لا يحتوي على مسارات `/admin` أو أي كود خاص بصلاحيات الطاقم.
  * حراس هيدريشن (`isMounted`) لكافة النماذج العامة لمنع الإرسال قبل اكتمال جاهزية المتصفح.

### ب. `apps/admin` (لوحة الإدارة الرعوية)
- **المهمة**: تمكين الآباء الكهنة والسكرتارية من إدارة بيانات الكنيسة والصلوات.
- **الخصائص والحدود**:
  * تطبيق Next.js 15 مستقل يعمل محلياً على المنفذ `3001` وعلى نطاق فرعي مخصص إنتاجياً.
  * **عزل الأعطال الكامل (Fault Isolation)**: أي تعطل أو صيانة في الموقع العام لا تؤثر إطلاقاً على لوحة الإدارة، والعكس صحيح.
  * جلسات `@supabase/ssr` مستقلة مع كوكيز محصورة بنطاق لوحة الإدارة.
  * حارس إلزامي `requireStaff()` مع سلوك الفشل المغلق الحتمي والتحويل لصفحة الدخول.

### ج. `packages/domain` (`@church-site/domain`)
- **المهمة**: منطق الأعمال الأساسي والقواعد الرعوية المجردة.
- **الخصائص والحدود**:
  * المصدر الحصري للأنواع (`src/types/database.types.ts`) ونماذج البيانات.
  * محرك التكرار للأحداث الأسبوعية (`recurrence.ts`) وتوسيع السلاسل في منطقة IANA المناسبة.
  * مصفوفة الصلاحيات المجردة والقدرات (`can(role, capability)`).
  * خالية بنسبة 100% من أي تبعيات للشبكة أو قواعد البيانات أو واجهات المستخدم.

### د. `packages/data-access` (`@church-site/data-access`)
- **المهمة**: الواجهة الحصرية الموحدة لقراءة وكتابة البيانات عبر المنظومة.
- **الخصائص والحدود**:
  * تضم محرك التخزين المزدوج (راجع [[Dual-Driver Storage & Repositories]]).
  * وحدة حل واعتماد الروابط الخارجية (`AssetResolver` و`ASSET_ALLOWED_HOSTS`).
  * عملاء Supabase الآمنون ونقطة الدخول الآمنة للمتصفح `@church-site/data-access/client`.

### هـ. `packages/ui` (`@church-site/ui`)
- **المهمة**: مكتبة مكونات الواجهة وتوحيد النمط البصري.
- **الخصائص والحدود**:
  * مكونات الواجهة الأساسية (shadcn/ui، أزرار، بطاقات، مربعات حوار).
  * موحد التنسيقات (`cn`).
  * مكونات التدويل واللغة الموحدة (`FlagBadge`, `LocaleSwitcher`).

---

## 3. نتائج تدقيق وإعادة الهيكلة المعمارية (Ponytail Refactoring Audit)

أسفرت عملية التدقيق وإعادة الهيكلة الكبرى عن نتائج نوعية استثنائية:
1. **تقليم 13 اعتمادية غير مستخدمة**:
   * حذف الحزم الزائدة من `apps/web` و`apps/admin` و`packages/data-access` (`@supabase/ssr`, `@supabase/supabase-js`, `clsx`, `tailwind-merge`, `nanoid` وغيرها).
2. **التخلص التام من حزمة `nanoid`**:
   * استبدالها بالكامل بوحدة Node.js القياسية `node:crypto` (`randomBytes(3).toString("hex").toUpperCase()`) لإنشاء الرموز المرجعية لحجوزات العزاء.
3. **توحيد المكونات المكررة**:
   * دمج `FlagBadge`, `LocaleSwitcher`, `flag-styles`, `term-icons` في حزمة `@church-site/ui`.
4. **حذف أكثر من 35 غطاء إعادة تصدير (Re-export Shims)**:
   * توجيه كافة الاستيرادات مباشرة إلى الحزم الرسمية الثلاث.
5. **صافي تقليص الكود**:
   * حذف ما يزيد عن **3,500 سطر صافٍ** من الكود الميت والمكرر مع اجتياز كامل لكافة بوابات الجودة الخمس بنسبة 100% (راجع [[Progress & Deliverables]]).

---
*مرجع معمارية المستودع المتعدد وحدود الحزم — الدليل الهيكلي لتنظيم الكود.*
