# Church Portal — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Phase-1 public parish portal (home, masses, clinics + live absence status, condolence booking, contact, donations) with a role-protected admin panel, on Next.js 14 App Router + Supabase, RTL Arabic-first.

**Architecture:** Static-first ISR pages read from Supabase via a server-side client; all public writes (condolence bookings, contact messages) go through Zod-validated Server Actions with rate limiting; `/admin` is gated by Supabase Auth + a `profiles.role` column enforced by row-level RLS. Phase 2+ (Bible reader, live stream archive, education/activities/services routes, news) is explicitly out of scope.

**Tech Stack:** Next.js 14+ (App Router, `src/` dir), TypeScript 5 strict, Tailwind CSS, `@supabase/ssr` (NOT the deprecated `@supabase/auth-helpers-nextjs`), Zod, React Hook Form, Lucide React, Vitest + Testing Library.

**Spec:** `PRODUCT_REQUIREMENTS_DOCUMENT.md`, `INFORMATION_ARCHITECTURE.md`, `BACKEND_AND_DATA_SPEC.md`, `AI_DEVELOPER_PROMPT_AND_GUIDELINES.md` (all in repo root). This plan corrects four spec defects — see "Spec Fixes" below; where this plan and the specs disagree, **this plan wins**.

**Status:** NOT STARTED (as of 2026-09-14). No code, no git repo, no Supabase project exists yet — only this plan and the five spec docs. Coptic calendar test anchors verified against primary sources on 2026-09-14. Start at "Execution Prerequisites", then Task 1.

## Global Constraints

- TypeScript `strict: true`. No `any`.
- Arabic is the primary language; every page is `dir="rtl"`. English titles appear as secondary labels only.
- Design tokens verbatim from `AI_DEVELOPER_PROMPT_AND_GUIDELINES.md` §2: `copticNavy` `#1E2A78`, `copticGold` `#C5A880`, `alabasterBg` `#FAF8F5`, `slateText.primary` `#1E293B`, status green `#15803D` / red `#DC2626` / yellow `#D97706`.
- Fonts: headings `Noto Kufi Arabic`; body `Noto Sans Arabic` with `line-height: 1.8`; verses `Amiri`. Self-hosted via `next/font/local` or Google via `next/font/google`.
- All Supabase client code uses `@supabase/ssr` (`createBrowserClient`, `createServerClient`). Never `@supabase/auth-helpers-nextjs`.
- Egyptian mobile phone regex everywhere: `/^01[0125][0-9]{8}$/`.
- Public pages never require login (Zero-Auth invariant).
- Seed data for clergy phones and bank accounts/IBANs is **placeholder** and must never reach production pages without church verification — enforced via a `NEXT_PUBLIC_SITE_MODE` gate (see Task 12).
- Next.js 14+ App Router file conventions: `layout.tsx`, `page.tsx`, `actions/` folders, `revalidateTag` for cache invalidation.
- Every task ends with `git commit` — small, frequent commits.
- No secrets in git. `.env.local` only; `.env.example` documents the keys.

## Execution Prerequisites (verify before Task 1)

Nothing below is done yet — this plan is **not started**. Check each item when execution begins:

- [ ] Node.js 18.17+ (Node 20 LTS recommended) and npm installed (`node --version`).
- [ ] git installed and initialized in this directory (`git init` happens in Task 1 Step 7; repo is currently NOT a git repository).
- [ ] Docker Desktop (optional — only for local `supabase start` validation in Task 5 Step 2; cloud SQL editor is the fallback).
- [ ] A Supabase account the user controls — needed at **Task 5 Step 3** (manual, user-assisted: create project, apply schema, copy keys into `.env.local`). Tasks 1–4 run without it.
- [ ] Before any production deploy: verified clergy phone numbers and bank letters from the church secretary (replaces placeholder seed data, Task 11), and a real domain for `NEXT_PUBLIC_SITE_URL` (Task 13).
- [ ] Supabase dashboard manual steps are flagged in-plan with **"pause and ask the user"** — do not attempt to automate them.

**How to execute:** each task is self-contained with exact file paths, code, test commands, and commit steps. Execute with superpowers:executing-plans (inline) or superpowers:subagent-driven-development (fresh subagent per task). Tasks must run in order — each consumes interfaces from earlier tasks (documented in each task's **Interfaces** block).

---

## Spec Fixes (authoritative deviations from the docs)

1. **`@supabase/ssr` replaces `@supabase/auth-helpers-nextjs`** — the helpers package was deprecated in 2024. All client creation in this plan uses `@supabase/ssr` with the cookie-based pattern.
2. **Role-based RLS replaces blanket `authenticated USING (TRUE)`** — a `profiles` table (`id`, `role`, `full_name_ar`) with roles `admin | clinic_servant | secretary` is joined to `auth.users`. RLS policies check role per table instead of granting all-authenticated full access.
3. **Rate limiting on public inserts** — a `rate_limits` table (keyed by IP hash + action, 5 submissions/hour) checked inside the two public Server Actions, in addition to honeypot fields on forms.
4. **Single source of truth for doctor schedules** — the structured `doctor_schedule_slots` table drives `/clinics/doctors`; `clinic_doctors.schedule_details_ar` is display-only fallback text and is dropped from new code paths.

---

## File Structure

```text
church-site/                        (repo root — current dir C:\Church-Site)
├── docs/superpowers/plans/         # this plan
├── supabase/
│   ├── migrations/
│   │   ├── 0001_schema.sql         # tables, enums, indexes
│   │   ├── 0002_rls.sql            # role-based RLS policies
│   │   ├── 0003_rate_limits.sql    # rate_limits table + helper fn
│   │   └── 0004_seed.sql           # seed data (PLACEHOLDER-marked)
│   └── config.toml                 # created by supabase CLI init
├── src/
│   ├── app/
│   │   ├── layout.tsx              # RTL root, fonts, Header/Footer
│   │   ├── page.tsx                # home (ISR 60s)
│   │   ├── globals.css
│   │   ├── masses/page.tsx         # ISR 300s
│   │   ├── clinics/
│   │   │   ├── page.tsx            # ISR 60s
│   │   │   ├── doctors/page.tsx    # ISR 60s
│   │   │   └── status/page.tsx     # dynamic
│   │   ├── condolence/page.tsx     # form (server action)
│   │   ├── contact/page.tsx        # form (server action)
│   │   ├── donations/page.tsx      # static
│   │   ├── actions/
│   │   │   ├── condolence-actions.ts
│   │   │   └── contact-actions.ts
│   │   └── admin/
│   │       ├── layout.tsx          # auth gate
│   │       ├── page.tsx            # dashboard
│   │       ├── login/page.tsx
│   │       ├── clinics/page.tsx    # absence toggles
│   │       └── bookings/page.tsx   # approve/reject
│   ├── components/
│   │   ├── layout/{Header,MobileDrawer,Footer,Breadcrumb,FontSizeSwitcher}.tsx
│   │   ├── ui/{Card,Badge,Button,CopticDivider}.tsx
│   │   ├── clinics/{DoctorCard,SpecialtyCard,AbsenceAlertStrip}.tsx
│   │   ├── masses/WeeklyMassTable.tsx
│   │   └── forms/{CondolenceForm,ContactForm}.tsx
│   ├── lib/
│   │   ├── supabase/{client.ts,server.ts,middleware.ts,admin.ts}
│   │   ├── utils/{coptic-date.ts,formatters.ts,rate-limit.ts}
│   │   └── validations/church-schemas.ts
│   ├── types/database.types.ts     # generated via supabase gen types
│   └── middleware.ts               # session refresh + /admin guard
├── .env.example
├── vitest.config.ts
└── package.json
```

---

### Task 1: Scaffold Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.mjs`, `src/app/layout.tsx`, `src/app/globals.css`, `.env.example`, `.gitignore`

**Interfaces:**
- Produces: a running dev server at `http://localhost:3000`, Tailwind with `copticNavy`/`copticGold`/`alabasterBg` palette classes, `dir="rtl"` root layout.

- [ ] **Step 1: Run create-next-app**

```powershell
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

If the directory is non-empty (the 5 spec .md files), answer yes/keep when prompted. If create-next-app refuses, scaffold in a temp subdir and move files up.

- [ ] **Step 2: Install runtime dependencies**

```powershell
npm install @supabase/ssr @supabase/supabase-js zod react-hook-form @hookform/resolvers nanoid lucide-react
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
```

- [ ] **Step 3: Extend Tailwind palette**

In `tailwind.config.ts`, inside `theme.extend.colors`, add verbatim from the spec (AI_DEVELOPER_PROMPT_AND_GUIDELINES.md §2.1):

```typescript
copticNavy: {
  DEFAULT: "#1E2A78",
  50: "#EEF1FA", 100: "#DCE2F5", 200: "#B8C4EB",
  500: "#1E2A78", 600: "#182260", 700: "#131A49",
  800: "#0D1131", 900: "#07091A",
},
copticGold: {
  DEFAULT: "#C5A880",
  50: "#F9F6F1", 100: "#F2ECE2", 200: "#E6D8C4", 300: "#D9C5A7",
  400: "#CDB38B", 500: "#C5A880", 600: "#B08E5F", 700: "#8B6F45",
  800: "#655030", 900: "#3F321C",
},
alabaster: "#FAF8F5",
statusGreen: "#15803D", statusRed: "#DC2626", statusYellow: "#D97706",
```

Also set `fontFamily`: `kufi: ["var(--font-kufi)"]`, `sans: ["var(--font-noto-arabic)"]`, `amiri: ["var(--font-amiri)"]`.

- [ ] **Step 4: Root layout with RTL + fonts**

`src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Noto_Kufi_Arabic, Noto_Sans_Arabic, Amiri } from "next/font/google";
import "./globals.css";

