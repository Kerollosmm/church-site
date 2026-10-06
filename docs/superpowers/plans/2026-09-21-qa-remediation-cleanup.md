# QA Remediation & Staff Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve all 7 remaining defects and field observations from QA run `QA-2026-09-21` (P2-1, P2-2, P3-1, P3-2, P3-3, P3-4, P3-5) and execute safe staff cleanup of test records in Supabase while strictly preserving the immutable `audit_log`.

**Architecture:** 
1. Separate admin-side mass queries from public SSG/offline fallback to ensure the admin dashboard reflects true database state without seed masquerading. Seed authentic parish baseline masses into Supabase.
2. Unify admin authentication into a robust single-round-trip navigation using full window location assignment to eliminate client-side router cache staleness.
3. Enhance accessibility and ARIA semantics across admin modals (`AdminVideoModal`) and public controls (`FontSizeSwitcher`).
4. Extend audit logging to public contact form submissions using `@church-site/domain` types.
5. Secure public dynamic content routes against unbounded query timeouts using `dynamicParams = false` and cookie-free public Supabase clients.
6. Provide explicit UI disclosure regarding email delivery across all public forms.
7. Execute surgical, idempotent SQL cleanup of test artifacts tagged `QA-2026-09-21`.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (PostgreSQL + RLS), Vitest, Playwright, Tailwind CSS.

## Global Constraints

- **INV-01 Invariant**: Decouple public community services from private internal parish ERPs. Zero-auth public access.
- **Audit Invariant**: `audit_log` is append-only and immutable; NEVER delete or truncate `audit_log`.
- **Zero "use server" pollution**: Keep server action modules containing only `async` functions; place shared types/schemas in `.shared.ts`.
- **Zero-cookie public reads**: Public pages and repositories must never invoke `cookies()`.

---

### Task 1: P3-1: Accessibility Hardening for Admin Video Modal

**Files:**
- Modify: `apps/admin/src/app/(protected)/videos/AdminVideoModal.tsx:135-165`
- Test: `apps/admin/src/app/(protected)/videos/__tests__/AdminVideoModal.test.tsx`

**Interfaces:**
- Consumes: `AdminVideoModalProps`
- Produces: Accessible modal dialog element with `role="dialog"`, `aria-modal="true"`, `aria-labelledby="video-modal-title"`, and heading `id="video-modal-title"`.

- [ ] **Step 1: Write the failing unit test**

Create `apps/admin/src/app/(protected)/videos/__tests__/AdminVideoModal.test.tsx`:
```tsx
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminVideoModal } from "../AdminVideoModal";

describe("AdminVideoModal Accessibility", () => {
  it("renders with role='dialog', aria-modal='true', and correct accessible title", () => {
    render(
      <AdminVideoModal
        isOpen={true}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "video-modal-title");

    const title = screen.getByText("إضافة فيديو كنسي جديد");
    expect(title).toHaveAttribute("id", "video-modal-title");

    const closeButton = screen.getByLabelText("إغلاق");
    expect(closeButton).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter admin test AdminVideoModal.test.tsx`
Expected: FAIL with missing dialog role or accessible attributes.

- [ ] **Step 3: Update `AdminVideoModal.tsx` markup**

In `apps/admin/src/app/(protected)/videos/AdminVideoModal.tsx`, update the modal container, heading, and close button:
```tsx
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden animate-fade-in">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-copticGold-100 text-copticGold-800 flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 id="video-modal-title" className="font-heading font-bold text-base text-slate-900">
                {isEditing ? "تعديل فيديو كنسي" : "إضافة فيديو كنسي جديد"}
              </h3>
              <p className="text-xs text-slate-500">
                إدراج رابط فيديو خارجي موثوق لعرضه على الموقع العام
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter admin test AdminVideoModal.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/app/(protected)/videos/AdminVideoModal.tsx apps/admin/src/app/(protected)/videos/__tests__/AdminVideoModal.test.tsx
git commit -m "fix(admin): add role dialog and aria labels to AdminVideoModal (P3-1)"
```

