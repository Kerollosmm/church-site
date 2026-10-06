---
name: parish-portal-qa
description: Full live QA / smoke-test suite for the Coptic Orthodox Parish Portal (Church of Sts. Maximus, Domadius & Anba Moses the Black). Use whenever the user asks to test / smoke / QA / regression the parish web portal + admin dashboard, provides the three cloudflare tunnel links, references the church memory bank (`activeContext.md`, `productContext.md`, `progress.md`, `projectbrief.md`, `systemPatterns.md`, `techContext.md`), or asks to verify features live on the site after a deploy. Drives a real headless Chromium (Playwright) — logs into the admin, sweeps every public + admin route, submits the three public write forms (subscribe / condolence / contact), attempts admin CREATE flows for masses and videos, verifies public→admin propagation via `/subscribers` + `/audit`, screenshots everything full-page at 1440px, and produces a detailed bilingual pass/fail report. Not for running the church's unit-test suite (`pnpm test` in the repo) — this is a black-box live-URL test.
---

# Parish Portal — Live QA Skill

Reusable, one-shot, end-to-end test harness for the parish portal + admin dashboard. Idempotent: every write is tagged with the run's date so cleanup is trivial and repeat runs never collide.

## When to load

- User asks: "test the site", "smoke test", "QA", "regression", "verify feature X on the live site", "make sure the deploy works" — for the parish / church / كنيسة / بوابة رعوية project.
- User provides two cloudflare tunnel URLs (`*.trycloudflare.com`) for `apps/web` and `apps/admin`, or explicit `Public Portal:` / `Admin Dashboard:` / `Admin Login:` lines.
- User attaches or references the memory bank (`activeContext.md`, `productContext.md`, `progress.md`, `projectbrief.md`, `systemPatterns.md`, `techContext.md`).

Do NOT load for: running `pnpm test` / `vitest` inside the repo, editing the codebase, or Google Docs / Sheets requests.

## Inputs the skill needs (ask if missing — one `question` form)

1. **Public portal URL** (Cloudflare tunnel — `*.trycloudflare.com`).
2. **Admin dashboard URL** (separate tunnel).
3. **Admin login URL** (usually `<admin>/login`).
4. **Admin email** — the memory bank's working account is `admin@saintsmaximos.org`.
5. **Admin password**.
6. (Optional) memory bank files attached — read them first for feature list + spec.

If the user already gave the URLs and credentials, execute immediately.

## Architecture reminders (from the memory bank — DO NOT contradict)

- **INV-01 (non-negotiable):** the public site is zero-auth. Every route under `apps/web` must return 200 without any cookies. Any admin write flow lives ONLY on the admin subdomain (`apps/admin`).
- The stack is Next.js 15 App Router + Supabase (PostgreSQL 15+ via `@supabase/ssr`) + React Hook Form + Zod + Tailwind + Shadcn/ui, RTL-first, `Africa/Cairo` timezone.
- Admin routes live at admin-app root (`/`, `/masses`, `/events`, …) — **NOT** under `/admin/*`. The `/admin/*` prefix was retired in the Phase-1 monorepo split.
- The admin login form `AdminLoginForm` calls the `signIn()` server action and uses `window.location.assign()` for an instant, clean redirect to `/masses`. Keep `page.reload()` only as a secondary safety fallback for slow networks.
- Rejected-credential message (honest, fail-closed): *«بيانات الدخول غير صحيحة، يرجى التأكد من البريد الإلكتروني وكلمة المرور»*.
- Public write endpoints exist for: `/subscribe`, `/condolence`, `/contact`. Each posts a Next.js server action. The condolence success banner MUST contain a `COND-XXXXXX` reference code (spec).
- Admin dashboard routes to sweep (10 areas): `/`, `/masses`, `/events`, `/services`, `/navigation`, `/videos`, `/media`, `/subscribers`, `/content-types`, `/audit`.

## Workflow (execute top-to-bottom, in ONE turn)

### 0. Prepare the sandbox

Install Playwright + Chromium once — the sandbox usually needs both:

```bash
pip install --quiet playwright
python3 -m playwright install chromium
sudo python3 -m playwright install-deps chromium
```

If the install fails partway (`libatk-1.0.so.0` etc.), rerun `install-deps` — the deps are missing more often than the browser binary is.

Create output folder:

```bash
mkdir -p /home/user/workspace/qa-run/screenshots
```

### 1. Quick liveness check (before spending time)

```bash
for url in <public> <admin> <admin>/login; do
  curl -sS -o /dev/null -w "HTTP %{http_code} | %{time_total}s | $url\n" "$url"
done
```

Expect `200` / `307` codes and `<15s` responses. If Cloudflare returns 502/524 the tunnel is dead — tell the user honestly, don't proceed.

### 2. Public sweep + read screenshots (`scripts/public_sweep.py`)

Sweeps 14 real routes + 4 known-legacy paths (they SHOULD 404), catalogs header/footer navigation, tests the day-of-week filter on `/masses`, checks the font-size switcher, and dumps form field catalogs for `/subscribe`, `/condolence`, `/contact`.

Note the "expected 404s" — they are intentional per spec drift:
- `/clinics` (clinics feature was retired)
- `/donate` (canonical is `/donations`)
- `/schedule` (canonical is `/masses`)
- `/stream` (canonical is `/live`)

Reporting them as failures is a false alarm.

### 3. Admin login + admin sweep (`scripts/admin_probe.py`)

1. GET `/login`.
2. Fill `#staff-email` + `#staff-password`, click `button[type="submit"]`.
3. Wait for URL to move off `/login` OR — if stuck — `page.reload()`, then poll again.
4. On success the site auto-redirects to `/masses`. Confirm sidebar shows the account email and role badge («مالك» = owner, «سكرتارية» = editor).
5. Sweep the 10 admin routes, screenshot each full-page at 1440×900.

### 4. End-to-end CREATE / verify (`scripts/e2e_create.py`)

**Public writes (idempotent, tagged with `QA-<yyyy-mm-dd>`):**
- `/subscribe` — POST with `qa+qa-<date>-sub@example.com` + a topic checkbox.
- `/condolence` — POST with `المرحوم اختبار QA-<date>` + phone + a date `+30 days`.
- `/contact` — POST with a tagged message.

Then log in as admin and confirm:
- `/subscribers` lists the new email under actor «زائر الموقع (نموذج الاشتراك)».
- `/audit` shows two fresh `إنشاء` rows.
- Condolence success banner contains `COND-XXXXXX`.

**Admin writes (may fail — treat as bug discovery, not test failure):**
- `/masses` → «+ إضافة قداس جديد» modal — fields have NO `name` attributes, select by placeholder (`input[placeholder*='قداس الأحد الصباحي']`, `textarea[placeholder*='يسبق القداس']`, etc.). Save button: `button:has-text('إضافة القداس')`.
- `/videos` → «+ إضافة فيديو جديد» modal — URL field `input[type='url']`, then `input[placeholder*='قداس عيد القيامة']` for the Arabic title. Save button: `button:has-text('إضافة الفيديو')`.

Resolved Historical Regressions (Verified Fixed):
- **Mass CREATE:** Verified passing, adds row to admin table, immediately publicly visible on Sunday tab.
- **Video CREATE:** Verified passing, modal has full ARIA attributes (`role="dialog"`, `aria-labelledby="video-modal-title"`), row saved as published+active, immediately visible on `/about`.

### 5. Screenshot discipline

- Always full-page (`page.screenshot(..., full_page=True)`).
- Viewport 1440×900, locale `ar-EG`.
- Set default timeout to 90s and default navigation timeout to 90s (Cloudflare tunnels are slow).
- Use `wait_until="domcontentloaded"` (NOT `networkidle`) then `wait_for_load_state("networkidle", timeout=15000)` swallowing the timeout — some pages keep long-polling forever and `networkidle` never resolves.
- Read screenshots back for visual verification: the `Read` tool on a PNG returns the image to the model.

### 6. Compile the bilingual report