const kufi = Noto_Kufi_Arabic({ subsets: ["arabic"], weight: ["700", "800"], variable: "--font-kufi" });
const notoArabic = Noto_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500"], variable: "--font-noto-arabic" });
const amiri = Amiri({ subsets: ["arabic"], weight: ["700"], variable: "--font-amiri" });

export const metadata: Metadata = {
  title: { default: "كنيسة القديسين مكسيموس ودوماديوس والأنبا موسى الأسود", template: "%s | كنيسة مكسيموس ودوماديوس" },
  description: "البوابة الرسمية لكنيسة القديسين مكسيموس ودوماديوس والشهيد الأنبا موسى الأسود بالعصافرة - الإسكندرية",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${kufi.variable} ${notoArabic.variable} ${amiri.variable}`}>
      <body className="bg-alabaster text-slate-800 font-sans leading-[1.8]">{children}</body>
    </html>
  );
}
```

In `globals.css`, add Tailwind directives (or `@tailwind base; @tailwind components; @tailwind utilities;` per scaffold version) and `h1,h2,h3 { font-family: var(--font-kufi); }`.

- [ ] **Step 5: Create `.env.example`**

```text
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_MODE=development   # 'development' shows placeholder warnings; 'production' hides seed placeholder data unless verified
```

Copy it to `.env.local` and fill with real values once the Supabase project exists (Task 5). Ensure `.gitignore` contains `.env*` (except `.env.example`).

- [ ] **Step 6: Verify dev server runs**

Run: `npm run dev` → open `http://localhost:3000` → default page renders with Arabic title and RTL direction (inspect `<html dir="rtl">`).

- [ ] **Step 7: Init git and commit**

```powershell
git init; git add -A; git commit -m "chore: scaffold Next.js 14 app with Coptic design tokens and RTL layout"
```

---

### Task 2: Coptic date utility (TDD)

**Files:**
- Create: `src/lib/utils/coptic-date.ts`
- Test: `src/lib/utils/coptic-date.test.ts`
- Create: `vitest.config.ts`

**Interfaces:**
- Produces: `getCopticDate(gregorian: Date): { month: string; day: number; year: number; formattedAr: string }` and `export const COPTIC_MONTHS_AR: readonly string[]`. Used by `Header` (Task 4) and masses page.

- [ ] **Step 1: Create `vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", globals: true },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
```

Add `"test": "vitest run"` to `package.json` scripts.

- [ ] **Step 2: Write the failing test**

`src/lib/utils/coptic-date.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { getCopticDate, COPTIC_MONTHS_AR } from "./coptic-date";

describe("getCopticDate", () => {
  // Anchors verified against Wikipedia "Nayrouz" (Sept 11, except the year
  // before a Gregorian leap year → Sept 12), the St. Anthony Maadi Coptic
  // calendar, and Egyptian press coverage of Nayrouz 1743 (Sept 11, 2026).
  it("returns 1 Tut for Nayrouz 1741 (Sept 11, 2024 — non-leap-adjacent)", () => {
    const d = getCopticDate(new Date(2024, 8, 11)); // month index 8 = September
    expect(d.day).toBe(1);
    expect(d.month).toBe("توت");
    expect(d.year).toBe(1741);
  });

  it("returns 1 Tut for Nayrouz 1742 (Sept 11, 2025)", () => {
    const d = getCopticDate(new Date(2025, 8, 11));
    expect(d.day).toBe(1);
    expect(d.month).toBe("توت");
    expect(d.year).toBe(1742);
  });

  it("returns 1 Tut for Nayrouz 1743 (Sept 11, 2026)", () => {
    const d = getCopticDate(new Date(2026, 8, 11));
    expect(d.day).toBe(1);
    expect(d.month).toBe("توت");
    expect(d.year).toBe(1743);
  });

  it("returns the Coptic leap day: 6 Nasie 1743 (Sept 11, 2027)", () => {
    // 1743 % 4 === 3 → Coptic leap year → 6th epagomenal day exists.
    // Nayrouz 1744 falls Sept 12, 2027 (year before Gregorian leap 2028).
    const d = getCopticDate(new Date(2027, 8, 11));
    expect(d.day).toBe(6);
    expect(d.month).toBe("النسيء");
    expect(d.year).toBe(1743);
  });

  it("returns 1 Tut for Nayrouz 1740 (Sept 12, 2023 — year before Gregorian leap 2024)", () => {
    const d = getCopticDate(new Date(2023, 8, 12));
    expect(d.day).toBe(1);
    expect(d.month).toBe("توت");
    expect(d.year).toBe(1740);
  });

  it("formats an Arabic date string with Arabic-Indic digits", () => {
    const d = getCopticDate(new Date(2026, 8, 11));
    expect(d.formattedAr).toBe("١ توت ١٧٤٣");
  });
});
```

Use Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩) in `formattedAr` via a digit map. These six anchors pin the algorithm at both a normal boundary, both Nayrouz offsets (Sept 11 and Sept 12), and the leap day itself — if all six pass, the conversion is correct for the modern era.

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — module `./coptic-date` not found.

- [ ] **Step 4: Implement**

Algorithm: convert Gregorian → Julian Day Number, subtract the Coptic epoch (JDN 1825030 = 1 Tut, year 1 Anno Martyrum), then walk Coptic years. A Coptic year `y` has 366 days (leap, 6-day Nasie) when `y % 4 === 3`, else 365. Verified by hand against the six test anchors: e.g. Sept 11, 2026 → JDN 2461295 → 636265 days since epoch → cumulative days of years 1–1742 = 365×1742 + 435 leaps = 636265 exactly → day 1 of year 1743 (1 Tut 1743). ✓