---

### Task 2: P3-5: Accessibility Labels for Font Size Switcher

**Files:**
- Modify: `packages/ui/src/components/FontSizeSwitcher.tsx:35-70`
- Test: `packages/ui/src/components/__tests__/FontSizeSwitcher.test.tsx`

**Interfaces:**
- Consumes: `FontSizeSwitcherProps`
- Produces: Buttons with explicit `aria-label`, `title`, and `data-font-size-btn` attributes.

- [ ] **Step 1: Write the failing unit test**

Create `packages/ui/src/components/__tests__/FontSizeSwitcher.test.tsx`:
```tsx
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FontSizeSwitcher } from "../FontSizeSwitcher";

describe("FontSizeSwitcher Accessibility", () => {
  it("renders buttons with explicit aria-label and data attributes", () => {
    render(<FontSizeSwitcher />);

    const group = screen.getByRole("group", { name: "تغيير حجم خط الموقع" });
    expect(group).toBeInTheDocument();

    const normalBtn = screen.getByRole("button", { name: "حجم الخط العادي" });
    const largeBtn = screen.getByRole("button", { name: "حجم الخط كبير" });
    const xlargeBtn = screen.getByRole("button", { name: "حجم الخط كبير جداً" });

    expect(normalBtn).toHaveAttribute("data-font-size-btn", "normal");
    expect(largeBtn).toHaveAttribute("data-font-size-btn", "large");
    expect(xlargeBtn).toHaveAttribute("data-font-size-btn", "xlarge");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @church-site/ui test FontSizeSwitcher.test.tsx`
Expected: FAIL (buttons currently have text `أ`, `أ+`, `أ++` without accessible name matching title).

- [ ] **Step 3: Update `FontSizeSwitcher.tsx`**

In `packages/ui/src/components/FontSizeSwitcher.tsx`:
```tsx
          <button
            key={opt.value}
            type="button"
            title={opt.title}
            aria-label={opt.title}
            aria-pressed={isActive}
            data-font-size-btn={opt.value}
            onClick={() => setSize(opt.value)}
            className={cn(
              "px-2 py-0.5 text-xs font-heading font-semibold transition-all rounded-lg select-none",
              isActive
                ? "bg-copticNavy-500 text-white shadow-xs"
                : "text-copticGold-800 hover:text-copticNavy-700 hover:bg-copticGold-100"
            )}
          >
            {opt.label}
          </button>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @church-site/ui test FontSizeSwitcher.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/FontSizeSwitcher.tsx packages/ui/src/components/__tests__/FontSizeSwitcher.test.tsx
git commit -m "fix(ui): add aria-label and data attributes to FontSizeSwitcher (P3-5)"
```

---

### Task 3: P3-2: Audit Log Integration for Contact Form Submissions

**Files:**
- Modify: `packages/domain/src/types.ts:100-125`
- Modify: `apps/web/src/actions/contact-actions.ts:35-65`
- Test: `apps/web/src/actions/__tests__/contact-actions.test.ts`

**Interfaces:**
- Consumes: `ContactMessageInput`
- Produces: Entry in `contact_messages` AND audit entry via `recordAuditLog({ entityType: "contact_message", action: "create" })`.

- [ ] **Step 1: Write the failing unit test**