Use `scripts/report_template.md` as the outline. It must contain:

1. Executive verdict table (Public read / Public write / Admin login / Admin sweep / Admin CREATE / Public→admin propagation).
2. Route sweep table with HTTP status, `<h1>`, and screenshot name.
3. Public write proof: real success banners quoted verbatim in Arabic, with the `COND-XXXXXX` reference if seen.
4. Admin dashboard walkthrough: 10 areas, one line each.
5. **Bugs & improvements** grouped by severity (P0 / P1 / P2 / P3), each with an evidence screenshot name.
6. Cleanup instructions — exactly which rows to delete so the church staff can purge the test data.
7. Artefact list: screenshots (count), scripts, logs.

### 7. Deliver

```
genspark_deliver_files:
  - TEST-REPORT.md (the compiled report)
  - screenshots.zip (all full-page PNGs)
  - evidence-bundle.zip (the three probe scripts + raw run logs)
  - a hand-picked subset of critical screenshots individually
    (home page, admin home, subscribers-after, audit-after,
     condolence-success, contact-success, any P0 bug screenshot)
```

## Critical gotchas that cost me an hour the first time

1. **Admin form modal selectors & inputs:** While placeholder selectors (`input[placeholder*='...']`) work well, modals now feature full ARIA accessibility attributes: `role="dialog"`, `aria-labelledby="video-modal-title"`, `id="video-modal-title"`, and close button `aria-label="إغلاق"`.
2. **The "+ إضافة" button appears in TWO places** on the admin masses/videos pages: one at the top (the correct one that opens the modal) and one per-row (which is actually "edit"). Use `button:has-text('إضافة قداس جديد')` — the full string — not just `إضافة`.
3. **`page.wait_for_navigation` does NOT fire on client-side Supabase Auth.** Use `page.wait_for_url(re.compile(r"^(?!.*/login).*"))` instead.
4. **The subscribe form's success is a fresh full-page render** — don't look for a toast, look for the URL/body change and the presence of the QA email in the response body.
5. **Condolence success is on the SAME page** (not a redirect) with a green banner. Detect via the presence of `COND-` in the DOM text.
6. **The Cloudflare tunnel is genuinely slow** (5-90s per page). Never wrap `gsk`/`curl` with `timeout <30` — you'll false-alarm.
7. **Legacy 404 paths are correct behavior**, not defects. Cross-check every 404 against the "dropped features" list before flagging.
8. **'500' keyword false-positive:** The church phone number `03-5500000` contains '500' as a substring. Route sweep probes must match word boundary `r'(?<!\d)500(?!\d)'` or specific server error phrases ("500 Internal", "Server Error"), never raw substring '500'.
9. **Bible reader book elements:** The 73 books (46 OT, 27 NT) render as interactive client `<button>` elements (e.g. `button[data-book]` or grid buttons), NOT `<a>` links.
10. **`/content/article` 404 handling:** `dynamicParams` is disabled (`export const dynamicParams = false;`), returning a clean, instant 404 without database timeouts or cookie access.
11. **Email sending disclosure:** Automated email sending is disabled site-wide (`noopMailer`); an honest amber disclosure banner is displayed on `/contact` and `/subscribe` informing users that records are kept in parish logs and follow-up is manual.
12. **Contact form audit log:** Submitting the contact form creates a real-time row in `audit_log` with entity type `contact_message`.

## Files in this skill

- `scripts/public_sweep.py` — read-only probe of every public route + form field catalog + navigation catalog.
- `scripts/admin_probe.py` — admin login (with the reload workaround) + 10-route admin sweep.
- `scripts/e2e_create.py` — public writes + admin CREATE attempts + propagation verification.
- `scripts/report_template.md` — the report skeleton.

Copy each script into `/home/user/workspace/qa-run/` at the start of a run, edit the URL/credential constants at the top, then execute in order:

```bash
python3 public_sweep.py
python3 admin_probe.py
python3 e2e_create.py
```

Each writes its own `.txt` run-log next to itself. Combine them + the template into `TEST-REPORT.md` at the end.