```typescript
export const COPTIC_MONTHS_AR = [
  "توت", "بابه", "هاتور", "كيهك", "طوبة", "أمشير",
  "برمهات", "برمودة", "بشنس", "بؤونة", "أبيب", "مسرى", "النسيء",
] as const;

const ARABIC_DIGITS = ["٠","١","٢","٣","٤","٥","٦","٧","٨","٩"];
const toArabicDigits = (n: number): string =>
  String(n).split("").map((c) => ARABIC_DIGITS[Number(c)] ?? c).join("");

const COPTIC_EPOCH_JD = 1825030; // JDN of 1 Tut, year 1 Anno Martyrum (Aug 29, 284 CE Julian)

function gregorianToJd(date: Date): number {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return (
    Math.floor((1461 * (y + 4800 + Math.floor((m - 14) / 12))) / 4) +
    Math.floor((367 * (m - 2 - 12 * Math.floor((m - 14) / 12))) / 12) -
    Math.floor((3 * Math.floor((y + 4900 + Math.floor((m - 14) / 12)) / 100)) / 4) +
    d - 32075
  );
}

// count of leap years (y % 4 === 3) in 1..upToYear
function leapCount(upToYear: number): number {
  return upToYear < 3 ? 0 : Math.floor((upToYear - 3) / 4) + 1;
}

// total days in Coptic years 1..upToYear
function cumulativeDays(upToYear: number): number {
  return 365 * upToYear + leapCount(upToYear);
}

export function getCopticDate(gregorian: Date): {
  month: string; day: number; year: number; formattedAr: string;
} {
  const copticDays = gregorianToJd(gregorian) - COPTIC_EPOCH_JD; // 0-based; 0 = 1 Tut year 1
  let year = Math.floor(copticDays / 365.25) + 1;
  while (cumulativeDays(year - 1) > copticDays) year--; // estimate too high
  while (cumulativeDays(year) <= copticDays) year++;     // estimate too low
  const dayOfYear = copticDays - cumulativeDays(year - 1) + 1; // 1..366
  const monthIndex = Math.floor((dayOfYear - 1) / 30);   // 0..12; 12 = النسيء
  const day = monthIndex === 12 ? dayOfYear - 360 : ((dayOfYear - 1) % 30) + 1;
  return {
    month: COPTIC_MONTHS_AR[monthIndex],
    day,
    year,
    formattedAr: `${toArabicDigits(day)} ${COPTIC_MONTHS_AR[monthIndex]} ${toArabicDigits(year)}`,
  };
}
```

Sanity walkthrough for the leap-day test: Sept 11, 2027 → JDN 2461660 → copticDays 636630. Estimate: floor(636630/365.25)+1 = 1744. cumulativeDays(1743) = 365×1743 + 436 (1743 itself is a leap year) = 636631 > 636630 → decrement to 1743. dayOfYear = 636630 − 636265 + 1 = 366 → monthIndex 12, day 6 → 6 النسيء ١٧٤٣. ✓

- [ ] **Step 5: Run tests until green**

Run: `npm test`
Expected: 6 PASS. The anchors were verified against primary sources (see test comments); if one still fails, the implementation is wrong, not the test — recheck the JDN arithmetic before touching expectations.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/utils/coptic-date.ts src/lib/utils/coptic-date.test.ts vitest.config.ts package.json package-lock.json
git commit -m "feat: Coptic calendar date conversion with Arabic month names (TDD)"
```

---

### Task 3: Shared UI components

**Files:**
- Create: `src/components/ui/Card.tsx`, `src/components/ui/Badge.tsx`, `src/components/ui/Button.tsx`, `src/components/ui/CopticDivider.tsx`
- Create: `src/components/layout/Breadcrumb.tsx`, `src/components/layout/FontSizeSwitcher.tsx`

**Interfaces:**
- Produces: `Card({ title, children, className? })`, `Badge({ tone: "green"|"red"|"yellow"|"navy"|"gold", children })`, `Button` (variant `"primary"|"gold"|"outline"`), `CopticDivider()`, `Breadcrumb({ items: { label: string; href: string }[] })`, `FontSizeSwitcher()` (client component; sets `data-font-scale` on `<html>` to `normal|large|xlarge`, persisted in localStorage; CSS in globals.css scales `html[data-font-scale]` 1 / 1.15 / 1.3).

- [ ] **Step 1: Implement the four UI primitives**

`Card.tsx`:

```tsx
export function Card({ title, children, className = "" }: {
  title?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-copticGold/20 bg-white shadow-sm hover:shadow-md transition-all duration-300 p-5 ${className}`}>
      {title && <h3 className="font-kufi text-lg text-copticNavy mb-3">{title}</h3>}
      {children}
    </div>
  );
}
```

`Badge.tsx`:

```tsx
const TONES = {
  green: "bg-green-50 text-statusGreen border-statusGreen/30",
  red: "bg-red-50 text-statusRed border-statusRed/30",
  yellow: "bg-amber-50 text-statusYellow border-statusYellow/30",
  navy: "bg-copticNavy/5 text-copticNavy border-copticNavy/30",
  gold: "bg-copticGold/10 text-copticGold-700 border-copticGold/40",
} as const;

export function Badge({ tone, children }: { tone: keyof typeof TONES; children: React.ReactNode }) {
  return <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-0.5 text-sm font-medium ${TONES[tone]}`}>{children}</span>;
}
```

`Button.tsx`: a styled `<button>` (and `LinkButton` wrapping `next/link`) with `variant` map — primary `bg-copticNavy text-white hover:bg-copticNavy-700`, gold `bg-copticGold-500 text-white hover:bg-copticGold-600`, outline `border border-copticNavy/30 text-copticNavy hover:bg-copticNavy/5`. Minimum touch target: `min-h-12 px-6`.

`CopticDivider.tsx`: an `<hr>` flanked by a small inline SVG of a four-lobe Coptic cross:

```tsx
export function CopticDivider() {
  return (
    <div className="flex items-center gap-3 my-6 text-copticGold-400" aria-hidden="true">
      <hr className="flex-1 border-copticGold/30" />
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2v20M2 12h20M8 8l8 8M16 8l-8 8" strokeLinecap="round" />
      </svg>
      <hr className="flex-1 border-copticGold/30" />
    </div>
  );
}
```

- [ ] **Step 2: Breadcrumb + FontSizeSwitcher**

`Breadcrumb({ items })` renders `الرئيسية` → … using `next/link`, separated by ` ChevronLeft ` (RTL-correct chevron) from `lucide-react`. The last item is plain text, not a link.

`FontSizeSwitcher` is `"use client"`:

```tsx
"use client";
import { useEffect, useState } from "react";

const SCALES = ["normal", "large", "xlarge"] as const;
const LABELS = ["A", "A+", "A++"];