Create `apps/web/src/actions/__tests__/contact-actions.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers({ "x-forwarded-for": "127.0.0.1" })),
}));

vi.mock("@/lib/security/turnstile", () => ({
  verifyTurnstile: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/security/rate-limit", () => ({
  RATE_LIMIT_MESSAGE_AR: "تم تجاوز المعدل",
  checkPublicWriteRateLimit: vi.fn().mockReturnValue({ allowed: true }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

const mockAuditLog = vi.fn();
vi.mock("@church-site/data-access", () => ({
  recordAuditLog: (...args: unknown[]) => mockAuditLog(...args),
  snapshot: (val: unknown) => val,
}));

const mockInsert = vi.fn().mockResolvedValue({ error: null });
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      insert: mockInsert,
    }),
  }),
}));

describe("submitContactMessage Audit Log", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("records an audit_log entry upon successful message submission", async () => {
    const { submitContactMessage } = await import("../contact-actions");
    const res = await submitContactMessage({
      senderName: "يوحنا سامي",
      senderPhone: "01234567890",
      senderEmail: "yohanna@example.com",
      urgency: "normal",
      messageContent: "رسالة استفسار روحية",
      turnstileToken: "token-ok",
    });

    expect(res.success).toBe(true);
    expect(mockAuditLog).toHaveBeenCalledTimes(1);
    expect(mockAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "create",
        entityType: "contact_message",
        summary: expect.stringContaining("يوحنا سامي"),
      })
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test contact-actions.test.ts`
Expected: FAIL (missing `mockAuditLog` call or `contact_message` type).

- [ ] **Step 3: Update `packages/domain/src/types.ts` and `apps/web/src/actions/contact-actions.ts`**

In `packages/domain/src/types.ts`:
Add `"contact_message"` to `AuditEntityType` union and `AUDIT_ENTITY_TYPE_LABELS_AR`:
```ts
export type AuditEntityType =
  | "event"
  | "event_series"
  | "event_exception"
  | "taxonomy_term"
  | "event_terms"
  | "media"
  | "subscriber"
  | "mass"
  | "content_type"
  | "content_field"
  | "content_entry"
  | "video"
  | "service"
  | "navigation"
  | "asset"
  | "booking"
  | "contact_message";

export const AUDIT_ENTITY_TYPE_LABELS_AR: Record<AuditEntityType, string> = {
  // ... existing
  contact_message: "رسالة تواصل",
};
```

In `apps/web/src/actions/contact-actions.ts`:
```ts
import { recordAuditLog, snapshot } from "@church-site/data-access";
// inside submitContactMessage after successful insert:
    const messageId = `msg-${Date.now()}`;
    await recordAuditLog({
      actor: { id: null, name: `زائر الموقع (نموذج التواصل) — ${result.data.senderName}` },
      action: "create",
      entityType: "contact_message",
      entityId: messageId,
      before: null,
      summary: `رسالة تواصل جديدة من «${result.data.senderName}» (الأهمية: ${result.data.urgency})`,
      after: snapshot({
        senderName: result.data.senderName,
        senderPhone: result.data.senderPhone,
        senderEmail: result.data.senderEmail || null,
        urgency: result.data.urgency,
      }),
    });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test contact-actions.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/domain/src/types.ts apps/web/src/actions/contact-actions.ts apps/web/src/actions/__tests__/contact-actions.test.ts
git commit -m "feat(contact): record audit_log entry for contact form submissions (P3-2)"
```

---

### Task 4: P3-3: Fix Dynamic Content Route Timeout on Unknown Types

**Files:**
- Modify: `apps/web/src/app/content/[type]/page.tsx:20-40`
- Modify: `packages/data-access/src/store/content-supabase-driver.ts:105-115`
- Test: `apps/web/src/app/content/__tests__/content-type-page.test.tsx`

**Interfaces:**
- Consumes: URL param `{ type: string }`
- Produces: Instant 404 for unknown content types (e.g. `/content/article`) without `cookies()` invocation or timeout.

- [ ] **Step 1: Write test verifying instant 404 for non-existent content types**

Create `apps/web/src/app/content/__tests__/content-type-page.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";

vi.mock("next/navigation", () => ({
  notFound: vi.fn().mockImplementation(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/lib/store", () => ({
  getContentTypeRepository: () => ({
    getContentTypeBySlug: vi.fn().mockResolvedValue(null),
    listContentTypes: vi.fn().mockResolvedValue([]),
  }),
}));

describe("ContentTypeListingPage route", () => {
  it("invokes notFound() immediately when content type does not exist", async () => {
    const { default: ContentTypeListingPage } = await import("../[type]/page");
    await expect(
      ContentTypeListingPage({ params: Promise.resolve({ type: "article" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
```

- [ ] **Step 2: Run test to verify behavior**

Run: `pnpm --filter web test content-type-page.test.tsx`

- [ ] **Step 3: Update `apps/web/src/app/content/[type]/page.tsx` and `content-supabase-driver.ts`**

In `apps/web/src/app/content/[type]/page.tsx`:
Add `export const dynamicParams = false;` so unknown content type slugs return an instant 404 without server-side hanging.

In `packages/data-access/src/store/content-supabase-driver.ts`:
```ts
  private async client(): Promise<StoreClient> {
    // For read operations in public SSR/ISR, use cookie-free client
    return createPublicSupabaseClient();
  }

  private async adminClient(): Promise<StoreClient> {
    // For admin mutations, use service-role or session client
    return createAdminClient();
  }
```
Update mutating methods (`createContentType`, `updateContentType`, etc.) to use `this.adminClient()`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test content-type-page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/content/[type]/page.tsx packages/data-access/src/store/content-supabase-driver.ts apps/web/src/app/content/__tests__/content-type-page.test.tsx
git commit -m "fix(web): prevent timeout on legacy content paths with dynamicParams false and cookie-free client (P3-3)"
```

---

### Task 5: P3-4: Consistent Email Delivery Disclosure Across Public Forms

**Files:**
- Modify: `apps/web/src/app/contact/ContactForm.tsx:55-80`
- Test: `apps/web/src/app/contact/__tests__/ContactFormDisclosure.test.tsx`

**Interfaces:**
- Consumes: Public visitor contact form
- Produces: Subtle notice clarifying that contact responses occur via phone/WhatsApp and automated emails are not sent.

- [ ] **Step 1: Write test for disclosure presence**

Create `apps/web/src/app/contact/__tests__/ContactFormDisclosure.test.tsx`:
```tsx
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ContactForm } from "../ContactForm";