export function FontSizeSwitcher() {
  const [scale, setScale] = useState<(typeof SCALES)[number]>("normal");
  useEffect(() => {
    const saved = localStorage.getItem("font-scale");
    if (saved && SCALES.includes(saved as never)) apply(saved as never);
  }, []);
  const apply = (s: (typeof SCALES)[number]) => {
    setScale(s);
    document.documentElement.dataset.fontScale = s;
    localStorage.setItem("font-scale", s);
  };
  return (
    <div className="flex items-center gap-1" role="group" aria-label="حجم الخط">
      {SCALES.map((s, i) => (
        <button key={s} onClick={() => apply(s)} aria-pressed={scale === s}
          className={`min-h-9 min-w-9 rounded-md border text-sm ${scale === s ? "bg-copticGold-500 text-white border-copticGold-500" : "border-copticNavy/20 text-copticNavy"}`}>
          {LABELS[i]}
        </button>
      ))}
    </div>
  );
}
```

Add to `globals.css`:

```css
html[data-font-scale="large"] { font-size: 17.5px; }
html[data-font-scale="xlarge"] { font-size: 20px; }
```

- [ ] **Step 3: Visual smoke test**

Temporarily render `<CopticDivider/>`, a `Card`, badges of each tone, and `<FontSizeSwitcher/>` on the home page; run `npm run dev`; confirm styling and that A/A+/A++ persists across reload.

- [ ] **Step 4: Commit**

```powershell
git add src/components/ui src/components/layout src/app/globals.css
git commit -m "feat: shared UI primitives (Card, Badge, Button, CopticDivider, Breadcrumb, FontSizeSwitcher)"
```

---

### Task 4: Header, mobile drawer, footer

**Files:**
- Create: `src/components/layout/Header.tsx`, `src/components/layout/MobileDrawer.tsx`, `src/components/layout/Footer.tsx`
- Modify: `src/app/layout.tsx` (mount Header/Footer)

**Interfaces:**
- Consumes: `getCopticDate` (Task 2), `FontSizeSwitcher`, `Breadcrumb` (Task 3).
- Produces: site chrome. Nav model:

```typescript
// src/components/layout/nav-items.ts — create alongside Header
export const NAV_ITEMS = [
  { label: "الرئيسية", href: "/" },
  {
    label: "القداسات", href: "/masses",
    children: [], // Phase 1: no dropdown children
  },
  {
    label: "العيادات", href: "/clinics",
    children: [
      { label: "دليل التخصصات", href: "/clinics" },
      { label: "مواعيد الأطباء", href: "/clinics/doctors" },
      { label: "نبض العيادات والاعتذارات", href: "/clinics/status" },
    ],
  },
  { label: "حجز قاعة العزاء", href: "/condolence" },
  { label: "التبرعات", href: "/donations" },
  { label: "اتصل بنا", href: "/contact" },
] as const;
```

- [ ] **Step 1: Header**

Server component. Top thin strip (`bg-copticNavy-700 text-copticNavy-100 text-sm`): Coptic + Gregorian date (via `getCopticDate(new Date())` and `toLocaleDateString("ar-EG")`) on the right, quick link "التبرعات 💛" (no emoji — use a Lucide `Heart` icon) on the left. Main bar: church name in `font-kufi text-copticNavy`, nav links, `FontSizeSwitcher`. Desktop nav uses simple hover dropdowns (group-hover CSS, no JS) for items with children; active link underlined with `border-b-2 border-copticGold-500`.

- [ ] **Step 2: MobileDrawer**

`"use client"` — hamburger button (Lucide `Menu`) fixed bottom-left on mobile only (`md:hidden`), opens a right-sliding drawer (`fixed inset-y-0 right-0 w-80 bg-white shadow-xl`) with all NAV_ITEMS and their children as a flat list with `ChevronLeft` icons. Close on backdrop click. Also render a fixed **bottom action bar** (`md:hidden fixed bottom-0 inset-x-0 bg-white border-t`): `Church` icon → `/masses`, `Stethoscope` → `/clinics/status`, `Phone` → `tel:` of church office (placeholder from env `NEXT_PUBLIC_CHURCH_PHONE`).

- [ ] **Step 3: Footer**

Server component: church name + three link columns (قداسات/عيادات/تواصل), the church address line (العصافرة - الإسكندرية), and `© {new Date().getFullYear()} كنيسة القديسين مكسيموس ودوماديوس والأنبا موسى الأسود`.

- [ ] **Step 4: Mount in layout & verify**

Wrap `{children}` between `<Header/>` and `<Footer/>` in `src/app/layout.tsx`. Run dev server; verify: date strip shows Coptic date, dropdown works, drawer opens/closes on a 375px viewport, bottom bar navigates.

- [ ] **Step 5: Commit**

```powershell
git add src/components/layout src/app/layout.tsx
git commit -m "feat: site chrome - RTL header with Coptic date strip, mobile drawer, footer"
```

---

### Task 5: Database schema migration (Phase-1 tables)

**Files:**
- Create: `supabase/migrations/0001_schema.sql`

**Interfaces:**
- Produces: tables `altars`, `clergy`, `mass_schedules`, `clinic_specialties`, `clinic_doctors`, `doctor_schedule_slots`, `doctor_absences`, `condolence_bookings`, `contact_messages`, `donation_accounts`, `profiles`. Later tasks query these via the typed client. Column definitions are copied verbatim from `BACKEND_AND_DATA_SPEC.md` §2 with the modifications below.

- [ ] **Step 1: Write the migration**

Take the DDL from BACKEND_AND_DATA_SPEC.md §2 (lines 44–354) **including only** the Phase-1 tables listed above, with these changes:

1. Add the `profiles` table:

```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name_ar VARCHAR(200) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'secretary'
        CHECK (role IN ('admin', 'clinic_servant', 'secretary')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

2. **Exclude** `schedule_details_ar` from `clinic_doctors` (Spec Fix #4 — structured `doctor_schedule_slots` is the source of truth).
3. Keep every other column, enum (`day_of_week_enum`, `booking_status_enum`, `contact_urgency_enum`), and index from the spec verbatim. Drop `education_level_enum` (unused in Phase 1).
4. FKs already enforce referential consistency for priest references — no additional triggers needed beyond `updated_at`.
5. Add `updated_at` auto-touch trigger on all tables having the column:

```sql
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
-- then per table:
CREATE TRIGGER trg_touch_altars BEFORE UPDATE ON altars
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
-- (repeat for clergy, mass_schedules, clinic_specialties, clinic_doctors,
--  church_meetings [not in phase 1 — skip], condolence_bookings, profiles)
```

- [ ] **Step 2: Validate SQL locally**

Run: `npx supabase start` (Docker required), then `npx supabase db reset` with the migration in `supabase/migrations/`. Expected: migration applies with no errors. If Docker is unavailable on this machine, validate by pasting the DDL into the Supabase cloud SQL editor once the project is created (Task 5 Step 3) and note which path was taken.

- [ ] **Step 3: Create the Supabase cloud project**

Do this in the Supabase dashboard (manual, user-assisted): create project `church-maximos-portal`, copy URL + anon key + service role key into `.env.local`. Apply `0001_schema.sql` via the SQL editor. This step requires the user's Supabase account — **pause and ask the user to do this before continuing.**

- [ ] **Step 4: Generate typed database types**

```powershell
npx supabase gen types typescript --project-id <PROJECT_ID> > src/types/database.types.ts
```

(Fallback if CLI auth is problematic: use the dashboard "API" → "TypeScript" generator and paste into the file.) Add a `src/lib/supabase/database.ts` that re-exports `Database` as the generic parameter type used by all clients in Task 6.

- [ ] **Step 5: Commit**

```powershell
git add supabase/migrations/0001_schema.sql src/types/database.types.ts src/lib/supabase/database.ts
git commit -m "feat(db): phase-1 schema with profiles/roles table, drops deprecated doctor free-text schedule"
```

---

### Task 6: Supabase clients (SSR pattern) + middleware

**Files:**
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/admin.ts`, `src/middleware.ts`

**Interfaces:**
- Produces:
  - `createClient()` (browser) — from `client.ts`
  - `createServerSupabaseClient()` — async, from `server.ts` (uses `cookies()` from `next/headers`)
  - `createAdminClient()` — from `admin.ts` (service-role key; **server-side only**, used exclusively in Task 10 admin writes where RLS would block service operations)
  - `middleware(request)` — refreshes auth session cookies via `@supabase/ssr` pattern and redirects unauthenticated users hitting `/admin/*` (except `/admin/login`) to `/admin/login`.

- [ ] **Step 1: Browser client**

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 2: Server client**

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

export async function createServerSupabaseClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options));
          } catch { /* called from a Server Component — middleware handles refresh */ }
        },
      },
    },
  );
}
```

- [ ] **Step 3: Admin client**

```typescript
// src/lib/supabase/admin.ts — SERVER ONLY. Never import from a client component.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
```

- [ ] **Step 4: Middleware**

```typescript
// src/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options));
        },
      },
    },
  );
  const { data: { user } } = await supabase.auth.getUser();
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin") &&
    !request.nextUrl.pathname.startsWith("/admin/login");
  if (isAdminRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"] };
```

- [ ] **Step 5: Verify**

Create a throwaway server component rendering `const supabase = await createServerSupabaseClient(); const { error } = await supabase.from("altars").select("id").limit(1); JSON.stringify(error)`. Run dev server; expect `null` error (RLS public read comes in Task 7 — until then the default Supabase policy set may return data or an RLS error; either result proves the client wiring works). Delete the throwaway before commit.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/supabase src/middleware.ts
git commit -m "feat: @supabase/ssr clients (browser/server/admin) and auth middleware guard for /admin"
```

---

### Task 7: Role-based RLS + rate-limit migration

**Files:**
- Create: `supabase/migrations/0002_rls.sql`, `supabase/migrations/0003_rate_limits.sql`

**Interfaces:**
- Produces: RLS behavior that later code depends on:
  - Public `SELECT` on all active content tables (as in BACKEND_AND_DATA_SPEC.md §4).
  - Public `INSERT` on `condolence_bookings` (only `status='pending'`) and `contact_messages` — **but see Task 8: inserts go through server actions using the anon key, so these policies are what make inserts work**.
  - Role-gated writes: `admin` full access everywhere; `clinic_servant` write only on `doctor_absences` + read on clinic tables; `secretary` write on `condolence_bookings`, `contact_messages`, `mass_schedules`.
  - DB function `check_rate_limit(p_action TEXT, p_identifier TEXT, p_max INT, p_window INTERVAL) RETURNS BOOLEAN` used by both public server actions.

- [ ] **Step 1: Write `0002_rls.sql`**

Enable RLS on all Phase-1 tables (as spec §4). Helper functions:

```sql
CREATE OR REPLACE FUNCTION current_role_name() RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION has_role(roles TEXT[]) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ANY(roles)
  );
$$;
```

Public read policies — identical to spec §4 lines 401–413 for the tables we created, e.g.:

```sql
CREATE POLICY "Public read active altars" ON altars FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read doctor absences" ON doctor_absences
  FOR SELECT USING (absence_date >= CURRENT_DATE - INTERVAL '2 days');
```

Public inserts (rate limiting happens at the app layer calling `check_rate_limit` first; the policy itself only constrains row shape):

```sql
CREATE POLICY "Public can submit condolence booking" ON condolence_bookings
  FOR INSERT WITH CHECK (status = 'pending');

CREATE POLICY "Public can submit contact message" ON contact_messages
  FOR INSERT WITH CHECK (status IS NULL OR TRUE); -- table has no status column; WITH CHECK (TRUE)
```

(Note: `contact_messages` has no `status` column — use `WITH CHECK (TRUE)`.)

Role-gated policies (replacing the spec's blanket `authenticated USING (TRUE)`):

```sql
-- admin: everything
CREATE POLICY "admin full access on altars" ON altars
  FOR ALL TO authenticated USING (has_role(ARRAY['admin'])) WITH CHECK (has_role(ARRAY['admin']));
-- ...repeat for every phase-1 table...

-- clinic_servant: toggle absences only
CREATE POLICY "clinic_servant manage absences" ON doctor_absences
  FOR ALL TO authenticated USING (has_role(ARRAY['admin','clinic_servant']))
  WITH CHECK (has_role(ARRAY['admin','clinic_servant']));

-- secretary: bookings, messages, mass schedules
CREATE POLICY "secretary manage bookings" ON condolence_bookings
  FOR ALL TO authenticated USING (has_role(ARRAY['admin','secretary']))
  WITH CHECK (has_role(ARRAY['admin','secretary']));
CREATE POLICY "secretary manage messages" ON contact_messages
  FOR ALL TO authenticated USING (has_role(ARRAY['admin','secretary']))
  WITH CHECK (has_role(ARRAY['admin','secretary']));
CREATE POLICY "secretary manage mass schedules" ON mass_schedules
  FOR ALL TO authenticated USING (has_role(ARRAY['admin','secretary']))
  WITH CHECK (has_role(ARRAY['admin','secretary']));
```

`profiles`: users can `SELECT` their own row; only `admin` can write all rows:

```sql
CREATE POLICY "users read own profile" ON profiles FOR SELECT TO authenticated USING (id = auth.uid() OR has_role(ARRAY['admin']));
CREATE POLICY "admin manage profiles" ON profiles FOR ALL TO authenticated USING (has_role(ARRAY['admin'])) WITH CHECK (has_role(ARRAY['admin']));
```

- [ ] **Step 2: Write `0003_rate_limits.sql`**

```sql
CREATE TABLE rate_limits (
    identifier VARCHAR(64) NOT NULL,   -- sha256(ip + action), hex-truncated
    action VARCHAR(50) NOT NULL,       -- 'condolence_booking' | 'contact_message'
    window_start TIMESTAMPTZ NOT NULL,
    hit_count INT NOT NULL DEFAULT 1,
    PRIMARY KEY (identifier, action, window_start)
);

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_action TEXT, p_identifier TEXT, p_max INT, p_window INTERVAL
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_ws TIMESTAMPTZ := date_trunc('hour', NOW());
  v_count INT;
BEGIN
  INSERT INTO rate_limits (identifier, action, window_start, hit_count)
  VALUES (p_identifier, p_action, v_ws, 1)
  ON CONFLICT (identifier, action, window_start)
  DO UPDATE SET hit_count = rate_limits.hit_count + 1
  RETURNING hit_count INTO v_count;
  RETURN v_count <= p_max;
END;
$$;

GRANT EXECUTE ON FUNCTION check_rate_limit(TEXT, TEXT, INT, INTERVAL) TO anon;
```

- [ ] **Step 3: Apply to cloud project + verify**

Apply both migrations in the Supabase SQL editor (or `supabase db push`). Verify with three SQL editor runs: (a) anon select on `altars` returns rows, (b) anon insert into `condolence_bookings` with `status:'approved'` is rejected by policy, (c) `SELECT check_rate_limit('test','abc',5,'1 hour')` returns true 5 times then false (6th call).

- [ ] **Step 4: Commit**

```powershell
git add supabase/migrations/0002_rls.sql supabase/migrations/0003_rate_limits.sql
git commit -m "feat(db): role-based RLS (admin/clinic_servant/secretary) and DB rate limiting"
```

---

### Task 8: Zod schemas + rate-limit helper (TDD)

**Files:**
- Create: `src/lib/validations/church-schemas.ts`, `src/lib/utils/rate-limit.ts`
- Test: `src/lib/validations/church-schemas.test.ts`

**Interfaces:**
- Produces:
  - `CondolenceBookingSchema` / `CondolenceBookingInput`
  - `ContactMessageSchema` / `ContactMessageInput`
  - `DoctorAbsenceSchema` / `DoctorAbsenceInput`
  - `isRateLimited(supabase, action: string, ip: string, max = 5): Promise<boolean>` — hashes `ip` (sha-256 → 64 hex chars, truncated to 64) with the action, calls `check_rate_limit`, returns `true` when the caller should be rejected.

- [ ] **Step 1: Write failing tests for the schemas**

`src/lib/validations/church-schemas.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { CondolenceBookingSchema, ContactMessageSchema } from "./church-schemas";

describe("CondolenceBookingSchema", () => {
  const valid = {
    deceasedFullName: "مجدي إبراهيم حنا",
    applicantName: "أنا ستيفن",
    applicantPhone: "01223334445",
    relationshipToDeceased: "ابن المتوفى",
    eventDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    specialRequests: "",
    honeypot: "",
  };

  it("accepts a valid booking", () => {
    expect(CondolenceBookingSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects a non-Egyptian phone", () => {
    expect(CondolenceBookingSchema.safeParse({ ...valid, applicantPhone: "05512345678" }).success).toBe(false);
  });
  it("rejects a past event date", () => {
    expect(CondolenceBookingSchema.safeParse({ ...valid, eventDate: "2020-01-01" }).success).toBe(false);
  });
  it("rejects a filled honeypot (bot)", () => {
    expect(CondolenceBookingSchema.safeParse({ ...valid, honeypot: "spam" }).success).toBe(false);
  });
});

describe("ContactMessageSchema", () => {
  it("accepts a valid message and rejects one under 10 chars", () => {
    const base = { senderName: "مينا", senderPhone: "01012345678", messageContent: "رسالة روحية أرجو التواصل", urgency: "normal", senderEmail: "", assignedPriestId: "", honeypot: "" };
    expect(ContactMessageSchema.safeParse(base).success).toBe(true);
    expect(ContactMessageSchema.safeParse({ ...base, messageContent: "قصيرة" }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test` → FAIL (module missing).

- [ ] **Step 3: Implement schemas**

Copy the three schemas from BACKEND_AND_DATA_SPEC.md §5.1 with these changes: add `honeypot: z.literal("").optional()` to the two public forms; `eventDate` refine compares against today's midnight, not "now" (so today's date is bookable); keep the Egyptian phone regex `/^01[0125][0-9]{8}$/`.

- [ ] **Step 4: Implement `rate-limit.ts`**

```typescript
import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function isRateLimited(
  supabase: SupabaseClient<Database>,
  action: string,
  ip: string,
  max = 5,
): Promise<boolean> {
  const identifier = createHash("sha256").update(`${ip}:${action}`).digest("hex").slice(0, 64);
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_action: action,
    p_identifier: identifier,
    p_max: max,
    p_window: "1 hour",
  });
  if (error) return true; // fail closed
  return data === false;
}
```

- [ ] **Step 5: Run tests green, then commit**

```powershell
npm test
git add src/lib/validations src/lib/utils/rate-limit.ts
git commit -m "feat: public-form Zod schemas with honeypot + DB-backed rate limiter (TDD)"
```

---

### Task 9: Public pages — masses, clinics, donations, home

**Files:**
- Create: `src/app/masses/page.tsx`, `src/app/clinics/page.tsx`, `src/app/clinics/doctors/page.tsx`, `src/app/clinics/status/page.tsx`, `src/app/donations/page.tsx`
- Create: `src/components/masses/WeeklyMassTable.tsx`, `src/components/clinics/{SpecialtyCard,DoctorCard,AbsenceAlertStrip}.tsx`
- Modify: `src/app/page.tsx` (home)

**Interfaces:**
- Consumes: `createServerSupabaseClient` (Task 6), UI primitives (Task 3), `Breadcrumb` + page anatomy.
- Produces: ISR pages per the Route Matrix (INFORMATION_ARCHITECTURE.md §3 rows 01, 05–09, 44).

- [ ] **Step 1: Masses page (`/masses`, ISR 300s)**

```tsx
// src/app/masses/page.tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { WeeklyMassTable } from "@/components/masses/WeeklyMassTable";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

export const revalidate = 300;

const DAY_ORDER = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"] as const;
const DAY_AR = { Sunday:"الأحد", Monday:"الإثنين", Tuesday:"الثلاثاء", Wednesday:"الأربعاء", Thursday:"الخميس", Friday:"الجمعة", Saturday:"السبت" } as const;

export default async function MassesPage() {
  const supabase = await createServerSupabaseClient();
  const [{ data: masses }, { data: altars }, { data: clergy }] = await Promise.all([
    supabase.from("mass_schedules").select("*, altars(name_ar), clergy(clerical_name_ar)").eq("is_active", true),
    supabase.from("altars").select("id, name_ar").eq("is_active", true),
    supabase.from("clergy").select("id, clerical_name_ar").eq("is_active", true),
  ]);
  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <Breadcrumb items={[{ label: "القداسات", href: "/masses" }]} />
      <h1 className="font-kufi text-3xl text-copticNavy mb-2">جداول القداسات الإلهية</h1>
      <p className="text-slate-500 mb-6">مواعيد القداسات الأسبوعية على مذابح الكنيسة الثلاثة</p>
      <WeeklyMassTable
        masses={masses ?? []}
        altars={altars ?? []}
        clergy={clergy ?? []}
        dayOrder={DAY_ORDER}
        dayAr={DAY_AR}
      />
    </main>
  );
}
```

`WeeklyMassTable` (client component) groups by `day_of_week` using `dayOrder`, renders a day-tab filter + altar filter `<select>`, each row shows title, time range (`start_time`–`end_time` formatted 12h Arabic, e.g. `٦:٠٠ ص - ٨:٣٠ ص` via `toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" })`), altar name, celebrant. Add a print button (`window.print()`) and `@media print` CSS in globals.css hiding chrome.

- [ ] **Step 2: Clinics overview (`/clinics`, ISR 60s)**

Fetch `clinic_specialties` (active, ordered by `display_order`) and today's absences. Render `SpecialtyCard` grid (icon via a `icon_name → Lucide component` map in `src/components/clinics/icons.ts`; the 14 icon names from seed data: Activity, Baby, Bone, Scissors, HeartPulse, Smile, Eye, Ear, Sparkles, Accessibility, Heart, Brain, FlaskConical, Pill). Top of page: `<AbsenceAlertStrip absences={...} />`.

- [ ] **Step 3: Doctors page (`/clinics/doctors`, ISR 60s)**

Join `clinic_doctors` with `doctor_schedule_slots` (NOT `schedule_details_ar` — dropped in Task 5). `DoctorCard` shows photo placeholder, name, title, sub-specialty, slots grouped by day (Arabic day names), today's absence badge if `doctor_absences` has a row for `CURRENT_DATE`. Absence badge: `<Badge tone="red">معتذر اليوم</Badge>`, otherwise `<Badge tone="green">متواجد وفق الجدول</Badge>` (only on days the doctor actually has a slot).

- [ ] **Step 4: Live status page (`/clinics/status`, dynamic)**

`export const dynamic = "force-dynamic"`. Query absences for today + tomorrow (the 2-day window matches RLS). Render a full-width strip: green "لا توجد اعتذارات اليوم — جميع العيادات تعمل بانتظام" or red alert cards per absent doctor with reason. Auto-refresh via a client `<StatusRefresher intervalMs={60000} />` component that calls `router.refresh()`.

- [ ] **Step 5: Donations page (`/donations`, static)**

Fetch `donation_accounts` (active). Each `OfficialBankCard`: bank name, account title, account number + copy button (client component using `navigator.clipboard.writeText`), IBAN + copy, SWIFT, purpose. **Site-mode gate:** if `process.env.NEXT_PUBLIC_SITE_MODE !== "production"`, render a top banner `بيانات الحسابات مؤقتة وغير موثقة — لا تحول أي مبالغ قبل التوثيق الرسمي من سكرتارية الكنيسة`. Include the PRD 3.7.4 warning about unregistered collectors.

- [ ] **Step 6: Home page (`/`, ISR 60s)**

Sections: hero (navy gradient with gold accents, church name, next-mass countdown placeholder text "القداس القادم" — compute client-side from a passed-in schedule JSON via a `<NextMassCountdown>` client component), `AbsenceAlertStrip` (today's absences), quick-links grid (قداسات / عيادات / حجز عزاء / تبرعات / اتصال), and the day's Coptic date from Task 2.

- [ ] **Step 7: Manual verification checklist**

With seed data applied (Task 11 may run before this step if needed): every page loads in Arabic RTL, breadcrumbs render, mass day-filter works, absence strip shows red for the seeded absence, print view on `/masses` is clean, `/clinics/status` refreshes.

- [ ] **Step 8: Commit**

```powershell
git add src/app src/components/masses src/components/clinics
git commit -m "feat: phase-1 public pages - masses, clinics (3), donations, home"
```

---

### Task 10: Public forms — condolence booking & contact (Server Actions)

**Files:**
- Create: `src/app/actions/condolence-actions.ts`, `src/app/actions/contact-actions.ts`
- Create: `src/components/forms/CondolenceForm.tsx`, `src/components/forms/ContactForm.tsx`
- Create: `src/app/condolence/page.tsx`, `src/app/contact/page.tsx`

**Interfaces:**
- Consumes: schemas + `isRateLimited` (Task 8), `createServerSupabaseClient` (Task 6).
- Produces: `submitCondolenceBooking(input: CondolenceBookingInput, ip: string): Promise<ActionResult>` and `submitContactMessage(input: ContactMessageInput, ip: string): Promise<ActionResult>` where `ActionResult = { success: true; message: string; bookingCode?: string } | { success: false; message: string; errors?: Record<string, string[]> }`.

- [ ] **Step 1: Condolence server action**

```typescript
// src/app/actions/condolence-actions.ts
"use server";

import { cookies, headers } from "next/headers";
import { revalidateTag } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CondolenceBookingSchema, type CondolenceBookingInput } from "@/lib/validations/church-schemas";
import { isRateLimited } from "@/lib/utils/rate-limit";
import { customAlphabet } from "nanoid";

const refCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

export async function submitCondolenceBooking(input: CondolenceBookingInput) {
  const parsed = CondolenceBookingSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, message: "بيانات الاستمارة غير مكتملة، يرجى المراجعة",
      errors: parsed.error.flatten().fieldErrors };
  }
  if (parsed.data.honeypot) return { success: false as const, message: "طلب غير صالح" };

  const supabase = await createServerSupabaseClient();
  const hdrs = headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (await isRateLimited(supabase, "condolence_booking", ip, 3)) {
    return { success: false as const,
      message: "لقد أرسلت عدة طلبات مؤخراً، يرجى التواصل هاتفياً مع السكرتارية" };
  }

  const code = `COND-${refCode()}`;
  const { error } = await supabase.from("condolence_bookings").insert({
    booking_reference_code: code,
    deceased_full_name: parsed.data.deceasedFullName,
    applicant_name: parsed.data.applicantName,
    applicant_phone: parsed.data.applicantPhone,
    relationship_to_deceased: parsed.data.relationshipToDeceased,
    event_date: parsed.data.eventDate,
    special_requests: parsed.data.specialRequests || null,
    status: "pending",
  });
  if (error) {
    return { success: false as const,
      message: "تعذر إتمام طلب الحجز حالياً، يرجى المحاولة لاحقاً أو الاتصال بالسكرتارية" };
  }
  revalidateTag("condolence_bookings");
  return { success: true as const, bookingCode: code,
    message: "تم تسجيل طلب الحجز بنجاح. كود الطلب: " + code + ". ستتواصل معك السكرتارية هاتفياً للتأكيد" };
}
```

(`headers()` is awaited-compatible in Next 14; if the project lands on Next 15+, change to `await headers()`.)

- [ ] **Step 2: Contact server action**

Same pattern: `ContactMessageSchema` → honeypot check → rate limit (5/hr, action `contact_message`) → insert into `contact_messages` → return generic success message. No `revalidateTag` (admin reads live).

- [ ] **Step 3: CondolenceForm (client)**

`react-hook-form` + `@hookform/resolvers/zod` with `CondolenceBookingSchema`. Fields per PRD 3.7.1: deceased name, applicant name, phone, relationship, event date (`<input type="date">`), special requests (textarea, optional), hidden honeypot input (`name="honeypot"` styled `absolute -left-[9999px] aria-hidden`). Above the form: rules accordion (منع التدخين، الهدوء الوقور، منع المصورين الخارجيين). On success show the booking code prominently; on failure show field errors under inputs (`text-statusRed text-sm`).

- [ ] **Step 4: ContactForm (client)**

Fields: name, phone, optional email, urgency `<select>` (عادية / رعوية عاجلة / طلب اجتماع اعتراف / طارئة), message. Same RHF+Zod wiring.

- [ ] **Step 5: Pages**

`/condolence` and `/contact` pages: Breadcrumb, h1, brief intro paragraph from PRD 3.7.1 / 3.7.4 tone, form, and church office phone (env `NEXT_PUBLIC_CHURCH_PHONE`) as fallback.

- [ ] **Step 6: Manual verification**

Submit the condolence form with valid data → success + code appears; check Supabase table has the row with `status='pending'`. Submit with past date → Arabic validation error. Submit 4 times rapidly → 4th blocked by rate limiter. Fill honeypot via devtools → generic failure, no row.

- [ ] **Step 7: Commit**

```powershell
git add src/app/condolence src/app/contact src/app/actions src/components/forms
git commit -m "feat: condolence booking and contact forms with Zod validation, honeypot, rate limiting"
```

---

### Task 11: Seed data (placeholder-marked)

**Files:**
- Create: `supabase/migrations/0004_seed.sql`

**Interfaces:**
- Produces: rows the Task 9/10 pages render. All clergy phone/WhatsApp numbers and all bank account/IBAN/SWIFT values from AI_DEVELOPER_PROMPT_AND_GUIDELINES.md §4 are carried over **as placeholders** with a header comment:

- [ ] **Step 1: Write seed migration**

Copy the seed SQL from AI_DEVELOPER_PROMPT_AND_GUIDELINES.md §4 with these changes:

1. Header comment at the top:

```sql
-- ⚠️ PLACEHOLDER DATA ⚠️
-- Clergy phone numbers and ALL bank account details are UNVERIFIED placeholders.
-- Before production: obtain verified numbers and bank letters from the church
-- secretary, replace below, and set NEXT_PUBLIC_SITE_MODE=production.
```

2. Omit the `schedule_details_ar` column from `clinic_doctors` inserts (column dropped); instead insert matching `doctor_schedule_slots` rows derived from the free-text schedule (e.g. 'الأحد والثلاثاء من 6:00 م حتى 9:00 م' → two slot rows: Sunday 18:00–21:00, Tuesday 18:00–21:00).
3. Add one demo absence (so the status strip has something to show in dev):

```sql
INSERT INTO doctor_absences (doctor_id, absence_date, reason_ar)
SELECT id, CURRENT_DATE, 'اعتذار مؤقت للعرض في بيئة التطوير'
FROM clinic_doctors WHERE full_name_ar = 'أ.د. بيتر عادل إسكندر';
```

4. Skip the `church_meetings`, `schools_academies` seed blocks (Phase 2 tables don't exist).

- [ ] **Step 2: Apply and verify**

Apply via SQL editor / `supabase db push`; then load `/clinics/doctors` and confirm the demo absence badge renders, `/donations` shows the placeholder warning banner, `/masses` shows the four seeded masses.

- [ ] **Step 3: Commit**

```powershell
git add supabase/migrations/0004_seed.sql
git commit -m "feat(db): phase-1 seed data with explicit placeholder warnings on phones and bank accounts"
```

---

### Task 12: Admin panel — login, dashboard, clinic toggle, bookings

**Files:**
- Create: `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`, `src/app/admin/login/page.tsx`, `src/app/admin/clinics/page.tsx`, `src/app/admin/bookings/page.tsx`
- Create: `src/app/admin/actions.ts` (server actions: `toggleAbsence`, `removeAbsence`, `approveBooking`, `rejectBooking`)

**Interfaces:**
- Consumes: middleware guard (Task 6), `createServerSupabaseClient` (Task 6), `DoctorAbsenceSchema` (Task 8).
- Produces: an authenticated admin area where `admin`/`clinic_servant` roles toggle doctor absences, and `admin`/`secretary` review condolence bookings.

- [ ] **Step 1: Login page**

Client component; `supabase.auth.signInWithPassword({ email, password })` via the browser client; on success `router.push("/admin")`. Note on the page: "الدخول مخصص لخدام الكنيسة فقط".

- [ ] **Step 2: Admin layout**

Server component; calls `supabase.auth.getUser()`; if no user (belt-and-braces with middleware), `redirect("/admin/login")`. Loads the profile and renders the role in the sidebar (`دورك: مشرف عام / خادم عيادات / سكرتارية`). Sidebar links: لوحة القيادة `/admin`, العيادات `/admin/clinics`, الحجوزات `/admin/bookings`, تسجيل الخروج (client `signOut`).

- [ ] **Step 3: Clinic toggle page**

Server component fetches all active doctors + slots + today's absences. For each doctor scheduled today: a client `<AbsenceToggle doctorId name isAbsent reasonInput/>` that calls the `toggleAbsence` server action. Server action: `await assertRole(["admin","clinic_servant"])` (helper in `src/app/admin/actions.ts` — loads profile via `supabase.from("profiles").select("role").eq("id", user.id).single()`; returns 403-shaped `{ success: false, message: "غير مصرح" }` on mismatch), validate with `DoctorAbsenceSchema`, insert/delete in `doctor_absences`, then `revalidateTag("clinic_absences"); revalidatePath("/clinics/status")` and `/clinics/doctors`. Immediate effect on public pages is the PRD's core "نبض العيادات" requirement — verify it end-to-end.

- [ ] **Step 4: Bookings review page**

Server component lists `condolence_bookings` ordered by `created_at desc` with status badges (pending=yellow, approved=green, rejected=red). Approve/reject server actions (role-gated `["admin","secretary"]`) set `status`, `rejection_reason`, `approved_by_priest_id` (leave null in Phase 1 — priest selection UI is Phase 2; record approving admin email in a comment-free way via `updated_at` only), then `revalidatePath("/admin/bookings")`.

- [ ] **Step 5: Dashboard page**

Counts: pending bookings, unread messages, today's absences. Three cards linking to the respective pages.

- [ ] **Step 6: Bootstrap the first admin (manual)**

In Supabase dashboard: Authentication → Add user (church secretary's email). Then SQL editor:

```sql
INSERT INTO profiles (id, full_name_ar, role)
SELECT id, 'أول مشرف', 'admin' FROM auth.users WHERE email = 'that-email';
```

- [ ] **Step 7: End-to-end verification**

1. Logged out → `/admin` redirects to login.
2. Login as admin → dashboard shows counts.
3. Toggle a doctor absent on `/admin/clinics` → open `/clinics/status` in another tab → red alert appears immediately (after revalidate).
4. Approve a pending booking from Task 10 testing → status changes, reference code visible.
5. Create a second user with role `secretary` → verify they can access bookings but `/admin/clinics` toggle returns "غير مصرح".

- [ ] **Step 8: Commit**

```powershell
git add src/app/admin
git commit -m "feat: admin panel - role-gated clinic absence toggles and booking approvals"
```

---

### Task 13: SEO metadata, sitemap, final checks

**Files:**
- Modify: `src/app/layout.tsx` and every `page.tsx` (per-page `metadata`)
- Create: `src/app/sitemap.ts`, `src/app/robots.ts`

**Interfaces:**
- Produces: complete Arabic metadata per route, generated `sitemap.xml`/`robots.txt`.

- [ ] **Step 1: Per-page metadata**

Each page exports `export const metadata: Metadata = { title: "...", description: "..." }` — Arabic titles verbatim from the Route Matrix (INFORMATION_ARCHITECTURE.md §3, rows 01, 05–10, 41, 44, 45). Add `openGraph` with `locale: "ar_EG", type: "website"` on layout. Add `Church` JSON-LD on the home page:

```tsx
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Church",
  name: "كنيسة القديسين مكسيموس ودوماديوس والشهيد الأنبا موسى الأسود",
  address: { "@type": "PostalAddress", addressLocality: "العصافرة", addressRegion: "الإسكندرية", addressCountry: "EG" },
};
// <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
```

- [ ] **Step 2: sitemap.ts / robots.ts**

```typescript
// src/app/sitemap.ts
import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/masses", "/clinics", "/clinics/doctors", "/clinics/status", "/condolence", "/contact", "/donations"];
  return routes.map((r) => ({
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.org"}${r}`,
    lastModified: new Date(),
  }));
}
```

Add `NEXT_PUBLIC_SITE_URL` to `.env.example`. `robots.ts`: allow all, disallow `/admin`, sitemap pointer.

- [ ] **Step 3: Full pass**

`npm run build` → zero type errors, all routes prerender/dynamic as designed. `npm test` green. Run dev server and walk every route once (/, /masses, /clinics, /clinics/doctors, /clinics/status, /condolence, /contact, /donations, /admin/*). Check `<html dir="rtl">`, Lighthouse mobile spot-check (aim: >90 performance on the masses page).

- [ ] **Step 4: Commit**

```powershell
git add src/app .env.example
git commit -m "feat: SEO metadata, JSON-LD Church schema, sitemap and robots"
```

---

## Phase 2+ (explicitly deferred — do NOT build now)

- Bible reader (`/bible`) — needs a licensed Arabic Coptic Bible text source; separate sub-project.
- Meetings (11 routes), education (5), activities (7), services (8) — template-driven `[slug]` pages once content is ready.
- Live stream page, news articles, WhatsApp notification subscriptions, priest assignment on bookings, analytics, CI/CD pipeline, Playwright e2e.
- Cloudflare Turnstile (rate limiter + honeypot is the Phase-1 bar).

## Self-Review Notes

- Spec coverage: Phase-1 routes from the Route Matrix are rows 01, 05, 06, 07, 08, 09, 41, 44, 45 + `/admin`. All have tasks. Rows 02–04, 10–40, 42–43 deferred per the agreed MVP cut.
- All four spec defects fixed: `@supabase/ssr` (Task 6), role RLS (Task 7), rate limiting + honeypot (Tasks 7–8), schedule single-source-of-truth (Tasks 5, 9, 11).
- Coptic calendar anchors (Task 2) corrected on 2026-09-14 after verification against Wikipedia's Nayrouz rule, the St. Anthony Maadi daily Coptic calendar, and Egyptian press coverage of Nayrouz 1743; the original draft had wrong dates (e.g. it placed the leap day on 2024-09-11; it is 2027-09-11) and a year-walk algorithm that could overshoot — both replaced with verified values and cumulative-day arithmetic, hand-checked against JDN computations.
- Placeholder scan: the only "placeholder" language is intentional seed data warnings (Task 11), which is the fix itself.
- Type consistency: `ActionResult` shape defined in Task 10 matches form consumers; `has_role`/`check_rate_limit` SQL signatures match Tasks 7/8 call sites; `getCopticDate` consumed in Task 4 as defined in Task 2.