describe("ContactForm Email Disclosure", () => {
  it("renders honest delivery disclosure explaining response methods", () => {
    render(<ContactForm />);
    expect(
      screen.getByText(/المتابعة تتم هاتفياً أو عبر واتساب/i)
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test ContactFormDisclosure.test.tsx`
Expected: FAIL

- [ ] **Step 3: Update `ContactForm.tsx`**

In `apps/web/src/app/contact/ContactForm.tsx`, add disclosure banner above or below form submit:
```tsx
      <div className="rounded-2xl border border-amber-300 bg-amber-50/70 p-3 text-[11px] leading-relaxed text-amber-900 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p>
          ملاحظة: المتابعة تتم هاتفياً أو عبر واتساب من سكرتارية الكنيسة أو الآباء الكهنة. لا تُرسل رسائل بريد إلكتروني آلية حالياً من هذا الموقع.
        </p>
      </div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test ContactFormDisclosure.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/contact/ContactForm.tsx apps/web/src/app/contact/__tests__/ContactFormDisclosure.test.tsx
git commit -m "fix(contact): add honest email delivery disclosure to ContactForm (P3-4)"
```

---

### Task 6: P2-2: Streamline Admin Login Navigation & Eliminate Redirect Quirk

**Files:**
- Modify: `apps/admin/src/app/login/AdminLoginForm.tsx:25-45`
- Modify: `apps/admin/src/actions/auth-actions.ts:25-67`
- Test: `apps/admin/src/app/login/__tests__/AdminLoginForm.test.tsx`

**Interfaces:**
- Consumes: Staff login credentials
- Produces: Clean single-round-trip sign in with `window.location.assign(res.targetUrl)` to prevent Next.js client-cache reload quirks.

- [ ] **Step 1: Write test for navigation behavior**

Create `apps/admin/src/app/login/__tests__/AdminLoginForm.test.tsx`:
```tsx
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AdminLoginForm } from "../AdminLoginForm";

const mockSignIn = vi.fn();
vi.mock("@/actions/auth-actions", () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
  confirmSessionAction: vi.fn(),
}));

describe("AdminLoginForm submit", () => {
  it("uses window.location.assign on successful sign-in", async () => {
    const originalLocation = window.location;
    const assignMock = vi.fn();
    delete (window as any).location;
    (window as any).location = { assign: assignMock, href: "" };

    mockSignIn.mockResolvedValue({ success: true, targetUrl: "/masses" });

    render(<AdminLoginForm />);
    fireEvent.change(screen.getByLabelText(/البريد الإلكتروني الرسمي/i), {
      target: { value: "admin@saintsmaximos.org" },
    });
    fireEvent.change(screen.getByLabelText(/كلمة المرور/i), {
      target: { value: "SecretPass123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /تسجيل الدخول/i }));

    await waitFor(() => {
      expect(assignMock).toHaveBeenCalledWith("/masses");
    });

    (window as any).location = originalLocation;
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter admin test AdminLoginForm.test.tsx`
Expected: FAIL (currently calls `confirmSessionAction` and `router.replace`).

- [ ] **Step 3: Update `auth-actions.ts` and `AdminLoginForm.tsx`**

In `apps/admin/src/actions/auth-actions.ts`:
In `signIn`, include `targetUrl = "/masses"` in the returned success object and invoke `revalidatePath('/', 'layout')` before returning `{ success: true, targetUrl: "/masses" }`.

In `apps/admin/src/app/login/AdminLoginForm.tsx`:
```tsx
    setSubmitting(true);
    try {
      const res = await signIn(parsed.data);
      if (!res.success) {
        setError(res.message ?? "تعذر تسجيل الدخول، يرجى المحاولة مرة أخرى");
        return;
      }
      const target = (res as any).targetUrl || "/masses";
      window.location.assign(target);
    } catch {
      setError("تعذر الاتصال بخدمة الدخول حالياً، يرجى المحاولة لاحقاً");
    } finally {
      setSubmitting(false);
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter admin test AdminLoginForm.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/actions/auth-actions.ts apps/admin/src/app/login/AdminLoginForm.tsx apps/admin/src/app/login/__tests__/AdminLoginForm.test.tsx
git commit -m "fix(admin): streamline login navigation to window.location.assign eliminating redirect quirk (P2-2)"
```

---

### Task 7: P2-1: Accurate Admin Mass Counter & Database Mass Seeding

**Files:**
- Create: `packages/data-access/src/mass-admin.ts`
- Modify: `packages/data-access/src/index.ts`
- Modify: `apps/admin/src/app/(protected)/page.tsx:70-95`
- Modify: `apps/admin/src/app/(protected)/masses/page.tsx:20-30`
- Seed Script / SQL: `supabase/seed-masses.sql`
- Test: `packages/data-access/src/__tests__/mass-admin.test.ts`

**Interfaces:**
- Consumes: Supabase database connection
- Produces: `listAdminWeeklyMasses(): Promise<WeeklyMassRow[]>` that reads true DB rows (without seed fallback masking zero rows) for admin dashboard counters and tables.

- [ ] **Step 1: Write test for `listAdminWeeklyMasses`**

Create `packages/data-access/src/__tests__/mass-admin.test.ts`:
```ts
import { describe, it, expect, vi } from "vitest";

const mockSelect = vi.fn();
vi.mock("../supabase/server", () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({
    from: () => ({
      select: mockSelect,
    }),
  }),
}));

describe("listAdminWeeklyMasses", () => {
  it("queries mass_schedules directly without falling back to in-memory seeds", async () => {
    mockSelect.mockReturnValue({
      order: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });

    const { listAdminWeeklyMasses } = await import("../mass-admin");
    const result = await listAdminWeeklyMasses();
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @church-site/data-access test mass-admin.test.ts`

- [ ] **Step 3: Implement `packages/data-access/src/mass-admin.ts` and update Admin Page**

Create `packages/data-access/src/mass-admin.ts`:
```ts
import { createSupabaseServerClient } from "./supabase/server";
import { createAdminClient } from "./supabase/admin";
import type { WeeklyMassRow } from "./data/seed-data";

export async function listAdminWeeklyMasses(): Promise<WeeklyMassRow[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("mass_schedules")
      .select("*, altar:altars(id, name_ar, name_en), celebrant:clergy(id, clerical_name_ar, rank_title_ar)")
      .order("day_of_week")
      .order("start_time");

    if (error) {
      const admin = createAdminClient();
      const fallback = await admin
        .from("mass_schedules")
        .select("*, altar:altars(id, name_ar, name_en), celebrant:clergy(id, clerical_name_ar, rank_title_ar)")
        .order("day_of_week")
        .order("start_time");
      return (fallback.data as WeeklyMassRow[]) || [];
    }

    return (data as WeeklyMassRow[]) || [];
  } catch (err) {
    console.error("[mass-admin] query error:", err);
    return [];
  }
}
```

In `apps/admin/src/app/(protected)/page.tsx` and `apps/admin/src/app/(protected)/masses/page.tsx`:
Replace `getWeeklyMasses()` with `listAdminWeeklyMasses()`.
This guarantees that admin home counter and `/masses` table always display the exact count of rows physically present in Supabase!

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @church-site/data-access test mass-admin.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/data-access/src/mass-admin.ts packages/data-access/src/index.ts apps/admin/src/app/(protected)/page.tsx apps/admin/src/app/(protected)/masses/page.tsx packages/data-access/src/__tests__/mass-admin.test.ts
git commit -m "fix(admin): use direct database query for admin masses counter and schedule (P2-1)"
```

---

### Task 8: Staff Cleanup & Baseline Schedule Seeding in Supabase

**Files:**
- Database Query: Direct SQL execution via Supabase MCP
- Test: Verification SQL assertions

**Interfaces:**
- Input: Verified IDs of test artifacts
- Output: Deleted test records, rejected condolence booking, authentic 5 baseline parish masses seeded in Supabase, zero changes to `audit_log`.

- [ ] **Step 1: Execute test data cleanup SQL in Supabase**

Run SQL via `supabase:execute_sql`:
```sql
-- 1. Delete test mass schedule
DELETE FROM mass_schedules WHERE id = 'c842ded6-e6a6-437c-af1b-65a5ed699b80';

-- 2. Delete test parish video
DELETE FROM parish_videos WHERE id = '930616eb-82c3-4d50-9328-abce5a00a8d3';

-- 3. Reject condolence booking COND-U4WIID (and COND-IV3 if present)
UPDATE condolence_bookings 
SET status = 'rejected', updated_at = NOW() 
WHERE booking_reference_code IN ('COND-U4WIID', 'COND-IV3');

-- 4. Delete test subscribers
DELETE FROM subscribers 
WHERE email IN ('qa+test-qa-2026-09-21@example.com', 'qa+qa-2026-09-21-sub@example.com');

-- 5. Delete test contact message
DELETE FROM contact_messages 
WHERE sender_email = 'qa+qa-2026-09-21-contact@example.com';
```

- [ ] **Step 2: Seed the 5 authentic baseline parish masses into Supabase**

Run SQL via `supabase:execute_sql`:
```sql
INSERT INTO mass_schedules (id, altar_id, celebrant_priest_id, day_of_week, title_ar, start_time, end_time, target_group_ar, notes_ar, is_seasonal, is_active)
VALUES
  ('m0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Sunday', 'قداس الأحد الصباحي الأول', '06:00:00', '08:30:00', 'عام لجميع الشعب', 'مصحوب بكلمة روحية قصيرة وعرض ألحان الشمامسة بمشاركة كورال الكنيسة.', false, true),
  ('m0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'Sunday', 'قداس الأحد الصباحي الثاني', '08:30:00', '11:00:00', 'طلبة الجامعات والأسر', 'ينعقد بالتوازي مع مدارس الأحد الصباحية في مبنى الخدمات.', false, true),
  ('m0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'Wednesday', 'قداس الأربعاء الباكر', '05:30:00', '07:30:00', 'الموظفين وأصحاب الأعمال والطلبة', 'ينتهي باكراً لإتاحة الفرصة للذهاب للعمل والدراسة.', false, true),
  ('m0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Friday', 'قداس الجمعة الرئيسي الشامل', '07:00:00', '09:30:00', 'شعب الكنيسة وأسر التربية الكنسية', 'يليه مباشرة اجتماعات مدارس الأحد لكافة المراحل والخدمات.', false, true),
  ('m0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'Saturday', 'قداس السبت الصباحي', '07:30:00', '10:00:00', 'عام لجميع الشعب والمسنين', 'يسبقه رفع بخور باكر وصلاة المزامير.', false, true)
ON CONFLICT (id) DO NOTHING;
```

- [ ] **Step 3: Verify clean database state**

Run SQL via `supabase:execute_sql`:
```sql
SELECT 'mass_schedules' AS tbl, count(*) FROM mass_schedules
UNION ALL
SELECT 'parish_videos' AS tbl, count(*) FROM parish_videos WHERE title_ar LIKE '%QA-2026-09-21%'
UNION ALL
SELECT 'subscribers' AS tbl, count(*) FROM subscribers WHERE email LIKE '%qa%'
UNION ALL
SELECT 'contact_messages' AS tbl, count(*) FROM contact_messages WHERE sender_email LIKE '%qa%';
```
Expected: `mass_schedules` = 5, `parish_videos` = 0 test rows, `subscribers` = 0 test rows, `contact_messages` = 0 test rows.

---

### Task 9: Full Quality Gates Verification & Memory Bank Update

**Files:**
- Modify: `memory-bank/activeContext.md`
- Modify: `memory-bank/progress.md`

- [ ] **Step 1: Run type checking across entire monorepo**

Run: `pnpm typecheck`
Expected: 0 errors across all 5 workspace projects.

- [ ] **Step 2: Run lint check**

Run: `pnpm run lint`
Expected: 0 errors, 0 warnings.

- [ ] **Step 3: Run full Vitest suite**

Run: `pnpm test`
Expected: All tests pass (>= 785/785 passing).

- [ ] **Step 4: Run production builds**

Run: `pnpm --filter web build && pnpm --filter admin build`
Expected: Both builds succeed cleanly.

- [ ] **Step 5: Synchronize Memory Bank**

Update `memory-bank/activeContext.md` and `memory-bank/progress.md` with the resolution of all P2/P3 defects, the clean database state, and the passing gates.

---

## Verification Plan

### Automated Tests
- `pnpm test` — Run full unit and regression test suite (48+ files).
- `pnpm typecheck` — Full workspace type checking.
- `pnpm run lint` — ESLint strict verification.
- `pnpm --filter web build` & `pnpm --filter admin build` — Production compilation verification.

### Manual Verification
1. Access admin dashboard `/` and verify Weekly Masses count displays **5** and matches `/masses` table.
2. Submit admin login from `/login` and confirm instant redirect to `/masses` without manual reload.
3. Open admin video modal and inspect element for `role="dialog" aria-modal="true" aria-labelledby="video-modal-title"`.
4. Submit public `/contact` form and verify new row in `/audit` with actor `زائر الموقع (نموذج التواصل)`.
5. Visit `/content/article` and verify clean, instant 404 response.
6. Verify font size switcher buttons announce accessible labels.
